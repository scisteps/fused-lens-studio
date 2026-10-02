// src/lib/auth.js
//
// Member authentication for the public site.
//
// SCOPE — deliberately narrow:
//   * This handles MEMBER accounts only (signup / sign-in / sign-out).
//   * It is completely separate from the studio-side JWT login used by the
//     /admin/* dashboards (see server/routes/auth.js). The two never share a
//     session, so adding member auth cannot lock anyone out of the CMS.
//
// PHASE 1 (live now): email + password.
// PHASE 2 (needs Blaze): phone/OTP helpers at the bottom of this file. They are
//   already written and exported; they simply cannot succeed until the project
//   is on the pay-as-you-go plan and the Phone provider is enabled, because
//   Firebase sends real SMS.

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  signOut,
  // PHASE 2 — phone/OTP
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { app, db } from './firebase'
// The category is what decides student-vs-everyone-else, so the write and the
// rules agree on one definition of it (see data/signup.js). Likewise the
// portfolio links: cleaned here so the Firestore document and the sheet row
// carry byte-identical URLs.
import { isStudentCategory } from '../data/signup'
import {
  cleanPortfolioLinks,
  portfolioSummary,
  buildPublicEntry,
  MEMBER_PORTFOLIOS_COLLECTION,
  PORTFOLIO_LINKS
} from '../data/portfolio'
// The secretariat's sheet gets its own copy of every registration.
import { submitToSheet } from './googleSheet'

export const auth = getAuth(app)

// Registrations live in their own collection. They must NOT go into `members`,
// which powers the public Executive Committee page — that collection is
// re-synced destructively on publish (see publishService.publishCollection).
export const USERS_COLLECTION = 'users'

// ---------------------------------------------------------------------------
// Phone numbers
// ---------------------------------------------------------------------------

// Firebase accepts E.164 only. Ugandan numbers reach us in every shape:
// 0702624936, 256702624936, +256702624936, +256 702 624 936 …
export function toE164(raw, countryCode = '+256') {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  if (trimmed.startsWith('+')) return '+' + trimmed.replace(/\D/g, '')

  const digits = trimmed.replace(/\D/g, '')
  const cc = countryCode.replace('+', '')
  if (digits.startsWith('0')) return countryCode + digits.slice(1)
  if (digits.startsWith(cc)) return '+' + digits
  return countryCode + digits
}

// ---------------------------------------------------------------------------
// Error messages — Firebase codes are not user-facing
// ---------------------------------------------------------------------------

const MESSAGES = {
  'auth/email-already-in-use':
    'That email address is already registered. Try signing in instead.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/weak-password': 'Please choose a password of at least 6 characters.',
  'auth/user-not-found': 'No account was found with that email address.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests':
    'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed':
    'Network problem — check your connection and try again.',
  // PHASE 2
  'auth/invalid-phone-number': 'Please enter a valid phone number.',
  'auth/credential-already-in-use':
    'That phone number is already linked to a different account.',
  'auth/billing-not-enabled':
    'Phone sign-in is not available on this project yet (billing required).',
  'auth/unauthorized-domain':
    'This domain is not authorised for sign-in. Please contact the administrator.',
  'auth/quota-exceeded': 'SMS limit reached. Please try again later.',
  'auth/invalid-verification-code':
    'That code is not correct. Check the 6 digits and try again.',
  'auth/code-expired': 'That code has expired. Request a new one.',
  'auth/missing-verification-code': 'Please enter the 6-digit code.',
  // Firestore side of signup
  'permission-denied':
    'Your account was created but the profile could not be saved. Please contact the administrator.'
}

export function authErrorMessage(error) {
  if (!error) return ''
  return MESSAGES[error?.code] || error?.message || 'Something went wrong.'
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

// `form` is the raw SignUp form state. The document we write must satisfy
// isValidProfile() in firestore.rules, including the student/school rule.
export async function signUpWithEmail(form) {
  const {
    name,
    email,
    password,
    phone,
    countryCode,
    dateOfBirth,
    category,
    profession,
    school,
    portfolio
  } = form

  const normalisedEmail = String(email).trim().toLowerCase()
  // The country dropdown chooses the dialling code, so a Kenyan member typing
  // "0702 624 936" is stored as +254702624936 rather than a Ugandan +256… .
  const diallingCode = String(countryCode || '+256').trim()
  const normalisedPhone = toE164(phone, diallingCode)
  // The category is the single answer that decides the shape of the rest:
  // a student carries an institution, everyone else a profession.
  const student = isStudentCategory(category)
  // Portfolio links, normalised once and then reused for BOTH destinations, so
  // Firestore and the sheet can never disagree about a URL. Blank tiles are
  // dropped entirely rather than stored as empty strings.
  const portfolioLinks = cleanPortfolioLinks(portfolio)

  // 1. Create the auth account (this also signs the user in).
  const { user } = await createUserWithEmailAndPassword(
    auth,
    normalisedEmail,
    password
  )

  // 2. Display name — used by the hero/nav greeting.
  try {
    await updateProfile(user, { displayName: String(name).trim() })
  } catch {
    /* non-fatal */
  }

  // 3. Write users/{uid}.
  //
  // The profile is assembled once and used for BOTH documents below, so the
  // private record and the public portfolio card can never drift apart.
  const profile = {
    uid: user.uid,
    name: String(name).trim(),
    email: normalisedEmail,
    phone: normalisedPhone,
    // Kept alongside the E.164 `phone` so the secretariat knows which
    // country the member is in without reverse-engineering the prefix.
    countryCode: diallingCode,
    dateOfBirth,
    category: String(category || '').trim(),
    // The student checker: a student stores an institution and no profession,
    // everyone else the reverse. firestore.rules enforces the same pairing.
    isStudent: student,
    school: student ? String(school || '').trim() : null,
    profession: student ? null : String(profession || '').trim(),
    // The member's portfolio. A map keyed by platform id
    // (see PORTFOLIO_LINKS in data/portfolio.js), e.g.
    //   { linkedin: 'https://linkedin.com/in/jane', behance: 'https://…' }
    // Empty tiles are omitted, so an absent key means "not provided" —
    // never confuse that with a link that was pasted and left blank.
    portfolio: portfolioLinks,
    role: 'member', // never self-assigned as anything else
    status: 'pending',
    // Which version of their membership they are on. Every new member starts
    // on the 6-month free trial; the secretariat flips this to 'paid' in the
    // Firebase console once a receipt is confirmed. See lib/membershipPlan.js.
    plan: 'free',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  try {
    await setDoc(doc(db, USERS_COLLECTION, user.uid), profile)

    // 3b. The public portfolio card behind /portfolio. A SEPARATE document in
    // its own collection, holding only the shareable subset — never the email,
    // phone or date of birth above. See MEMBER_PORTFOLIOS_COLLECTION in
    // data/portfolio.js for why this cannot simply reuse `users`.
    //
    // Best-effort: if this write fails the account is still perfectly valid,
    // so the member must not be blocked by it. They would simply be absent
    // from the public listing until an admin re-publishes their card.
    try {
      await setDoc(
        doc(db, MEMBER_PORTFOLIOS_COLLECTION, user.uid),
        buildPublicEntry(profile)
      )
    } catch (publicError) {
      console.error('Portfolio card write failed', publicError)
    }
  } catch (error) {
    // Don't strand a half-registered account: the auth user exists but has no
    // profile, which is exactly the state that locks people out later.
    await signOut(auth).catch(() => {})
    throw error
  }

  // 4. Verification email — optional, must never block a completed signup.
  try {
    await sendEmailVerification(user)
  } catch {
    /* non-fatal */
  }

  // 5. The secretariat's sheet. Fire-and-forget on purpose: the account is
  // already created by this point, and a sheet outage must not turn a
  // successful registration into an error on screen. Firestore remains the
  // source of truth — this row is a convenience for the office.
  submitToSheet({
    type: 'signup',
    name: String(name).trim(),
    email: normalisedEmail,
    phone: normalisedPhone,
    countryCode: diallingCode,
    dateOfBirth,
    category: String(category || '').trim(),
    school: student ? String(school || '').trim() : '',
    profession: student ? '' : String(profession || '').trim(),
    // One column per platform, derived from PORTFOLIO_LINKS so adding a
    // platform in src/data/portfolio.js needs no change here. The column
    // names match SIGNUP_HEADERS in google-apps-script/Code.gs.
    ...Object.fromEntries(
      PORTFOLIO_LINKS.map((link) => [
        `portfolio${link.id.charAt(0).toUpperCase()}${link.id.slice(1)}`,
        portfolioLinks[link.id] || ''
      ])
    ),
    // …plus a joined summary, so the secretariat can sort and filter the
    // sheet by platform without reading six columns.
    portfolioSummary: portfolioSummary(portfolioLinks)
  }).catch(() => {
    /* the sheet is a copy, never the system of record */
  })

  return user
}

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, String(email).trim().toLowerCase(), password)

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, String(email).trim().toLowerCase())

export const logOut = () => signOut(auth)

// Returns the unsubscribe function.
export const watchAuth = (callback) => onAuthStateChanged(auth, callback)

// ---------------------------------------------------------------------------
// users/{uid} access
// ---------------------------------------------------------------------------

export async function fetchProfile(uid) {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Live profile subscription. Mirrors the fallback style used by useCollection.
export function subscribeProfile(uid, callback) {
  return onSnapshot(
    doc(db, USERS_COLLECTION, uid),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    (error) => {
      console.error(`subscribeProfile(${uid}) failed`, error)
      callback(null)
    }
  )
}

// ---------------------------------------------------------------------------
// PHASE 2 — phone / OTP. Requires: Blaze plan + Phone provider enabled + the
// calling domain listed under Authentication → Settings → Authorized domains.
// `containerId` is the id of an empty <div> in the form; reCAPTCHA renders
// into it. ALWAYS call verifier.clear() once the flow finishes or the next
// attempt fails with "reCAPTCHA has already been rendered in this element".
// ---------------------------------------------------------------------------

// Sign in an existing account with a phone number + SMS code. `countryCode`
// is the dialling code the visitor picked (see data/signup.js COUNTRY_CODES);
// it feeds toE164 so a Kenyan +254 number is not stored as a Ugandan one.
export async function sendPhoneOtp(phone, containerId, countryCode = '+256') {
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible'
  })
  try {
    const confirmation = await signInWithPhoneNumber(
      auth,
      toE164(phone, countryCode),
      verifier
    )
    return { confirmation, verifier }
  } catch (error) {
    // Free the reCAPTCHA slot, or every later attempt fails with
    // "reCAPTCHA has already been rendered in this element".
    try {
      verifier.clear()
    } catch {
      /* ignore */
    }
    throw error
  }
}

// Attach a phone number to the CURRENTLY signed-in account. This is what makes
// "sign in with either email or phone" reach the SAME account — without it,
// phone sign-in would silently create a second, duplicate account.
//
// `countryCode` is the dialling code the member picked on the sign-up form (see
// data/signup.js COUNTRY_CODES). It used to be omitted, so toE164 fell back to
// its '+256' default and every non-Ugandan member had their number filed under
// the wrong country — signing in with the number they actually chose then never
// matched. The failure was invisible for Ugandan members and total for everyone
// else.
export async function linkPhoneToCurrentUser(
  phone,
  containerId,
  countryCode = '+256'
) {
  if (!auth.currentUser) throw new Error('Not signed in.')
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible'
  })
  try {
    const confirmation = await linkWithPhoneNumber(
      auth.currentUser,
      toE164(phone, countryCode),
      verifier
    )
    return { confirmation, verifier }
  } catch (error) {
    // Free the reCAPTCHA slot, or every later attempt fails with
    // "reCAPTCHA has already been rendered in this element".
    try {
      verifier.clear()
    } catch {
      /* ignore */
    }
    throw error
  }
}

export const confirmOtp = (confirmation, code) => confirmation.confirm(code)

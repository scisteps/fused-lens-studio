// src/pages/SignUp.jsx
//
// Member registration. Writes the profile to users/{uid} in Firestore.
//
// The "student checker" runs twice on purpose:
//   1. Here, so the visitor gets an inline, friendly error.
//   2. In firestore.rules (isValidProfile), so the rule holds even if someone
//      bypasses this form and writes straight to Firestore with the public
//      API key. The client-side check is UX; the rule is the actual guarantee.

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Player } from '@lottiefiles/react-lottie-player'
import gsap from 'gsap'
import { useAuth } from '../lib/useAuth'
import {
  signUpWithEmail,
  authErrorMessage,
  linkPhoneToCurrentUser,
  confirmOtp
} from '../lib/auth'
import cranewalk from '../jsons/cranewalk.json'
import { requestMembershipIntent } from '../lib/membershipIntent'
import { BlurredBackdrop, ProfessionPicker, PortfolioLinks } from '../components'
import { heroSlides } from '../data/images'
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE,
  MEMBER_CATEGORIES,
  isStudentCategory
} from '../data/signup'
import {
  emptyPortfolio,
  isValidPortfolioUrl,
  portfolioCount,
  aboutWordCount,
  MAX_ABOUT_WORDS,
  PORTFOLIO_LINKS
} from '../data/portfolio'
import './Auth.css'

// Shared entrance motion for the auth cards.
const CARD_MOTION = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5,   }
}

// ── Crane walk tuning ────────────────────────────────────────────────────────
// All three values live here so you can retime the walk without hunting
// through the useEffect below.
const CRANE_TWEEN = {
  duration: 20,        // seconds for the full left → right crossing
  repeatDelay: 3,   // seconds the crane stays off-screen before re-entering
  overshoot: 0.15,    // fraction of the crane's own width past each edge
  loop: true          // set false for a single pass
}

// Blurred photo slideshow behind the card. Uses the static hero imagery rather
// than the CMS copy so the signup page still has a backdrop if Firestore is
// unreachable. De-duplicated because heroSlides reuses one photo twice.
const AUTH_BACKDROP_IMAGES = [
  ...new Set(heroSlides.map((slide) => slide.image).filter(Boolean))
]

// A factory, not a shared constant: `portfolio` is a nested object, and every
// fresh form needs its own copy of it.
function emptyForm() {
  return {
    // Personal details
    name: '',
    dateOfBirth: '',
    countryCode: DEFAULT_COUNTRY_CODE,
    phone: '',
    // Digital details
    email: '',
    password: '',
    confirmPassword: '',
    // Membership
    category: '',
    school: '',      // students only
    profession: '',  // everyone else
    // Portfolio — a { linkedin: '…', behance: '…' } map
    portfolio: emptyPortfolio(),
    // Optional "tell us about yourself" note (up to 50 words), shown on the
    // member's public portfolio card.
    about: ''
  }
}

function validate(form) {
  const errors = {}

  if (form.name.trim().length < 2) {
    errors.name = 'Please enter your full name.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  // Count digits only, so spaces / dashes / brackets are tolerated. The
  // dialling code is captured by the country dropdown, not typed here.
  const phoneDigits = form.phone.replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Enter a valid phone number, e.g. 0702 624 936.'
  }

  if (!form.dateOfBirth) {
    errors.dateOfBirth = 'Please enter your date of birth.'
  } else {
    const dob = new Date(form.dateOfBirth)
    const now = new Date()
    if (Number.isNaN(dob.getTime())) {
      errors.dateOfBirth = 'That date is not valid.'
    } else if (dob >= now) {
      errors.dateOfBirth = 'Your date of birth must be in the past.'
    } else if (
      dob < new Date(now.getFullYear() - 120, now.getMonth(), now.getDate())
    ) {
      errors.dateOfBirth = 'Please check the year you entered.'
    }
  }

  // ── Category, then the field it decides ──────────────────────────────────
  if (!form.category) {
    errors.category = 'Tell us which kind of member you are.'
  } else if (isStudentCategory(form.category)) {
    // A student names the institution instead of a profession.
    if (form.school.trim().length < 2) {
      errors.school = 'Please name your school or institution.'
    }
  } else if (form.profession.trim().length < 2) {
    errors.profession = 'Pick the profession that fits you best.'
  }

  if (form.password.length < 6) {
    errors.password = 'Use at least 6 characters.'
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'The two passwords do not match.'
  }

  // ── Portfolio ────────────────────────────────────────────────────────────
  if (portfolioCount(form.portfolio) === 0) {
    errors.portfolio = 'Please share at least one link to your work.'
  } else {
    PORTFOLIO_LINKS.forEach((link) => {
      const url = String(form.portfolio?.[link.id] || '').trim()
      if (url && !isValidPortfolioUrl(url)) {
        errors[`portfolio.${link.id}`] =
          'That does not look like a link — check the address.'
      }
    })
  }

  // ── About you (optional) ────────────────────────────────────────────────
  const aboutWords = aboutWordCount(form.about)
  if (aboutWords > MAX_ABOUT_WORDS) {
    errors.about = `That is ${aboutWords} words — please keep it to ${MAX_ABOUT_WORDS} or fewer.`
  }

  return errors
}

export function SignUp() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // GSAP drives the crane wrapper's transform. The element is measured at
  // mount so it starts fully off the left edge and exits fully off the right.
  // GSAP is the ONLY thing that touches the crane's transform — there is no
  // CSS animation on it (a CSS keyframe and a GSAP tween on the same property
  // fight each other).
  const craneRef = useRef(null)
  const trackRef = useRef(null)

  // Open the members area from the top so the walking crane is never cut off.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // ---------- Phone verification ----------
  // Firebase only records a phone number on the account once it has been proven
  // with an SMS code. Merely WRITING the number to users/{uid} (which
  // signUpWithEmail does) does not attach it to the auth account, so "sign in
  // with phone" would find no match and silently create a second, empty account.
  // This step is what actually links the two.
  const [verifyStep, setVerifyStep] = useState('idle') // idle | sending | verify
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpNotice, setOtpNotice] = useState('')
  const [linking, setLinking] = useState(false)
  const confirmationRef = useRef(null)
  const verifierRef = useRef(null)

  // The country code chosen on the form, held so the link call can reuse it.
  const [pendingPhone, setPendingPhone] = useState({ phone: '', countryCode: '' })

  const clearRecaptcha = () => {
    try {
      verifierRef.current?.clear()
    } catch {
      /* ignore */
    }
    verifierRef.current = null
  }

  // Release the reCAPTCHA slot when the page unmounts, so returning to a stale
  // form never fails with "reCAPTCHA has already been rendered in this element".
  useEffect(() => () => clearRecaptcha(), [])

  // ---------- Crane: off-screen left → across → off-screen right → loop ----------
  // The walkway only exists while the registration form is on screen. The
  // effect depends on `showForm` so it re-measures when the form (re)appears,
  // e.g. after a failed SMS step drops the member back to the form.
  const showForm = !authLoading && verifyStep === 'idle' && !user && !done

  useEffect(() => {
    const crane = craneRef.current
    const track = trackRef.current
    if (!showForm || !crane || !track) return undefined

    let tween
    let cancelled = false

    const start = () => {
      if (cancelled) return
      tween?.kill()

      const trackWidth = track.clientWidth
      const craneWidth = crane.offsetWidth
      if (!trackWidth || !craneWidth) return

      // Start fully off the LEFT edge (own width + a little overshoot),
      // end fully off the RIGHT edge (track width + the same overshoot).
      // The card's overflow:hidden does the actual clipping.
      const overshoot = craneWidth * CRANE_TWEEN.overshoot
      const startX = -craneWidth - overshoot
      const endX = trackWidth + overshoot

      // Reduced motion: park the crane centred, no walk.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(crane, { x: (trackWidth - craneWidth) / 2 })
        return
      }

      gsap.set(crane, { x: startX })

      tween = gsap.to(crane, {
        x: endX,
        duration: CRANE_TWEEN.duration,
        ease: 'none',
        repeat: CRANE_TWEEN.loop ? -1 : 0,
        repeatDelay: CRANE_TWEEN.repeatDelay
      })
    }

    // Wait for the Lottie player + card layout to settle before measuring,
    // otherwise the track reports 0 width and the crane never moves.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(start)
    })

    // Re-measure on resize so a rotated phone still gets the full track.
    window.addEventListener('resize', start)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', start)
      tween?.kill()
    }
  }, [showForm])

  const isStudent = isStudentCategory(form.category)

  // validate() keys the per-tile messages as `portfolio.<id>` so they sit
  // alongside every other field error. The picker wants them as a plain map
  // keyed by platform id, so lift them out here rather than making the picker
  // know about the error-naming convention.
  const portfolioFieldErrors = PORTFOLIO_LINKS.reduce((acc, link) => {
    const message = errors[`portfolio.${link.id}`]
    if (message) acc[link.id] = message
    return acc
  }, {})

  const update = (field) => (event) => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value

    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Switching category swaps the dependent field, so drop the one that no
      // longer applies. This is what keeps the profile valid for the rules
      // ("a student carries a school and no profession, and vice versa").
      if (field === 'category') {
        if (isStudentCategory(value)) next.profession = ''
        else next.school = ''
      }
      return next
    })

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      school: undefined,
      profession: undefined
    }))
  }

  // The profession picker hands over a plain string — a tile label, or whatever
  // the member typed into the "Other" box — rather than a DOM event.
  const setProfession = (profession) => {
    setForm((prev) => ({ ...prev, profession }))
    setErrors((prev) => ({ ...prev, profession: undefined }))
  }

  // The portfolio picker hands over the whole { id: url } map, because it owns
  // several inputs at once. Only that platform's message is cleared, so the
  // other tiles keep theirs while the member works down the list.
  const setPortfolio = (portfolio) => {
    setForm((prev) => ({ ...prev, portfolio }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.portfolio
      PORTFOLIO_LINKS.forEach((link) => {
        delete next[`portfolio.${link.id}`]
      })
      return next
    })
  }

  // Send the code that proves this number belongs to them, so Firebase will
  // attach it to the account they just created.
  const handleSendLinkCode = async (phone, countryCode) => {
    setOtpError('')
    setOtpNotice('')
    setVerifyStep('sending')
    try {
      const { confirmation, verifier } = await linkPhoneToCurrentUser(
        phone,
        'signup-recaptcha',
        countryCode
      )
      confirmationRef.current = confirmation
      verifierRef.current = verifier
      setPendingPhone({ phone, countryCode })
      setVerifyStep('verify')
      setOtpNotice(`We sent a 6-digit code to ${phone.trim()}.`)
    } catch (err) {
      clearRecaptcha()
      setOtpError(authErrorMessage(err))
      setVerifyStep('idle')
    }
  }

  // The account exists and the number is proven — hand them straight over.
  const goToWelcome = () => {
    requestMembershipIntent()
    setDone(true)
    navigate('/welcome', { replace: true })
  }

  const handleVerifyLinkCode = async (event) => {
    event?.preventDefault()
    setOtpError('')
    if (!confirmationRef.current) {
      setOtpError('Request a new code, then try again.')
      return
    }
    setLinking(true)
    try {
      await confirmOtp(confirmationRef.current, otp.trim())
      clearRecaptcha()
      goToWelcome()
    } catch (err) {
      setOtpError(authErrorMessage(err))
    } finally {
      setLinking(false)
    }
  }

  // Registration must never be hostage to the SMS step. If they cannot receive
  // or do not want to enter the code, they still go to the welcome screen and
  // can sign in with email as normal — only phone sign-in stays unavailable.
  const handleSkipPhone = () => {
    clearRecaptcha()
    goToWelcome()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await signUpWithEmail(form)
      // They are signed in now. Prove the phone number BEFORE leaving, because
      // this is the only moment the account is guaranteed to be the current
      // user — which is what linkWithPhoneNumber requires.
      await handleSendLinkCode(form.phone, form.countryCode)
    } catch (err) {
      setFormError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <section className="auth">
        <BlurredBackdrop images={AUTH_BACKDROP_IMAGES} />
        <p className="auth__subtitle">Loading…</p>
      </section>
    )
  }

  // NOTE: the phone-verification card below is checked BEFORE the
  // already-signed-in redirect. Immediately after signUpWithEmail() resolves the
  // member IS signed in, so testing `user` first would navigate them to
  // /welcome and skip proving the number — which is the whole point of the step.

  // ---------- Registered — proving the phone number ----------
  // Shown between "account created" and the welcome screen. The account is
  // already saved, so this is an optional step, never a gate.
  if (verifyStep === 'verify' || verifyStep === 'sending') {
    return (
      <section className="auth">
        <BlurredBackdrop images={AUTH_BACKDROP_IMAGES} />
        <motion.div className="auth__card" {...CARD_MOTION}>
          <span className="auth__eyebrow">One more step</span>
          <h1 className="auth__title">Verify your phone number</h1>
          <p className="auth__subtitle">
            Your account is created. Enter the code we sent to{' '}
            <strong>{pendingPhone.phone}</strong> so you can sign in with your
            phone number in future.
          </p>

          {verifyStep === 'sending' ? (
            <p className="auth__alert">Sending code…</p>
          ) : (
            <form className="auth__form" onSubmit={handleVerifyLinkCode}>
              <div className="auth__field">
                <label className="auth__label" htmlFor="signup-otp">
                  Enter the 6-digit code
                </label>
                <input
                  id="signup-otp"
                  className="auth__otp"
                  type="text"
                  name="otp"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="123456"
                  required
                />
              </div>

              {otpError && (
                <p className="auth__alert auth__alert--error">{otpError}</p>
              )}
              {otpNotice && (
                <p className="auth__alert auth__alert--success">{otpNotice}</p>
              )}

              <div className="auth__actions">
                <button
                  type="submit"
                  className="auth__submit"
                  disabled={linking}
                >
                  {linking ? 'Verifying…' : 'Verify & Continue'}
                </button>
                <button
                  type="button"
                  className="auth__ghost"
                  onClick={handleSkipPhone}
                  disabled={linking}
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}

          {/* Invisible reCAPTCHA mounts into this node. */}
          <div id="signup-recaptcha" className="auth__recaptcha" />
        </motion.div>
      </section>
    )
  }

  // Already signed in, and not part-way through proving a number — send them
  // straight to the welcome screen. This used to render a "Go to my account"
  // card with a button, which was both an extra tap and a dead end: it led to
  // the account panel rather than the screen a new member should see.
  if (user && !done) {
    return <Navigate to="/welcome" replace />
  }

  // ---------- Registered — handing off to the welcome screen ----------
  if (done) {
    return (
      <section className="auth">
        <BlurredBackdrop images={AUTH_BACKDROP_IMAGES} />
        <p className="auth__subtitle">Setting up your welcome…</p>
      </section>
    )
  }

  // ---------- Registration form ----------
  return (
    <section className="auth">
      <BlurredBackdrop images={AUTH_BACKDROP_IMAGES} />

      {/* One column: walkway (crane + Members Area) → heading → fieldsets. */}
      <div className="auth__card auth__card--wide auth__card--signup">

        {/*
          Walkway: the crane's feet land on the "Members Area" line and GSAP
          slides .auth__crane-player from fully off the left edge of the track
          to fully off the right edge, on a loop (see the crane useEffect above
          and CRANE_TWEEN at the top of this file). The card's overflow:hidden
          is what hides the crane outside the walkway.
        */}
        <div className="auth__walkway">
          <div className="auth__crane-track" ref={trackRef} aria-hidden="true">
            <div className="auth__crane-player" ref={craneRef}>
              <Player
                autoplay
                loop
                speed={1}
                src={cranewalk}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
          <span className="auth__eyebrow">Members Area</span>
        </div>

        <h1 className="auth__title">
          Are you an animator, or in a related field?
        </h1>
        <p className="auth__subtitle">
          Sign up to the Animation Guild Uganda — the professional association
          for animators, studios, and students.
        </p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          {/* ══ PERSONAL DETAILS ═══════════════════════════════════════════ */}
          <fieldset className="auth__group">
            <legend className="auth__group-title">Personal details</legend>

            <div className="auth__field">
              <label className="auth__label" htmlFor="su-name">
                Full name
              </label>
              <input
                id="su-name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={update('name')}
                aria-invalid={Boolean(errors.name)}
                required
              />
              {errors.name && (
                <span className="auth__error-text">{errors.name}</span>
              )}
            </div>

            <div className="auth__field">
              <label className="auth__label" htmlFor="su-dob">
                Date of birth
              </label>
              <input
                id="su-dob"
                name="dateOfBirth"
                type="date"
                autoComplete="bday"
                value={form.dateOfBirth}
                onChange={update('dateOfBirth')}
                aria-invalid={Boolean(errors.dateOfBirth)}
                required
              />
              {errors.dateOfBirth && (
                <span className="auth__error-text">{errors.dateOfBirth}</span>
              )}
            </div>

            {/* Dialling code dropdown + national number. The two are joined
                into E.164 by toE164() in lib/auth.js before storage, so a
                Kenyan member is never saved with a Ugandan +256 code. */}
            <div className="auth__field">
              <label className="auth__label" htmlFor="su-phone">
                Phone number
              </label>
              <div className="auth__phone">
                <select
                  id="su-country-code"
                  name="countryCode"
                  className="auth__phone-code"
                  value={form.countryCode}
                  onChange={update('countryCode')}
                  aria-label="Country dialling code"
                >
                  {COUNTRY_CODES.map(({ code, label, flag }) => (
                    <option key={code} value={code}>
                      {flag} {code} · {label}
                    </option>
                  ))}
                </select>
                <input
                  id="su-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel-national"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="0702 624 936"
                  aria-invalid={Boolean(errors.phone)}
                  required
                />
              </div>
              {errors.phone ? (
                <span className="auth__error-text">{errors.phone}</span>
              ) : (
                <span className="auth__hint">
                  Saved as {form.countryCode}… so we can reach you on WhatsApp.
                </span>
              )}
            </div>
          </fieldset>

          {/* ══ DIGITAL DETAILS ═══════════════════════════════════════════ */}
          <fieldset className="auth__group">
            <legend className="auth__group-title">Digital details</legend>

            <div className="auth__field">
              <label className="auth__label" htmlFor="su-email">
                Email address
              </label>
              <input
                id="su-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                required
              />
              {errors.email && (
                <span className="auth__error-text">{errors.email}</span>
              )}
            </div>

            <div className="auth__row auth__row--two">
              <div className="auth__field">
                <label className="auth__label" htmlFor="su-password">
                  Password
                </label>
                <input
                  id="su-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="At least 6 characters"
                  aria-invalid={Boolean(errors.password)}
                  required
                />
                {errors.password && (
                  <span className="auth__error-text">{errors.password}</span>
                )}
              </div>

              <div className="auth__field">
                <label className="auth__label" htmlFor="su-confirm">
                  Confirm password
                </label>
                <input
                  id="su-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  placeholder="Repeat your password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  required
                />
                {errors.confirmPassword && (
                  <span className="auth__error-text">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            {/* ── The category ──────────────────────────────────────────────
                This one answer decides the last field on the form: a student
                names an institution, everyone else picks a profession. */}
            <div className="auth__field">
              <label className="auth__label" htmlFor="su-category">
                What kind of member are you?
              </label>
              <select
                id="su-category"
                name="category"
                value={form.category}
                onChange={update('category')}
                aria-invalid={Boolean(errors.category)}
                required
              >
                <option value="" disabled>
                  Choose a category…
                </option>
                {MEMBER_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <span className="auth__error-text">{errors.category}</span>
              ) : (
                <span className="auth__hint">
                  {MEMBER_CATEGORIES.find((c) => c.id === form.category)
                    ?.blurb || 'This decides what we ask you next.'}
                </span>
              )}
            </div>
          </fieldset>

          {/* ══ THE FIELD THE CATEGORY DECIDES ═════════════════════════════
              Students give an institution; everyone else a profession. Only
              one of the two is ever rendered or submitted. */}
          {isStudent ? (
            <fieldset className="auth__group auth__group--conditional">
              <legend className="auth__group-title">Your institution</legend>
              <div className="auth__field">
                <label className="auth__label" htmlFor="su-school">
                  School / institution
                </label>
                <input
                  id="su-school"
                  name="school"
                  type="text"
                  autoComplete="organization"
                  value={form.school}
                  onChange={update('school')}
                  placeholder="e.g. Makerere University"
                  aria-invalid={Boolean(errors.school)}
                  required
                />
                {errors.school ? (
                  <span className="auth__error-text">{errors.school}</span>
                ) : (
                  <span className="auth__hint">
                    We ask every student to name their institution.
                  </span>
                )}
              </div>
            </fieldset>
          ) : (
            <fieldset className="auth__group auth__group--conditional">
              <legend className="auth__group-title">Your profession</legend>
              {/* A picker, not a plain text field: opening it drops a box of
                  category tiles. "Other" reveals a box to type your own.
                  Choices: src/data/professions.js */}
              <div className="auth__field">
                <label className="auth__label" htmlFor="su-profession">
                  Profession
                </label>
                <ProfessionPicker
                  id="su-profession"
                  value={form.profession}
                  onChange={setProfession}
                  error={errors.profession}
                />
                {!errors.profession && (
                  <span className="auth__hint">
                    Pick the one that fits you best — 2D animator, producer, and
                    more — or choose Other and type your own.
                  </span>
                )}
              </div>
            </fieldset>
          )}

          {/* ══ PORTFOLIO ═══════════════════════════════════════════════════
              Asked of every member, student or not: pick a platform, paste
              the link. Several at once is fine — a member may well keep a
              reel on Vimeo and a profile on LinkedIn. Choices:
              src/data/portfolio.js */}
          <fieldset className="auth__group">
            <legend className="auth__group-title">Your portfolio</legend>
            <div className="auth__field">
              <span className="auth__label">Where can we see your work?</span>
              <PortfolioLinks
                id="su-portfolio"
                value={form.portfolio}
                onChange={setPortfolio}
                error={errors.portfolio}
                fieldErrors={portfolioFieldErrors}
              />
            </div>
          </fieldset>

          {/* ══ ABOUT YOU (OPTIONAL) ══════════════════════════════════════
              A short, self-written line about themselves. Optional — a blank
              box means the portfolio card simply has no bio. When present it
              is shown on the public portfolio page, so keep it to 50 words. */}
          <fieldset className="auth__group">
            <legend className="auth__group-title">
              Tell us about yourself
            </legend>
            <div className="auth__field">
              <label className="auth__label" htmlFor="su-about">
                Your short bio{' '}
                <span className="auth__optional">(optional)</span>
              </label>
              <textarea
                id="su-about"
                name="about"
                rows={4}
                value={form.about}
                onChange={update('about')}
                placeholder="e.g. A 2D animator based in Kampala who loves storytelling and character design."
                aria-invalid={Boolean(errors.about)}
                maxLength={600}
              />
              {errors.about ? (
                <span className="auth__error-text">{errors.about}</span>
              ) : (
                <span className="auth__hint">
                  Up to {MAX_ABOUT_WORDS} words. It appears on your public
                  portfolio page — leave it blank if you prefer.
                </span>
              )}
              {/* Live counter so a member can see how close they are without
                  submitting first. */}
              <span
                className={`auth__counter ${
                  aboutWordCount(form.about) > MAX_ABOUT_WORDS ? 'is-over' : ''
                }`}
                aria-live="polite"
              >
                {aboutWordCount(form.about)} / {MAX_ABOUT_WORDS} words
              </span>
            </div>
          </fieldset>

          {formError && (
            <p className="auth__alert auth__alert--error">{formError}</p>
          )}

          {/* Submit + switch link live INSIDE the form so Enter submits. */}
          <div className="auth__actions">
            <button
              type="submit"
              className="auth__submit"
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </div>

          <p className="auth__switch">
            Already a member?{' '}
            <Link to="/login" className="auth__link">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default SignUp
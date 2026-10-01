// src/pages/SignUp.jsx
//
// Member registration. Writes the profile to users/{uid} in Firestore.
//
// The "student checker" runs twice on purpose:
//   1. Here, so the visitor gets an inline, friendly error.
//   2. In firestore.rules (isValidProfile), so the rule holds even if someone
//      bypasses this form and writes straight to Firestore with the public
//      API key. The client-side check is UX; the rule is the actual guarantee.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/useAuth'
import { signUpWithEmail, authErrorMessage } from '../lib/auth'
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
  PORTFOLIO_LINKS
} from '../data/portfolio'
import './Auth.css'

const CARD_MOTION = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
}

// Blurred photo slideshow behind the card. Uses the static hero imagery rather
// than the CMS copy so the signup page still has a backdrop if Firestore is
// unreachable. De-duplicated because heroSlides reuses one photo twice.
const AUTH_BACKDROP_IMAGES = [
  ...new Set(heroSlides.map((slide) => slide.image).filter(Boolean))
]

// The profession choices live in one editable place:
// src/data/professions.js — open that file to add or rename a category. The
// tiles are text-only (their Lottie artwork has been removed). The dialling
// codes and membership categories live in src/data/signup.js.
//
// `isStudent` is NOT stored in the form any more — it is derived from
// `category` (see isStudentCategory). The derived value is what gets written to
// the profile, because that is the field the Firestore rules pair with school.

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
    portfolio: emptyPortfolio()
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
    } else if (dob < new Date(now.getFullYear() - 120, now.getMonth(), now.getDate())) {
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
  // At least one link is required — the Guild's whole value is seeing member
  // work — and each one they DID paste has to look like a link. Only the tiles
  // they actually opened are judged, so someone who filled in two of six
  // platforms is never told about the four they left alone.
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
      event.target.type === 'checkbox' ? event.target.checked : event.target.value

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await signUpWithEmail(form)
      // They are signed in now — hand them to the welcome screen, where the
      // apply-for-membership button and the benefits carousel are waiting.
      requestMembershipIntent()
      setDone(true)
      setForm(emptyForm())
      navigate('/welcome', { replace: true })
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

  // Already registered and signed in — send them to the account panel.
  if (user && !done) {
    return (
      <section className="auth">
        <BlurredBackdrop images={AUTH_BACKDROP_IMAGES} />
        <motion.div className="auth__card" {...CARD_MOTION}>
          <span className="auth__eyebrow">Members Area</span>
          <h1 className="auth__title">You already have an account</h1>
          <p className="auth__subtitle">
            You&apos;re signed in as{' '}
            <strong>{user.displayName || user.email}</strong>.
          </p>
          <div className="auth__actions">
            <button
              type="button"
              className="auth__submit"
              onClick={() => navigate('/login')}
            >
              Go to my account
            </button>
          </div>
        </motion.div>
      </section>
    )
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
      <motion.div className="auth__card auth__card--wide" {...CARD_MOTION}>
        <span className="auth__eyebrow">Members Area</span>
        <h1 className="auth__title">
          Are you an animator, or in a related field?
        </h1>
        <p className="auth__subtitle">
          Sign up to the Animation Guild Uganda — the professional association
          for animators, studios, students and everyone who supports
          Uganda&apos;s animation and digital creative arts industry.
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

          {formError && (
            <p className="auth__alert auth__alert--error">{formError}</p>
          )}

          <div className="auth__actions">
            <button
              type="submit"
              className="auth__submit"
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="auth__switch">
          Already a member?{' '}
          <Link to="/login" className="auth__link">
            Sign in
          </Link>
        </p>
      </motion.div>
    </section>
  )
}

export default SignUp




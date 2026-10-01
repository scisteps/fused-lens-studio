// src/pages/Login.jsx
//
// Member sign-in, two ways: email + password, or a phone number with a
// one-time SMS code (Firebase Phone provider, invisible reCAPTCHA).
//
// This page also doubles as the account panel: if the visitor is already
// signed in it shows their users/{uid} profile and the sign-out button, so
// there is one place to manage the session.

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth, useUserProfile } from '../lib/useAuth'
import {
  signInWithEmail,
  resetPassword,
  logOut,
  sendPhoneOtp,
  confirmOtp,
  authErrorMessage
} from '../lib/auth'
import { consumeMembershipIntent } from '../lib/membershipIntent'
import { consumeReturnTo } from '../lib/returnTo'
import {
  categoryLabel,
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE
} from '../data/signup'
import { BlurredBackdrop } from '../components'
import { heroSlides } from '../data/images'
import './Auth.css'

const CARD_MOTION = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
}

// Blurred photo slideshow behind the card. Uses the static hero imagery rather
// than the CMS copy so the login page still has a backdrop if Firestore is
// unreachable. De-duplicated because heroSlides reuses one photo twice.
const AUTH_BACKDROP_IMAGES = [
  ...new Set(heroSlides.map((slide) => slide.image).filter(Boolean))
]

export function Login() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { profile } = useUserProfile(user?.uid)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Which sign-in method is showing: 'email' | 'phone'.
  const [mode, setMode] = useState('email')

  // Phone / one-time-code flow.
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState('enter') // 'enter' | 'verify'
  const confirmationRef = useRef(null)
  const verifierRef = useRef(null)

  // Where to land once we are signed in, in order of intent:
  //   1. a notification / shared link the visitor was trying to reach
  //   2. they were mid-way through a membership application
  //   3. nothing particular — the home page
  const afterSignIn = () => {
    const destination =
      consumeReturnTo() || (consumeMembershipIntent() ? '/welcome' : '/')
    navigate(destination, { replace: true })
  }

  // Tear down the invisible reCAPTCHA so it can be re-created for the next
  // attempt ("reCAPTCHA has already been rendered in this element").
  const clearRecaptcha = () => {
    try {
      verifierRef.current?.clear()
    } catch {
      /* ignore */
    }
    verifierRef.current = null
  }

  useEffect(() => () => clearRecaptcha(), [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      await signInWithEmail(email, password)
      afterSignIn()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setNotice('')
    // Leaving phone mode unmounts the reCAPTCHA container, so release the
    // verifier and reset the flow in case they come back to it.
    if (next !== 'phone') {
      clearRecaptcha()
      confirmationRef.current = null
      setPhoneStep('enter')
      setOtp('')
    }
  }

  const handleSendCode = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) {
      setError('Enter a valid phone number, e.g. 0702 624 936.')
      return
    }

    setSubmitting(true)
    try {
      const { confirmation, verifier } = await sendPhoneOtp(
        phone,
        'recaptcha-container',
        countryCode
      )
      confirmationRef.current = confirmation
      verifierRef.current = verifier
      setPhoneStep('verify')
      setNotice(`We sent a 6-digit code to ${phone.trim()}.`)
    } catch (err) {
      clearRecaptcha()
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!confirmationRef.current) {
      setPhoneStep('enter')
      setError('Request a new code, then try again.')
      return
    }

    setSubmitting(true)
    try {
      await confirmOtp(confirmationRef.current, otp.trim())
      clearRecaptcha()
      afterSignIn()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeNumber = () => {
    clearRecaptcha()
    confirmationRef.current = null
    setOtp('')
    setPhoneStep('enter')
    setError('')
    setNotice('')
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Type your email address above first, then tap “Forgot password”.')
      return
    }
    setError('')
    setNotice('')
    try {
      await resetPassword(email)
      setNotice(`A password reset link has been sent to ${email.trim()}.`)
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  const handleSignOut = async () => {
    setError('')
    await logOut()
    setEmail('')
    setPassword('')
    setNotice('You have been signed out.')
  }

  if (authLoading) {
    return (
      <section className="auth">
        <BlurredBackdrop images={AUTH_BACKDROP_IMAGES} />
        <p className="auth__subtitle">Loading account…</p>
      </section>
    )
  }

  // ---------- Already signed in ----------
  if (user) {
    return (
      <section className="auth">
        <BlurredBackdrop images={AUTH_BACKDROP_IMAGES} />
        <motion.div className="auth__card" {...CARD_MOTION}>
          <span className="auth__eyebrow">Members Area</span>
          <h1 className="auth__title">You&apos;re signed in</h1>
          <p className="auth__subtitle">
            Welcome back,{' '}
            <strong>{profile?.name || user.displayName || user.email}</strong>.
          </p>

          {!user.emailVerified && (
            <p
              className="auth__alert auth__alert--info"
              style={{ marginBottom: '1.75rem' }}
            >
              Your email address is not verified yet. Check your inbox for the
              verification link we sent when you signed up.
            </p>
          )}

          <dl className="auth__profile">
            <div className="auth__profile-row">
              <dt>Name</dt>
              <dd>{profile?.name || user.displayName || '—'}</dd>
            </div>
            <div className="auth__profile-row">
              <dt>Email</dt>
              <dd>{profile?.email || user.email}</dd>
            </div>
            <div className="auth__profile-row">
              <dt>Phone</dt>
              <dd>{profile?.phone || '—'}</dd>
            </div>
            <div className="auth__profile-row">
              <dt>Date of birth</dt>
              <dd>{profile?.dateOfBirth || '—'}</dd>
            </div>
            <div className="auth__profile-row">
              <dt>Category</dt>
              <dd>{categoryLabel(profile?.category) || '—'}</dd>
            </div>
            {/* Students name an institution, everyone else a profession —
                see the category branch in src/pages/SignUp.jsx. */}
            {profile?.isStudent ? (
              <div className="auth__profile-row">
                <dt>Institution</dt>
                <dd>{profile?.school || '—'}</dd>
              </div>
            ) : (
              <div className="auth__profile-row">
                <dt>Profession</dt>
                <dd>{profile?.profession || '—'}</dd>
              </div>
            )}
            <div className="auth__profile-row">
              <dt>Status</dt>
              <dd>{profile?.status || 'pending'}</dd>
            </div>
          </dl>

          {notice && (
            <p className="auth__alert auth__alert--success">{notice}</p>
          )}

          <div className="auth__actions">
            <button
              type="button"
              className="auth__submit"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </section>
    )
  }

  // ---------- Signed out ----------
  return (
    <section className="auth">
      <BlurredBackdrop images={AUTH_BACKDROP_IMAGES} />
      <motion.div className="auth__card" {...CARD_MOTION}>
        <span className="auth__eyebrow">Members Area</span>
        <h1 className="auth__title"> Login /Signup</h1>
        <p className="auth__subtitle">
          Sign in to your Animation Guild Uganda account.
        </p>

        {/* Two ways in: email + password, or a phone one-time code. */}
        <div className="auth__tabs" role="tablist" aria-label="Sign-in method">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'email'}
            className={`auth__tab ${mode === 'email' ? 'auth__tab--active' : ''}`}
            onClick={() => switchMode('email')}
          >
            Email
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'phone'}
            className={`auth__tab ${mode === 'phone' ? 'auth__tab--active' : ''}`}
            onClick={() => switchMode('phone')}
          >
            Phone
          </button>
        </div>

        {mode === 'email' ? (
        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__field">
            <label className="auth__label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth__field">
            <label className="auth__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          {error && <p className="auth__alert auth__alert--error">{error}</p>}
          {notice && (
            <p className="auth__alert auth__alert--success">{notice}</p>
          )}

          <div className="auth__actions">
            <button
              type="submit"
              className="auth__submit"
              disabled={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
            <button
              type="button"
              className="auth__ghost"
              onClick={handleForgotPassword}
              disabled={submitting}
            >
              Forgot password?
            </button>
          </div>
        </form>
        ) : (
          <form
            className="auth__form"
            onSubmit={phoneStep === 'verify' ? handleVerifyCode : handleSendCode}
          >
            {phoneStep === 'enter' ? (
              <div className="auth__field">
                <label className="auth__label" htmlFor="login-phone">
                  Phone number
                </label>
                <div className="auth__phone-row">
                  <select
                    aria-label="Country dialling code"
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    disabled={submitting}
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="login-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0702 624 936"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="auth__field">
                <label className="auth__label" htmlFor="login-otp">
                  Enter the 6-digit code
                </label>
                <input
                  id="login-otp"
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
            )}

            {error && <p className="auth__alert auth__alert--error">{error}</p>}
            {notice && (
              <p className="auth__alert auth__alert--success">{notice}</p>
            )}

            <div className="auth__actions">
              <button
                type="submit"
                className="auth__submit"
                disabled={submitting}
              >
                {submitting
                  ? phoneStep === 'verify'
                    ? 'Verifying…'
                    : 'Sending…'
                  : phoneStep === 'verify'
                    ? 'Verify & Sign In'
                    : 'Send Code'}
              </button>
              {phoneStep === 'verify' && (
                <button
                  type="button"
                  className="auth__ghost"
                  onClick={handleChangeNumber}
                  disabled={submitting}
                >
                  Use a different number
                </button>
              )}
            </div>

            {/* Invisible reCAPTCHA mounts into this node. */}
            <div id="recaptcha-container" className="auth__recaptcha" />
          </form>
        )}

        <p className="auth__switch">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth__link">
            Create one
          </Link>
        </p>
      </motion.div>
    </section>
  )
}

export default Login


import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryFee } from './CategoryFee'
import { resolvePromo, promoCountdownLabel } from '../../lib/membershipPromo'

const MEMBERSHIP_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbxK5Da_gByb4xFNntM-MDVu46EpQg0zX8U7CHiJ12BE3t8SV4cVR19kJo5KxE9flOoeFg/exec'

// Countries the Guild accepts applications from — the East African scope from
// the constitution. Kept here rather than in the CMS because this value is what
// lands on the application row.
export const RESIDENCE_COUNTRIES = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'DRC']

// The applicant is always signed in before this opens, so the only two things
// the secretariat needs them to choose are the category and the country.
// Everything else (name, email, phone, profession) is already on the member
// profile and rides along as hidden fields — nothing is asked for twice.
export function ApplyModal({
  isOpen,
  onClose,
  categories = [],
  // Already-resolved promo from the Membership section. Welcome.jsx passes the
  // raw config instead; either shape is accepted.
  feePromo,
  user = null,
  profile = null
}) {
  const [category, setCategory] = useState('')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  // A resolved promo arrives as { active, ... }; raw config as { enabled }.
  const promo = feePromo?.active !== undefined
    ? feePromo
    : resolvePromo(feePromo)

  const selectCategory = (value) => {
    setCategory(value)
    setErrorMsg('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!category) {
      setErrorMsg('Choose a membership category to continue.')
      return
    }
    if (!country) {
      setErrorMsg('Choose your country of residence to continue.')
      return
    }

    setErrorMsg('')
    setStatus('sending')

    // Details the profile already holds — carried silently so the
    // secretariat's sheet still receives a complete application.
    const payload = {
      type: 'membership',
      name: profile?.name || user?.displayName || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || '',
      artistType: profile?.profession || '',
      category,
      country
    }

    // Hidden iframe bypasses Google Apps Script CORS restrictions
    const iframeName = `member_iframe_${Date.now()}`
    const iframe = document.createElement('iframe')
    iframe.name = iframeName
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    const submitForm = document.createElement('form')
    submitForm.method = 'POST'
    submitForm.action = MEMBERSHIP_ENDPOINT
    submitForm.target = iframeName
    submitForm.style.display = 'none'

    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value
      submitForm.appendChild(input)
    })

    document.body.appendChild(submitForm)
    submitForm.submit()

    // Assume success after a short delay (iframe gives no readable response)
    setTimeout(() => {
      document.body.removeChild(submitForm)
      document.body.removeChild(iframe)
      setStatus('success')
      setCategory('')
      setCountry('')
    }, 1800)
  }

  const handleClose = () => {
    setStatus(null)
    setErrorMsg('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="apply-modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="apply-modal"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="apply-modal__close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>

            <h3 className="apply-modal__title">Apply for Membership</h3>
            <p className="apply-modal__subtitle">
              Pick your category and country of residence — the rest of your
              details come from your account.
            </p>

            {status === 'success' ? (
              <div className="apply-modal__success">
                <span className="apply-modal__success-icon">✓</span>
                <p>Thanks! Your application has been received.</p>
                <button
                  type="button"
                  className="apply-modal__submit"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            ) : (
              <form className="apply-modal__form" onSubmit={handleSubmit}>
                {/* Preferred category — cards, name + price only */}
                <fieldset className="apply-modal__fieldset">
                  <legend className="apply-modal__legend">
                    Preferred category
                  </legend>

                  {/* While the grace period is live, say so here too —
                      this is the last screen before someone applies, so it
                      must not contradict the Membership section. The fee is
                      unchanged; only the deadline moves. */}
                  {promo.active && (
                    <p className="apply-modal__promo">
                      <span className="apply-modal__promo-flag">PAY LATER</span>
                      <span>
                        {promo.note || 'Join now and pay your membership fee within your first year.'}{' '}
                        {promoCountdownLabel(promo).toLowerCase()}.
                      </span>
                    </p>
                  )}

                  {categories.length > 0 ? (
                    <div className="apply-modal__categories">
                      {categories.map((c, i) => {
                        const value = c.name || `Category ${i + 1}`
                        const selected = category === value

                        return (
                          <button
                            key={`${value}-${i}`}
                            type="button"
                            className={`apply-modal__category ${
                              selected ? 'is-selected' : ''
                            }`}
                            onClick={() => selectCategory(value)}
                            aria-pressed={selected}
                          >
                            <span className="apply-modal__category-name">
                              {value}
                            </span>
                            <CategoryFee
                              fee={c.fee}
                              promo={promo}
                              as="span"
                              className="apply-modal__category-fee"
                            />
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="apply-modal__note">
                      Categories are being updated — contact the secretariat and
                      we will place you in the right one.
                    </p>
                  )}
                </fieldset>

                {/* Country of residence */}
                <div className="apply-modal__field">
                  <label className="apply-modal__label" htmlFor="apply-country">
                    Country of residence
                  </label>
                  <select
                    id="apply-country"
                    name="country"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value)
                      setErrorMsg('')
                    }}
                  >
                    <option value="">Select a country…</option>
                    {RESIDENCE_COUNTRIES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {errorMsg && (
                  <p className="apply-modal__error">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  className="apply-modal__submit"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Sending…' : 'Submit Application'}
                </button>

                <p className="apply-modal__note">
                  Applying is free — the secretariat reviews every application
                  before membership is activated.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
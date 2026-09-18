import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MEMBERSHIP_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbxK5Da_gByb4xFNntM-MDVu46EpQg0zX8U7CHiJ12BE3t8SV4cVR19kJo5KxE9flOoeFg/exec'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  category: '',
  country: '',
  artistType: '',
  message: ''
}

export function ApplyModal({ isOpen, onClose, categories = [] }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState(null) // null | 'sending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

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

    Object.entries({ type: 'membership', ...form }).forEach(([key, value]) => {
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
      setForm(EMPTY_FORM)
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
              Tell us a bit about yourself and we'll get back to you.
            </p>

            {status === 'success' ? (
              <div className="apply-modal__success">
                <span className="apply-modal__success-icon">✓</span>
                <p>Thanks! Your application has been received.</p>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            ) : (
              <form className="apply-modal__form" onSubmit={handleSubmit}>
                <input
                  name="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={handleChange}
                />
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="">Preferred category…</option>
                  {categories.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  name="country"
                  placeholder="Country of residence"
                  value={form.country}
                  onChange={handleChange}
                />
                <input
                  name="artistType"
                  placeholder="Type of artist (2D, 3D, VFX, …)"
                  value={form.artistType}
                  onChange={handleChange}
                />
                <textarea
                  name="message"
                  placeholder="Anything else? (optional)"
                  rows="3"
                  value={form.message}
                  onChange={handleChange}
                />

                <button
                  type="submit"
                  className="btn btn--secondary apply-modal__submit"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Sending…' : 'Submit Application'}
                </button>

                {status === 'error' && (
                  <p className="apply-modal__error">{errorMsg}</p>
                )}
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
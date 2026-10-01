import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// components/Membership/RecommendModal.jsx
//
// The signed-in counterpart to ApplyModal. A member who has already joined is
// nudged to invite someone else rather than to apply again, so this modal
// offers an invite to share: copy it, or send it via the native share sheet,
// WhatsApp or email. The link points at the sign-up screen so whoever taps it
// lands straight on the account form.

const SHARE_TITLE = 'Animation Guild Uganda'

function inviteMessage(inviteUrl) {
  return (
    'Join me in the Animation Guild Uganda — the professional association for ' +
    'animators, studios and students in Uganda. Create your account here: ' +
    inviteUrl
  )
}

export function RecommendModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false)

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/signup`
      : '/signup'
  const message = inviteMessage(inviteUrl)

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleClose = () => {
    setCopied(false)
    onClose()
  }

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: SHARE_TITLE, text: message, url: inviteUrl })
    } catch {
      /* The visitor dismissed the sheet — nothing to do. */
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* Clipboard blocked (insecure context / denied) — the links below work. */
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`
  const emailHref =
    `mailto:?subject=${encodeURIComponent(
      'Join the Animation Guild Uganda'
    )}&body=${encodeURIComponent(message)}`

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
            className="apply-modal recommend-modal"
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

            <h2 className="apply-modal__title">Recommend to Others</h2>
            <p className="apply-modal__subtitle">
              Know someone who belongs in the Guild? Send them an invite to join.
            </p>

            <p className="recommend-modal__message">{message}</p>

            <div className="recommend-modal__actions">
              <button
                type="button"
                className="recommend-modal__copy"
                onClick={handleCopy}
              >
                {copied ? 'Copied ✓' : 'Copy invite'}
              </button>
              {canNativeShare && (
                <button
                  type="button"
                  className="recommend-modal__share"
                  onClick={handleNativeShare}
                >
                  Share
                </button>
              )}
            </div>

            <div className="recommend-modal__links">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <span aria-hidden="true">·</span>
              <a href={emailHref}>Email</a>
            </div>

            <p className="apply-modal__note">
              Anyone can join — students, professionals, studios and supporters.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default RecommendModal

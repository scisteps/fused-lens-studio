// components/MemberProfile
//
// The signed-in member's own panel: their name, category, contact details and
// portfolio links, plus the controls to share their public page and sign out.
//
// It is ONE component used in two places — the category chip in the hero and
// the member button in the header — so the two can never drift apart in what
// they show or what they offer. It must be rendered OUTSIDE any transformed
// ancestor (the hero's parallax <section>), because it is position: fixed and
// a transformed ancestor would become its containing block.

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { categoryLabel } from '../../data/signup'
import { portfolioEntries } from '../../data/portfolio'
import { logOut } from '../../lib/auth'
import {
  memberProfileUrl,
  shareMemberProfile
} from '../../lib/memberProfile'
import './MemberProfile.css'

// What the share button reports back, per outcome of shareMemberProfile().
const SHARE_FEEDBACK = {
  shared: 'Shared',
  copied: 'Link copied',
  failed: 'Copy failed — use the link below'
}

export function MemberProfilePanel({ isOpen, onClose, user, profile = null }) {
  const [shareState, setShareState] = useState(null)
  const [shareUrl, setShareUrl] = useState('')

  // Escape closes it, matching every other overlay on the site.
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Reset the share confirmation each time the panel opens, so a stale
  // "Link copied" from a previous visit is never showing.
  useEffect(() => {
    if (!isOpen) return
    setShareState(null)
    setShareUrl(profile?.uid ? memberProfileUrl(profile.uid) : '')
  }, [isOpen, profile?.uid])

  if (!isOpen || !user) return null

  const name = profile?.name || user.displayName || 'Member'
  const links = portfolioEntries(profile?.portfolio)

  const handleShare = async () => {
    const result = await shareMemberProfile(profile?.uid, profile?.name)
    setShareState(SHARE_FEEDBACK[result] || SHARE_FEEDBACK.failed)
  }

  const handleSignOut = async () => {
    onClose?.()
    await logOut()
  }

  return (
    <motion.div
      className="member-profile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        className="member-profile__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your member profile"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <dl className="member-profile__list">
          <div className="member-profile__row">
            <dt>Email</dt>
            <dd>{profile?.email || user.email}</dd>
          </div>
          <div className="member-profile__row">
            <dt>Phone</dt>
            <dd>{profile?.phone || '—'}</dd>
          </div>
          <div className="member-profile__row">
            <dt>Category</dt>
            <dd>{categoryLabel(profile?.category) || '—'}</dd>
          </div>
          {/* Students name an institution, everyone else a profession — the
              same branch the sign-up form, Login screen and rules use. */}
          {profile?.isStudent ? (
            <div className="member-profile__row">
              <dt>Institution</dt>
              <dd>{profile?.school || '—'}</dd>
            </div>
          ) : (
            <div className="member-profile__row">
              <dt>Profession</dt>
              <dd>{profile?.profession || '—'}</dd>
            </div>
          )}
          <div className="member-profile__row">
            <dt>Status</dt>
            <dd className="member-profile__status">
              {profile?.status || 'pending'}
            </dd>
          </div>
          {/* Hidden entirely when there is nothing to show, so the panel never
              grows an empty row. */}
          {links.length > 0 && (
            <div className="member-profile__row">
              <dt>Portfolio</dt>
              <dd className="member-profile__links">
                {links.map((entry) => (
                  <a
                    key={entry.id}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {entry.label}
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>

        {/* ---------- Share your page ----------
            The link points at /member/{uid}, which shows the member's name,
            category and portfolio links — and nothing private. The email and
            phone above stay in this panel; they are never published. */}
        <div className="member-profile__share">
          <button
            type="button"
            className="member-profile__share-btn"
            onClick={handleShare}
          >
            Share My Profile
          </button>

          {shareUrl && (
            <a
              className="member-profile__share-link"
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={shareUrl}
            >
              {shareUrl.replace(/^https?:\/\//, '')}
            </a>
          )}

          {shareState && (
            <span
              className="member-profile__share-state"
              role="status"
              aria-live="polite"
            >
              {shareState}
            </span>
          )}
        </div>

        <div className="member-profile__actions">
          <button
            type="button"
            className="member-profile__signout"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
          <button
            type="button"
            className="member-profile__close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MemberProfilePanel
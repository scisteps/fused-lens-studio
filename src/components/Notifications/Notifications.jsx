// components/Notifications
//
// The bell and its menu, mounted in the site header.
//
// Everyone sees the bell — a notification is a public message. What is member
// only is where it leads: tapping a signed-out visitor is sent to /login with
// the destination remembered, so they come straight back after signing in
// (see lib/returnTo.js).
//
// Each entry is a square thumbnail (NOTIFICATION_IMAGE_SIZE, forced to 1:1 and
// centre-cropped) beside the title and subtitle.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollection } from '../../lib/useCollection'
import { useAuth } from '../../lib/useAuth'
import { setReturnTo } from '../../lib/returnTo'
import { resolveImage } from '../../data/images'
import {
  NOTIFICATION_IMAGE_SIZE,
  notificationHref,
  notificationNeedsAuth
} from '../../data/notifications'
import './Notifications.css'

// A notification stores either a library imageId (resolved locally, so a
// redeploy that re-hashes assets cannot break it) or an uploaded Storage URL.
const imageSrc = (notification) =>
  resolveImage(notification?.imageId) || notification?.imageUrl || null

export function NotificationRow({ notification, onOpen }) {
  const src = imageSrc(notification)
  const locked = notificationNeedsAuth(notification)
  const resolved = Boolean(notificationHref(notification))

  return (
    <button
      type="button"
      className="notifications__row clickable"
      onClick={() => onOpen(notification)}
      // A notification with no destination yet is shown, but inert.
      disabled={!resolved}
    >
      <span
        className="notifications__thumb"
        style={{
          width: NOTIFICATION_IMAGE_SIZE,
          height: NOTIFICATION_IMAGE_SIZE
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            width={NOTIFICATION_IMAGE_SIZE}
            height={NOTIFICATION_IMAGE_SIZE}
            loading="lazy"
          />
        ) : (
          <span className="notifications__thumb-empty" aria-hidden="true" />
        )}
      </span>

      <span className="notifications__text">
        <span className="notifications__title">{notification.title}</span>
        {notification.subtitle && (
          <span className="notifications__subtitle">
            {notification.subtitle}
          </span>
        )}
      </span>

      {locked && (
        <span
          className="notifications__lock"
          title="Sign in to open"
          aria-label="Sign in to open"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="4" y="10.5" width="16" height="10" rx="2" />
            <path d="M8 10.5V7a4 4 0 1 1 8 0v3.5" />
          </svg>
        </span>
      )}
    </button>
  )
}

export function NotificationsBell() {
  const { items, loading } = useCollection('notifications')
  const { user, loading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const rootRef = useRef(null)
  const navigate = useNavigate()

  const notifications = items || []

  // How many a signed-in member has not opened yet. Held in localStorage per
  // uid, so the badge survives a reload instead of resetting every visit.
  useEffect(() => {
    if (!user?.uid) {
      setUnread(0)
      return
    }
    try {
      const raw = localStorage.getItem(`agu:notifications:seen:${user.uid}`)
      setUnread(raw ? JSON.parse(raw).count || 0 : 0)
    } catch {
      setUnread(0)
    }
  }, [user?.uid, notifications.length])

  const markAllRead = () => {
    if (!user?.uid) return
    try {
      localStorage.setItem(
        `agu:notifications:seen:${user.uid}`,
        JSON.stringify({ count: notifications.length })
      )
    } catch {
      /* storage disabled — the badge simply resets next reload */
    }
    setUnread(0)
  }

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleOpen = notification => {
    const href = notificationHref(notification)
    if (!href) return

    setOpen(false)
    markAllRead()

    // A member-only destination, tapped while signed out: remember it and
    // send the visitor to sign in. The login page returns them here after.
    if (notificationNeedsAuth(notification) && !authLoading && !user) {
      setReturnTo(href)
      navigate('/login')
      return
    }

    navigate(href)
  }

  const count = notifications.length

  return (
    <div className="notifications" ref={rootRef}>
      <button
        type="button"
        className="notifications__bell clickable"
        onClick={() => {
          setOpen(current => !current)
          if (!open) markAllRead()
        }}
        aria-label={count ? `Notifications, ${count} new` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && <span className="notifications__badge">{unread}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notifications__panel"
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="notifications__head">
              <strong>Notifications</strong>
              {count > 0 && <span>{count}</span>}
            </div>

            {loading ? (
              <p className="notifications__empty">Loading…</p>
            ) : count === 0 ? (
              <p className="notifications__empty">Nothing new right now.</p>
            ) : (
              <div className="notifications__list">
                {notifications.map(notification => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onOpen={handleOpen}
                  />
                ))}
              </div>
            )}

            {!user && count > 0 && (
              <p className="notifications__note">
                <a href="/login" className="notifications__note-link">
                  Log in
                </a>{' '}
                or{' '}
                <a href="/signup" className="notifications__note-link">
                  sign up
                </a>{' '}
                to open members-only stories.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationsBell

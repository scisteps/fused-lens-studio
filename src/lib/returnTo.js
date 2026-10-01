// src/lib/returnTo.js
//
// Notifications (and the news & events articles they link to) are member
// content. A signed-out visitor who taps one has to sign in first, and then
// land exactly where they were trying to go rather than dumped on the home
// page. This tiny helper is that memory.
//
// sessionStorage, not localStorage: the request belongs to this tab and dies
// with it, so a stale intent can never hijack a later, unrelated sign-in on
// another tab — the same reasoning as lib/membershipIntent.js.

const KEY = 'agu:returnTo'

/**
 * Only internal paths are accepted. A value like '//evil.example' would be an
 * open redirect once handed to navigate(), so anything that is not a plain
 * absolute path is rejected and the visitor is sent to the home page instead.
 */
function isSafePath(value) {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\')
  )
}

/** Remember where to send the visitor once they have signed in. */
export function setReturnTo(path) {
  if (!isSafePath(path)) return false
  try {
    sessionStorage.setItem(KEY, path)
    return true
  } catch {
    /* private mode / storage disabled — the visitor simply lands on '/' */
    return false
  }
}

export function peekReturnTo() {
  try {
    const value = sessionStorage.getItem(KEY)
    return isSafePath(value) ? value : ''
  } catch {
    return ''
  }
}

/** Reads the path and clears it. Single use, like consumeMembershipIntent(). */
export function consumeReturnTo() {
  const path = peekReturnTo()
  clearReturnTo()
  return path
}

export function clearReturnTo() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nothing to clean up */
  }
}

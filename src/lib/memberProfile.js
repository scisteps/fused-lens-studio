// src/lib/memberProfile.js
//
// The shareable member page: /member/{uid}
//
// A member's public page is built from the `memberPortfolios/{uid}` document —
// NOT from `users/{uid}`. `users` holds the email, phone and date of birth and
// is deliberately unreadable by anyone but the owner and admins. The public
// document is written at signup from buildPublicEntry() (data/portfolio.js)
// and contains only what a member has agreed to show.
//
// It is a separate collection rather than a sub-collection of `users` so the
// `allow read: if true` on it can never reach the private parent document.

/** The route pattern, so the share link and the router can never drift apart. */
export const MEMBER_PROFILE_ROUTE = '/member'

/**
 * The absolute, shareable URL for a member's public page.
 *
 * Absolute (not a bare path) because the whole point is that it is pasted into
 * WhatsApp or email and opened on someone else's device.
 */
export function memberProfileUrl(uid) {
  if (!uid) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${MEMBER_PROFILE_ROUTE}/${uid}`
}

/**
 * Offer the profile link to the visitor.
 *
 * Prefers the native share sheet (one tap to WhatsApp, mail, etc.). Falls back
 * to copying the link, because on desktop browsers navigator.share does not
 * exist. Returns how it was delivered so the caller can confirm it.
 *
 * @returns {Promise<'shared'|'copied'|'failed'>}
 */
export async function shareMemberProfile(uid, name) {
  const url = memberProfileUrl(uid)
  if (!url) return 'failed'

  const title = name ? `${name} — Animation Guild Uganda` : 'Animation Guild Uganda'
  const text = name
    ? `See ${name}'s profile and portfolio on the Animation Guild Uganda site.`
    : 'See this member’s profile and portfolio on the Animation Guild Uganda site.'

  // Native share sheet — available on mobile and on supporting desktop browsers.
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (error) {
      // A cancelled share is not a failure to report; the visitor closed the
      // sheet on purpose. Only fall through to copying for a real error.
      if (error?.name === 'AbortError') return 'shared'
    }
  }

  return copyToClipboard(url) ? 'copied' : 'failed'
}

/** Copy helper. Returns false rather than throwing when the API is missing. */
export async function copyToClipboard(text) {
  if (!text) return false

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path below */
  }

  // navigator.clipboard needs a secure context, so it is absent on plain http.
  // execCommand still works there.
  try {
    const field = document.createElement('textarea')
    field.value = text
    // Keep it off screen and un-focused: a visible, focused textarea scrolls
    // the page and pops the on-screen keyboard on mobile.
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.top = '-9999px'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const ok = document.execCommand('copy')
    field.remove()
    return ok
  } catch {
    return false
  }
}
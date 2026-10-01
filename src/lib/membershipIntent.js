// src/lib/membershipIntent.js
//
// "Apply for Membership" is a members-only action, so tapping it while signed
// out has to detour through /login or /signup. This tiny flag is how the auth
// pages know the visitor was mid-application, so they can hand them straight
// back to the welcome screen (apply button waiting) instead of dumping them on
// the home page.
//
// sessionStorage, not localStorage: the request is scoped to this tab and dies
// with it, so a stale intent can never hijack a later, unrelated sign-in.
const KEY = 'agu:membershipIntent'

export function requestMembershipIntent() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* private mode / storage disabled — the flow simply falls back to '/' */
  }
}

export function hasMembershipIntent() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function clearMembershipIntent() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nothing to clean up */
  }
}

// Reads the flag and clears it — the intent is single-use.
export function consumeMembershipIntent() {
  const had = hasMembershipIntent()
  clearMembershipIntent()
  return had
}

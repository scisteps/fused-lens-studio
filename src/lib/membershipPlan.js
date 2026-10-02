// src/lib/membershipPlan.js
//
// Which version of their membership a member is on: the free trial every new
// member starts with, or the paid premium version of their category.
//
// The profile stores `plan` on users/{uid}:
//   • 'free' — written by the sign-up form (src/lib/auth.js). Every new member
//              gets a 6-month free trial, counted from `createdAt`.
//   • 'paid' — set by the secretariat in the Firebase console once a receipt is
//              confirmed (the same place they move status pending → active).
//              The console write is allowed by isAdmin() in firestore.rules.
// Profiles created before this field existed carry no `plan`, which reads as
// 'free' — the trial everyone starts on.
//
// Keep this out of buildPublicEntry() (data/portfolio.js): memberPortfolios is
// world-readable, and whether someone has paid is not public information.

/** The length of the trial every new member starts on. */
export const FREE_TRIAL_MONTHS = 6

/** True when the member is on the paid premium version of their category. */
export function isPremium(profile) {
  return profile?.plan === 'paid'
}

/**
 * The day the free trial ends — createdAt + 6 months.
 * Null when createdAt is missing or unreadable, so callers can omit the date
 * rather than printing "Invalid Date" (same rule as firstPaymentDueLabel in
 * src/pages/Welcome.jsx).
 */
export function trialEndDate(profile) {
  const created = profile?.createdAt
  const startedAt = typeof created?.toDate === 'function' ? created.toDate() : created
  const date = startedAt instanceof Date ? startedAt : new Date(startedAt)
  if (Number.isNaN(date.getTime())) return null

  // month + 6 rolls over the year automatically — no manual handling needed.
  return new Date(date.getFullYear(), date.getMonth() + FREE_TRIAL_MONTHS, date.getDate())
}

/**
 * "10 April 2027" — the long form the welcome screen reads best with.
 * Empty string when the profile has not been read yet.
 */
export function trialEndLabel(profile) {
  const end = trialEndDate(profile)
  if (!end) return ''
  return end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * The compact wording for a profile row, so members can see at a glance
 * whether they are on the free or the paid version:
 *   • "Premium (paid)"
 *   • "Free trial · until 10 Apr 2027"
 *   • "Free trial · ended 10 Apr 2027"  (trial window passed, still unpaid)
 *   • "Free trial"                      (createdAt not readable yet)
 */
export function planSummary(profile) {
  if (isPremium(profile)) return 'Premium (paid)'

  const end = trialEndDate(profile)
  if (!end) return 'Free trial'

  const short = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return end.getTime() > Date.now()
    ? `Free trial · until ${short}`
    : `Free trial · ended ${short}`
}

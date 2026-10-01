// src/lib/membershipPromo.js
//
// A time-limited fee waiver for the membership categories — "join free while
// the offer lasts". The Guild wants the fee itself to carry the message, so
// every place a fee is rendered (the Membership section on the home page and
// the category picker in the Apply modal) reads its state from here rather
// than deciding for itself.
//
// The offer is configuration, not code: the Content Dashboard writes
// `membership.feePromo` and the secretariat can switch it on, retitle it, or
// move the end date without a deploy. When the date passes the offer turns
// itself off — there is nothing to switch off by hand, and no fee can be left
// advertised as free after the window closes.
//
// Shape stored on the content document:
//
//   membership: {
//     feePromo: {
//       enabled: false,          // master switch
//       label:  'Founding member offer',
//       note:   'Waived for everyone who joins during our first year.',
//       endsOn: '2027-09-30'      // ISO date, INCLUSIVE — active through 23:59 that day
//     }
//   }
//
// Dates are compared in the reader's own timezone, which is what a member
// expects from "the offer closes on 30 September".

import { useEffect, useMemo, useState } from 'react'

/**
 * Fee strings that are not really prices, so a waiver must not turn them into
 * "FREE". "To be determined" and "By invitation" are not money, and striking
 * them through would be nonsense.
 */
const NON_PRICED_FEES = [
  '',
  'to be determined',
  'tbd',
  'by invitation',
  'on application',
  'free',
  'free of charge',
  'n/a'
]

/** True when the fee is a real amount the waiver can cover. */
export function isPricedFee(fee) {
  const value = String(fee || '').trim().toLowerCase()
  if (!value) return false
  return !NON_PRICED_FEES.includes(value)
}

/**
 * The instant the offer closes. `endsOn` is INCLUSIVE, so a promo ending
 * '2026-12-31' is still live at 23:59 on 31 December. Returns null for a
 * missing or unparseable date, which resolvePromo treats as "no offer" — a
 * typo in the CMS can never accidentally make everything permanently free.
 */
export function promoEndDate(endsOn) {
  if (!endsOn) return null
  const parsed = new Date(`${String(endsOn).trim()}T23:59:59.999`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Decide whether the offer is live right now, and work out the countdown.
 * Every consumer calls this, so a category card, the banner and the apply
 * modal can never disagree about whether the fee is waived.
 */
export function resolvePromo(promo, now = new Date()) {
  const endsOn = promoEndDate(promo?.endsOn)
  const enabled = Boolean(promo?.enabled)
  const active = enabled && endsOn !== null && now.getTime() <= endsOn.getTime()

  // Whole CALENDAR days, not a millisecond division. The offer closes at
  // 23:59:59 on `endsOn`, so dividing the raw span by a day would round
  // 9 days 23:59 up to "10 days left" on the morning of the 1st. Comparing
  // the two dates at midnight gives the number a person would say out loud.
  const daysLeft =
    active && endsOn
      ? Math.max(
          0,
          Math.round(
            (new Date(endsOn.getFullYear(), endsOn.getMonth(), endsOn.getDate()) -
              new Date(now.getFullYear(), now.getMonth(), now.getDate())) /
              86400000
          )
        )
      : 0

  return {
    // A malformed end date is surfaced rather than silently ignored, so the
    // offer cannot quietly stay on forever because of a typo.
    valid: endsOn !== null,
    active,
    endsOn,
    daysLeft,
    label: String(promo?.label || '').trim() || 'Founding member offer',
    note: String(promo?.note || '').trim()
  }
}

/**
 * How a single category's fee should read, given the offer.
 *
 *   { kind: 'waived', text, freeText } — price struck through, shown as free
 *   { kind: 'priced', text }           — an ordinary price
 *   { kind: 'plain',  text }           — wording, not money ("By invitation").
 *                                       Shown verbatim; the offer never
 *                                       claims to waive something that was
 *                                       never a price.
 *   { kind: 'unset',  text }           — nothing written, so render nothing
 */
export function describeFee(fee, promo) {
  const text = String(fee || '').trim()

  // No fee written at all — the card simply has no price line.
  if (!text) {
    return { kind: 'unset', text: '', isFree: false, freeText: '' }
  }

  // A fee that was never money must still be shown, exactly as written.
  if (!isPricedFee(text)) {
    return { kind: 'plain', text, isFree: false, freeText: '' }
  }

  if (!promo?.active) {
    return { kind: 'priced', text, isFree: false, freeText: '' }
  }

  return { kind: 'waived', text, isFree: true, freeText: 'FREE' }
}

/** "Ends today" / "Ends tomorrow" / "Ends in 42 days". Empty when not active. */
export function promoCountdownLabel(promo) {
  if (!promo?.active) return ''
  if (promo.daysLeft <= 0) return 'Ends today'
  if (promo.daysLeft === 1) return 'Ends tomorrow'
  return `Ends in ${promo.daysLeft} days`
}

/** "30 September 2027" — the human date the offer closes. Empty when not active. */
export function promoEndLabel(promo) {
  if (!promo?.active || !promo.endsOn) return ''
  return promo.endsOn.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Re-checks the offer on a timer.
 *
 * Without this, a page left open across the closing moment would keep
 * advertising a free join that is no longer free. Once a minute is far more
 * often than anyone can notice and costs nothing.
 */
export function usePromo(promo) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => resolvePromo(promo, now), [promo, now])
}

// components/Membership/CategoryFee.jsx
//
// The one place a membership fee is rendered, so a card in the Membership
// section, a category in the Apply modal and the new member's welcome screen
// can never disagree about what is owed.
//
// The fee is ALWAYS shown as written. The grace-period offer only changes when
// it falls due, never the amount, so this component never strikes a price
// through and never prints the word FREE — see lib/membershipPromo.js. A fee
// that was never a price ("By invitation") is left exactly as the secretariat
// wrote it.
//
// It lives in its own module because both Membership.jsx and ApplyModal.jsx
// need it, and those two already import each other.

import { describeFee } from '../../lib/membershipPromo'

/**
 * `as` picks the element. The default <p> is right for the standalone fee line
 * in a category card, but the Apply modal renders each category as a <button>,
 * and a <button> may only contain phrasing content — so there it passes
 * as="span" to keep the markup valid.
 */
export function CategoryFee({ fee, promo, className = '', as: Tag = 'p' }) {
  const display = describeFee(fee, promo)

  if (display.kind === 'unset') return null

  return (
    <Tag
      className={['membership__category-fee', className]
        .filter(Boolean)
        .join(' ')}
    >
      <strong>{display.text}</strong>
    </Tag>
  )
}

export default CategoryFee

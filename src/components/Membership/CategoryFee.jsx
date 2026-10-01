// components/Membership/CategoryFee.jsx
//
// The one place a membership fee is rendered, so a card in the Membership
// section and a category in the Apply modal can never disagree about whether
// the fee is waived. While the offer is live a real price is struck through
// and replaced by FREE; a fee that was never a price ("By invitation") is
// left exactly as the secretariat wrote it.
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

  if (display.kind === 'waived') {
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

  return (
    <Tag
      className={[
        'membership__category-fee',
        'membership__category-fee--waived',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <del className="membership__category-fee-was">{display.text}</del>
      <strong className="membership__category-fee-now">
        {display.freeText}
      </strong>
    </Tag>
  )
}

export default CategoryFee

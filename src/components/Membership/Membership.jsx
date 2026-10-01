import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useSiteContent } from '../../lib/useSiteContent'
import { useAuth, useUserProfile } from '../../lib/useAuth'
import { requestMembershipIntent } from '../../lib/membershipIntent'
import { highlightLead } from '../../lib/highlightLead'
import { resolveImage } from '../../data/images'
import { BenefitsCarousel } from '../BenefitsCarousel'
import { CategoryFee } from './CategoryFee'
import {
  usePromo,
  promoCountdownLabel,
  promoEndLabel
} from '../../lib/membershipPromo'
import './Membership.css'
import { ApplyModal } from './ApplyModal'
import { RecommendModal } from './RecommendModal'

// Category card fills cycle white → orange → green. The final card is
// always white so the list closes on a neutral card.
const CATEGORY_VARIANTS = ['white', 'orange', 'green']

// const APPLY_EMAIL = 'animationguilduganda@gmail.com'

export function Membership() {
  const navigate = useNavigate()
  const { content } = useSiteContent()
  const { user } = useAuth()
  const { profile } = useUserProfile(user?.uid)
  const [activeIndex, setActiveIndex] = useState(0)
  const [openCategory, setOpenCategory] = useState(null)
  const [applyOpen, setApplyOpen] = useState(false)
  const [recommendOpen, setRecommendOpen] = useState(false)

  // Applying is members-only. Signed-out visitors sign in first; the auth pages
  // then hand them back to /welcome, where the apply button is waiting.
  const handleApply = () => {
    if (!user) {
      requestMembershipIntent()
      navigate('/login')
      return
    }
    setApplyOpen(true)
  }

  const bgImageIds = (content.heroSlides || [])
    .map(slide => slide.imageId)
    .filter(Boolean)

  useEffect(() => {
    if (bgImageIds.length < 2) return
    const id = setInterval(() => {
      setActiveIndex(current => (current + 1) % bgImageIds.length)
    }, 6000)
    return () => clearInterval(id)
  }, [bgImageIds.length])

  if (content.visibility?.membership === false) return null

  const membership = content.membership || {}
  const benefits = membership.benefits || []

  // The grace-period offer. Re-checked every minute so a page left open past
  // the closing date stops advertising a grace period on its own.
  const promo = usePromo(membership.feePromo)

  // Build a mailto link that pre-fills subject + body
  // const applyMailto = `mailto:${APPLY_EMAIL}?subject=${encodeURIComponent(
  //   'Membership Application — Animation Guild Uganda'
  // )}&body=${encodeURIComponent(
  //   'Hello Animation Guild Uganda,\n\nI would like to apply for membership.\n\nName:\nContact:\nType of artist:\nCountry of residence:\n\nThank you.'
  // )}`

  return (
    <section id="membership" className="membership section section--dark">
      <div className="membership__bg">
        {bgImageIds.map((imageId, index) => (
          <div
            key={imageId + index}
            className={`membership__bg-slide ${index === activeIndex ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${resolveImage(imageId)})` }}
          />
        ))}
        <div className="membership__bg-overlay" />
      </div>

      <div className="container">
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="membership__registered-badge">
            {membership.title || 'Membership'}
          </span>
          <h2 className="section-title">Join Our Community</h2>
        </motion.div>

        {/* Lead with what members actually get — one benefit at a time, 5s each */}
        {benefits.length > 0 && (
          <motion.div
            className="membership__carousel"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h3 className="membership__carousel-title">What Members Get</h3>
            <BenefitsCarousel benefits={benefits} interval={5000} />
          </motion.div>
        )}

        {/* The one thing we want them to do next. A signed-in member has
            already joined, so they get an invite-a-friend action instead. */}
        <motion.div
          className="membership__apply"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          {user ? (
            <button
              type="button"
              className="btn btn--recommend"
              onClick={() => setRecommendOpen(true)}
            >
              Recommend to Others
            </button>
          ) : (
            <button type="button" className="btn btn--apply" onClick={handleApply}>
              Apply for Membership
            </button>
          )}
          <p className="membership__apply-note">
            {user
              ? 'Invite someone who belongs in the Guild — it only takes a moment.'
              : 'Applying is free. Sign in or create an account, then choose your category.'}
          </p>
        </motion.div>

        {/* Membership categories (tags + fees) are for prospective joiners — a
            signed-in member already has their category, so skip it. */}
        {!user && membership.categories?.length > 0 && (
          <motion.div
            className="membership__categories"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="membership__categories-title">Membership Categories</h3>

            {/* Each card expands to show the fee, what that category means, and
                — while the grace period is live — the pay-later terms. The
                offer is deliberately NOT a banner above the list: it belongs to
                a fee, so it is read together with the fee it applies to, in the
                dropdown, rather than floating free of the amounts. */}
            <div className="membership__categories-grid">
              {membership.categories.map((category, index) => {
                const isOpen = openCategory === index
                // Last category is white, not orange, so the list ends on a
                // neutral card instead of repeating the orange fill.
                const variant =
                  index === membership.categories.length - 1
                    ? 'white'
                    : CATEGORY_VARIANTS[index % CATEGORY_VARIANTS.length]

                return (
                  <button
                    key={index}
                    type="button"
                    className={[
                      'membership__category',
                      `membership__category--${variant}`,
                      isOpen ? 'is-open' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setOpenCategory(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >

                    <div className="membership__category-header">
                      <span className="membership__category-name">
                        {category.name}
                      </span>
                      <span
                        className="membership__category-toggle"
                        aria-hidden="true"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          className="membership__category-details"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          {describeFee(category.fee, promo).kind !== 'unset' && (
                            <CategoryFee fee={category.fee} promo={promo} />
                          )}
{/* The pay-later terms sit with the fee they apply
                              to. The amount above is unchanged — the offer only
                              moves the deadline — so the member reads price and
                              terms together instead of from two separate places. */}
                          {promo.active && (
                            <div
                              className="membership__category-promo"
                              role="status"
                              aria-live="polite"
                            >
                              <span className="membership__category-promo-flag">
                                PAY LATER
                              </span>
                              <span className="membership__category-promo-body">
                                <strong>{promo.label}</strong>
                                {promo.note && <span>{promo.note}</span>}
                                <span className="membership__category-promo-countdown">
                                  {promoCountdownLabel(promo)}
                                  <span aria-hidden="true"> · </span>
                                  closes {promoEndLabel(promo)}
                                </span>
                              </span>
                            </div>
                          )}
                          <p className="membership__category-description">
                            {highlightLead(category.description)}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Benefits — the carousel at the top of the section is the ONLY place
            they are listed. The old grouped rows (Core Membership, Voting &
            rights, …) repeated the same copy as a wall of text below the
            categories, so it has been removed. The BenefitsCarousel above is
            driven by the same `membership.benefits` array in the CMS, so no
            content is lost — it just reads as one carousel now. */}

        {/* Executive Committee — green glowing button */}
        <motion.div
          className="membership__cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link to="/members" className="btn btn--committee">
            Executive Committee
          </Link>
        </motion.div>

        <motion.div
          className="membership__join"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3>{user ? 'Spread the Word' : 'Ready to Join?'}</h3>
          <p>
            {user
              ? 'Know someone who belongs in the Guild? Recommend us — it only takes a moment.'
              : membership.description ||
                'Apply now to become a member of the Animation Guild Uganda.'}
          </p>
          {user ? (
            <button
              type="button"
              className="btn btn--recommend"
              onClick={() => setRecommendOpen(true)}
            >
              Recommend to Others
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--apply"
              onClick={handleApply}
            >
              Apply for Membership
            </button>
          )}
        </motion.div>
      </div>
      <ApplyModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        categories={membership.categories || []}
        feePromo={promo}
        eligibility={membership.eligibility || ''}
        user={user}
        profile={profile}
      />
      <RecommendModal
        isOpen={recommendOpen}
        onClose={() => setRecommendOpen(false)}
      />
    </section>
  )
}
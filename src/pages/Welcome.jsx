// src/pages/Welcome.jsx
//
// Where a new member lands the moment their sign-up finishes. The page has one
// job: tell them they are in, name the category they chose, state plainly what
// that category costs and when it is due, then show the member benefits and two
// clear ways on — their profile, or back to the site.
//
// Requires a session — a signed-out visitor is sent to /login with the
// membership intent set, so the login page knows to bounce them back here.

import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Player } from '@lottiefiles/react-lottie-player'
import { BlurredBackdrop, BenefitsCarousel } from '../components'
import { useAuth, useUserProfile } from '../lib/useAuth'
import { useSiteContent } from '../lib/useSiteContent'
import {
  requestMembershipIntent,
  clearMembershipIntent
} from '../lib/membershipIntent'
import { heroSlides } from '../data/images'
import welcomeAnimation from '../jsons/invertedcrane.json'
import { categoryLabel } from '../data/signup'
import { isPremium, trialEndLabel } from '../lib/membershipPlan'
import { usePromo, describeFee } from '../lib/membershipPromo'
import './Welcome.css'

const CARD_MOTION = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
}

// Static hero imagery rather than the CMS copy, so the welcome screen still has
// a backdrop if Firestore is unreachable. De-duplicated because heroSlides
// reuses one photo twice.
const BACKDROP_IMAGES = [
  ...new Set(heroSlides.map((slide) => slide.image).filter(Boolean))
]

const BENEFIT_INTERVAL = 5000

// The sign-up form stores a category ID (data/signup.js) while the CMS stores
// category NAMES with their fees (lib/useSiteContent.js). The two lists are
// written to say the same thing, but the secretariat can rename a category in
// the dashboard, so the lookup matches on keywords rather than one exact string.
const CATEGORY_FEE_KEYWORDS = {
  student: ['student'],
  professional: ['professional', 'ordinary'],
  studio: ['studio', 'corporate', 'organisation', 'organization'],
  international: ['international', 'associate'],
  // Retired ids, kept only so an older profile still finds its fee row. They
  // are no longer offered on the sign-up form — see LEGACY_CATEGORY_LABELS in
  // src/data/signup.js.
  associate: ['associate', 'international'],
  patron: ['patron', 'honorary']
}

/** The CMS category record whose name best matches the member's chosen id. */
function findCategoryRecord(categoryId, categories) {
  const keywords = CATEGORY_FEE_KEYWORDS[categoryId]
  if (!keywords || !Array.isArray(categories)) return null

  return (
    categories.find((entry) => {
      const name = String(entry?.name || '').toLowerCase()
      return Boolean(name) && keywords.some((keyword) => name.includes(keyword))
    }) || null
  )
}

/**
 * "12 September 2027" — the day a year after they joined falls due. Empty when
 * the profile has not been read yet, so the copy simply omits the date rather
 * than printing "Invalid Date".
 */
function firstPaymentDueLabel(profile) {
  const created = profile?.createdAt
  const startedAt = typeof created?.toDate === 'function' ? created.toDate() : created
  const date = startedAt instanceof Date ? startedAt : new Date(startedAt)
  if (Number.isNaN(date.getTime())) return ''

  return new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()).toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )
}

/**
 * "0702 624 936" — grouped for reading. Falls back to the raw number if it
 * is not a long East-African style number, so an odd entry still shows.
 */
function formatMobileMoney(raw) {
  const digits = String(raw || '').replace(/[^\d+]/g, '')
  const match = digits.match(/^(\+?\d{1,4})(\d{3})(\d{3})(\d{3,4})$/)
  if (!match) return String(raw || '').trim()
  return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`
}

/**
 * "MTN MoMo · Animation Guild Uganda" — the account name shown alongside the
 * number, so the member knows whose wallet they are paying. Parts the CMS may
 * not have filled in are simply dropped.
 */
function mobileMoneyCaption(mobileMoney) {
  if (!mobileMoney) return ''
  return [mobileMoney.provider, mobileMoney.name].filter(Boolean).join(' · ')
}

export function Welcome() {
  const { user, loading: authLoading } = useAuth()
  const { profile } = useUserProfile(user?.uid)
  const { content } = useSiteContent()
  const membership = content.membership || {}
  const benefits = membership.benefits || []
  const categories = membership.categories || []

  // "Pay my membership fee" reveals where to send the money. The number is not
  // on screen until they ask for it, so the button stays a single clear step.
  const [showPayment, setShowPayment] = useState(false)
  const [copied, setCopied] = useState(false)

  // The secretariat can publish a new number; drop a stale "Copied" tick and
  // collapse the panel if the entry is taken away underneath them.
  const mobileMoney = content.studioInfo?.mobileMoney || null
  const mobileMoneyNumber = String(mobileMoney?.number || '').trim()

  useEffect(() => {
    if (!mobileMoneyNumber) setShowPayment(false)
    setCopied(false)
  }, [mobileMoneyNumber])

  // Resolved up here with the other hooks: a hook below the early returns would
  // change the hook order when the auth state settles and React would throw.
  const promo = usePromo(membership.feePromo)

  // Landing here signed out means they want to apply — remember that so the
  // login/signup pages return them to this screen.
  useEffect(() => {
    if (!authLoading && !user) requestMembershipIntent()
  }, [authLoading, user])

  // The journey ends here: once a signed-in member is actually looking at this
  // screen, drop the flag so it cannot pull a later, unrelated sign-in off the
  // home page.
  useEffect(() => {
    if (!authLoading && user) clearMembershipIntent()
  }, [authLoading, user])

  if (authLoading) {
    return (
      <main className="welcome">
        <BlurredBackdrop images={BACKDROP_IMAGES} />
        <p className="welcome__loading">Loading your welcome…</p>
      </main>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const fullName = (profile?.name || user.displayName || '').trim()
  const firstName = fullName.split(' ')[0]

  // The category the member picked on the sign-up form, plus the matching CMS
  // entry — that entry is what carries the price they are being asked for.
  const memberCategory = categoryLabel(profile?.category) || 'Member'
  const categoryRecord = findCategoryRecord(profile?.category, categories)
  const fee = describeFee(categoryRecord?.fee, promo)
  const dueLabel = firstPaymentDueLabel(profile)

  // A fee that was never a price ("By invitation", "To be determined") must not
  // be quoted back as an amount to pay within a year. A real price is ALWAYS
  // shown, grace period or not — the offer changes the deadline, not the fee.
  const hasRealPrice = fee.kind === 'priced'

  return (
    <main className="welcome">
      <BlurredBackdrop images={BACKDROP_IMAGES} />

      <div className="container">
        <div className="welcome__inner">
          <motion.div className="welcome__head" {...CARD_MOTION}>
            {/* Lottie crane — the first thing they see */}
            <div className="welcome__lottie">
              <Player
                autoplay
                loop
                src={welcomeAnimation}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <span className="welcome__eyebrow">Welcome to the Animation Guild</span>
            <h1 className="welcome__title">
              Congratulations{firstName ? `, ${firstName}` : ''} — you are in!
            </h1>
            <p className="welcome__text">
              Welcome to the Animation Guild Uganda. You are now a member of the{' '}
              <strong className="welcome__category-name">{memberCategory}</strong>{' '}
              category on a 6-month free trial — during the trial you can
              upgrade to the premium version of your category whenever you are
              ready. Every benefit below is yours to enjoy from today.
            </p>
          </motion.div>

          {/* The trial they start on, and how to move to the paid version.
              Shown even when the profile is still loading — the date simply
              drops out until createdAt is readable. */}
          <motion.div
            className="welcome__trial"
            {...CARD_MOTION}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="welcome__trial-badge">
              {isPremium(profile) ? 'Premium version' : '6-Month Free Trial'}
            </span>

            {isPremium(profile) ? (
              <p className="welcome__trial-text">
                Your <strong>{memberCategory}</strong> membership is on the
                premium version of your category — thank you for supporting the
                Guild.
              </p>
            ) : (
              <p className="welcome__trial-text">
                You are on a 6-month free trial of the{' '}
                <strong>{memberCategory}</strong> category
                {trialEndLabel(profile) ? `, free for 6 months until ${trialEndLabel(profile)}` : ''}.
                During the trial you can upgrade to the{' '}
                <strong>premium version</strong> of your {memberCategory}{' '}
                category at any time.
              </p>
            )}
          </motion.div>

          {/* What the category costs, and when it has to be paid. */}
          <motion.div
            className="welcome__fee"
            {...CARD_MOTION}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="welcome__fee-title">Your membership fee</h2>

            {hasRealPrice ? (
              <>
                {/* The real price, always. The grace period changes when this
                    falls due, never the amount — so there is no struck-through
                    figure and no "FREE" here. */}
                <p className="welcome__fee-price">
                  <strong>{fee.text}</strong>
                </p>

                <p className="welcome__fee-note">
                  The premium version of your {memberCategory} membership costs{' '}
                  <strong>{fee.text}</strong> per year. Your 6-month free
                  trial covers you until you upgrade.
                </p>

                <p className="welcome__fee-note">
                  {fee.gracePeriod
                    ? 'Nothing is due today, but you can upgrade now, or any time within your free trial, whichever suits you.'
                    : dueLabel
                      ? `You can upgrade now, or any time within your first year — if you upgrade, your first payment is due by ${dueLabel}.`
                      : 'You can upgrade now, or any time within your first year — whichever suits you.'}{' '}
                  Your membership stays valid while the payment is
                  outstanding.
                </p>
              </>
            ) : (
              <p className="welcome__fee-note">
                Your {memberCategory} category is{fee.text ? ` ${fee.text.toLowerCase()}` : ' free of charge'}{' '}
                — there is no fee for you to pay. The committee will confirm the
                details with you directly.
              </p>
            )}

            {/* Payment: the button reveals the mobile-money number to send the
                fee to. Without a number on file the button is not shown at all
                rather than opening an empty mail client. */}
            {mobileMoneyNumber ? (
              <>
                <button
                  type="button"
                  className="btn btn--apply"
                  onClick={() => setShowPayment((open) => !open)}
                  aria-expanded={showPayment}
                  aria-controls="welcome-payment-details"
                >
                  {showPayment ? 'Hide payment details' : 'Upgrade to premium'}
                </button>

                {showPayment && (
                  <div
                    id="welcome-payment-details"
                    className="welcome__payment"
                    role="region"
                    aria-label="Mobile money payment details"
                  >
                    <p className="welcome__payment-title">Send via mobile money</p>

                    <p className="welcome__payment-instruction">
                      Send{' '}
                      {hasRealPrice ? <strong>{fee.text}</strong> : 'your fee'}{' '}
                      to the number below using your mobile money app.
                    </p>

                    <div className="welcome__payment-number-row">
                      <a
                        className="welcome__payment-number"
                        href={`tel:${mobileMoneyNumber}`}
                        aria-label={`Call ${formatMobileMoney(mobileMoneyNumber)}`}
                      >
                        {formatMobileMoney(mobileMoneyNumber)}
                      </a>

                      <button
                        type="button"
                        className="welcome__payment-copy"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(mobileMoneyNumber)
                            setCopied(true)
                          } catch {
                            // Clipboard can be blocked (insecure origin, older
                            // browser). The number is on screen and tappable,
                            // so failing quietly is better than a dead button.
                            setCopied(false)
                          }
                        }}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    {mobileMoneyCaption(mobileMoney) && (
                      <p className="welcome__payment-caption">
                        {mobileMoneyCaption(mobileMoney)}
                      </p>
                    )}

                    <p className="welcome__payment-note">
                      Use your full name as the reference, then send the
                      secretariat your receipt so your membership can be
                      upgraded to the premium version of your category.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="welcome__fee-note welcome__fee-note--muted">
                Payment are to be made to the airtel money number +256 702624936. 
            
              </p>
            )}
          </motion.div>

          {benefits.length > 0 && (
            <motion.section
              className="welcome__benefits"
              {...CARD_MOTION}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="welcome__benefits-title">Member Benefits</h2>
              <BenefitsCarousel benefits={benefits} interval={BENEFIT_INTERVAL} />
            </motion.section>
          )}

          {/* Two clear ways out of this screen, as real buttons rather than
              faint text links buried at the bottom. */}
          <motion.nav
            className="welcome__actions"
            aria-label="Next steps"
            {...CARD_MOTION}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to="/login" className="welcome__action">
              <span className="welcome__action-label">My profile</span>
              <span className="welcome__action-hint">
                View and check the details we hold for you
              </span>
            </Link>
            <Link to="/" className="welcome__action welcome__action--primary">
              <span className="welcome__action-label">Back to the site</span>
              <span className="welcome__action-hint">
                Explore the Guild and everything we do
              </span>
            </Link>
          </motion.nav>
        </div>
      </div>
    </main>
  )
}

export default Welcome

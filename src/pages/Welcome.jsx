// src/pages/Welcome.jsx
//
// Where a new member lands the moment their account exists, and where
// anyone who tapped "Apply for Membership" while signed out returns to after
// signing in. The page has one job: welcome them, then put the apply button in
// front of them, with the member benefits carousel right underneath it.
//
// Requires a session — a signed-out visitor is sent to /login with the
// membership intent set, so the login page knows to bounce them back here.

import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Player } from '@lottiefiles/react-lottie-player'
import { BlurredBackdrop, BenefitsCarousel } from '../components'
import { ApplyModal } from '../components/Membership'
import { useAuth, useUserProfile } from '../lib/useAuth'
import { useSiteContent } from '../lib/useSiteContent'
import {
  requestMembershipIntent,
  clearMembershipIntent
} from '../lib/membershipIntent'
import { heroSlides } from '../data/images'
import welcomeAnimation from '../jsons/final.json'
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

export function Welcome() {
  const { user, loading: authLoading } = useAuth()
  const { profile } = useUserProfile(user?.uid)
  const { content } = useSiteContent()
  const [applyOpen, setApplyOpen] = useState(false)

  const membership = content.membership || {}
  const benefits = membership.benefits || []
  const categories = membership.categories || []

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

            <span className="welcome__eyebrow">Members Area</span>
            <h1 className="welcome__title">
              {firstName ? `Welcome to the Guild, ${firstName}` : 'Welcome to the Guild'}
            </h1>
            <p className="welcome__text">
              Your Animation Guild Uganda account is ready. One step left —
              apply for membership and the secretariat will activate your card
              and member benefits.
            </p>
          </motion.div>

          <motion.div
            className="welcome__apply"
            {...CARD_MOTION}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              className="btn btn--apply"
              onClick={() => setApplyOpen(true)}
            >
              Apply for Membership
            </button>
            <p className="welcome__apply-note">
              Choose your category and country of residence — applying is free
              and takes under a minute.
            </p>
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

          <p className="welcome__links">
            <Link to="/login" className="welcome__link">
              View my account
            </Link>
            <span aria-hidden="true"> · </span>
            <Link to="/" className="welcome__link">
              Back to the site
            </Link>
          </p>
        </div>
      </div>

      <ApplyModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        categories={categories}
        feePromo={membership.feePromo}
        user={user}
        profile={profile}
      />
    </main>
  )
}

export default Welcome

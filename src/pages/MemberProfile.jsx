// src/pages/MemberProfile.jsx
//
// The public page behind a member's share link: /member/{uid}
//
// A visitor who was sent this link needs no account. Everything shown comes
// from ONE Firestore document — `memberPortfolios/{uid}` — written at signup
// from buildPublicEntry() (data/portfolio.js). It holds only a display name,
// the category, an institution or profession, and the portfolio links the
// member chose to share.
//
// ⚠️ It never reads `users/{uid}`. That collection carries the member's email,
//    phone and date of birth, and firestore.rules keeps it readable only by the
//    owner and admins. Reading it here would either fail (rules) or, if someone
//    loosened the rule to make this page work, publish everyone's phone number.
//
// `visible: false` on the document pulls a member out of public view without
// deleting their account; see buildPublicEntry().

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { categoryLabel } from '../data/signup'
import { portfolioEntries, MEMBER_PORTFOLIOS_COLLECTION } from '../data/portfolio'
import { heroSlides } from '../data/images'
import { BlurredBackdrop } from '../components'
import './MemberProfile.css'

const CARD_MOTION = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
}

// The public page reuses the same blurred backdrop the auth pages use, so a
// shared link lands in the same visual world as the rest of the site.
const BACKDROP_IMAGES = [
  ...new Set(heroSlides.map((slide) => slide.image).filter(Boolean))
]

export function MemberProfile() {
  const { uid } = useParams()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!uid) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const snap = await getDoc(doc(db, MEMBER_PORTFOLIOS_COLLECTION, uid))
        if (cancelled) return

        // A member who has opted out, and one whose card was never written
        // (an account that predates this feature), look the same to a visitor:
        // the page simply does not exist. Do not distinguish them.
        if (!snap.exists() || snap.data()?.visible === false) {
          setNotFound(true)
        } else {
          setEntry({ id: snap.id, ...snap.data() })
        }
      } catch (error) {
        console.error('MemberProfile load failed', error)
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [uid])

  if (loading) {
    return (
      <section className="auth">
        <BlurredBackdrop images={BACKDROP_IMAGES} />
        <p className="auth__subtitle">Loading profile…</p>
      </section>
    )
  }

  if (notFound || !entry) {
    return (
      <section className="auth">
        <BlurredBackdrop images={BACKDROP_IMAGES} />
        <motion.div className="auth__card" {...CARD_MOTION}>
          <span className="auth__eyebrow">Animation Guild Uganda</span>
          <h1 className="auth__title">Profile not available</h1>
          <p className="auth__subtitle">
            This member has not shared a profile page, or the link has changed.
          </p>
          <div className="auth__actions">
            <Link to="/" className="auth__submit" style={{ textAlign: 'center' }}>
              Back to the site
            </Link>
          </div>
        </motion.div>
      </section>
    )
  }

  const links = portfolioEntries(entry.portfolio)
  // Students list an institution; everyone else a profession — the same pairing
  // the sign-up form and the Firestore rules enforce.
  const detailLabel = entry.isStudent ? 'Institution' : 'Profession'
  const detailValue = entry.isStudent ? entry.school : entry.profession
return (
    <section className="member-page">
      <div className="member-page__bg" aria-hidden="true">
        {BACKDROP_IMAGES.map((src, index) => (
          <div
            key={src + index}
            className="member-page__bg-slide"
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="member-page__bg-overlay" />
      </div>

      <div className="container member-page__inner">
        <motion.div className="member-page__card" {...CARD_MOTION}>
          <span className="member-page__eyebrow">Animation Guild Uganda</span>

          <h1 className="member-page__name">{entry.name || 'Member'}</h1>

          <span className="member-page__category">
            {categoryLabel(entry.category) || 'Member'}
          </span>

          <dl className="member-page__list">
            <div className="member-page__row">
              <dt>Category</dt>
              <dd>{categoryLabel(entry.category) || '—'}</dd>
            </div>
            {detailValue && (
              <div className="member-page__row">
                <dt>{detailLabel}</dt>
                <dd>{detailValue}</dd>
              </div>
            )}
          </dl>

          <div className="member-page__portfolio">
            <h2 className="member-page__portfolio-title">About</h2>
            {entry.about ? (
              <p className="member-page__about">{entry.about}</p>
            ) : (
              <p className="member-page__empty">No bio shared yet.</p>
            )}
          </div>

          <div className="member-page__portfolio">
            <h2 className="member-page__portfolio-title">Portfolio</h2>

            {links.length > 0 ? (
              <ul className="member-page__links">
                {links.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="member-page__link-label">
                        {item.label}
                      </span>
                      <span className="member-page__link-host">
                        {hostOf(item.url)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="member-page__empty">No portfolio links shared yet.</p>
            )}
          </div>

          <div className="member-page__actions">
            <Link
              to="/signup"
              className="member-page__btn member-page__btn--primary"
            >
              Join the Guild
            </Link>
            <Link to="/" className="member-page__btn">
              Visit the site
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/** "https://www.behance.net/jane" → "behance.net" — shown small under the label. */
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export default MemberProfile
// src/pages/Portfolio.jsx
//
// The public member directory: /portfolio
//
// Every signed-up member gets a card here — their name, category, what they do,
// their short "about" note (up to 50 words), and the portfolio links they chose
// to share. It reads `memberPortfolios` (the SAME public collection the share
// link /member/:uid uses), so it never touches `users` — which keeps every
// member's email, phone and date of birth private (see buildPublicEntry() in
// data/portfolio.js for why those two collections are split).
//
// ⚠️ PAYMENT VERIFICATION: this shows ALL signed-up members, by design, because
//    payment verification is not automated yet. Once it is, the natural place to
//    gate this listing is on `visible` / a `paid` flag on the same document —
//    nothing here reads a billing source, so tightening it later is a change to
//    the filter below rather than a redesign.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { MEMBER_PORTFOLIOS_COLLECTION, portfolioEntries } from '../data/portfolio'
import { categoryLabel } from '../data/signup'
import { heroSlides } from '../data/images'
import './Portfolio.css'

// Static hero imagery rather than CMS copy, so the page still has a backdrop if
// Firestore is unreachable. De-duplicated because heroSlides reuses one photo.
const BACKDROP_IMAGES = [
  ...new Set(heroSlides.map((slide) => slide.image).filter(Boolean))
]

/** "Jane Aciro" → "JA" — the avatar when a member has no photo on the card. */
function initialsOf(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => (part[0] ? part[0].toUpperCase() : ''))
    .join('')
}

/** "https://www.behance.net/jane" → "behance.net" — shown small under a link. */
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Newest first — createdAt is a Firestore timestamp on most cards; one that
 *    predates the field simply sorts last rather than crashing the page. */
function byNewest(a, b) {
  const toMillis = (value) =>
    typeof value?.toMillis === 'function'
      ? value.toMillis()
      : value instanceof Date
        ? value.getTime()
        : typeof value === 'number'
          ? value
          : 0
  return toMillis(b.createdAt) - toMillis(a.createdAt)
}


export function Portfolio() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    // orderBy on createdAt: newest first. A member written before this field
    // existed simply lands in the "no timestamp" group at the end.
    const q = query(
      collection(db, MEMBER_PORTFOLIOS_COLLECTION),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          // Opt-out switch: `visible: false` pulls a member off the public list
          // without deleting their account. Absent means visible.
          .filter((entry) => entry.visible !== false)
        setMembers(all)
        setLoading(false)
        setFailed(false)
      },
      (error) => {
        console.error('Portfolio load failed', error)
        setFailed(true)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  // Every category present in the data, in a stable, human order — so the
  // filter only offers chips that actually have members behind them.
  const categories = useMemo(() => {
    const present = new Set()
    members.forEach((entry) => {
      const id = String(entry.category || '').trim()
      if (id) present.add(id)
    })
    return [...present].sort((a, b) =>
      categoryLabel(a).localeCompare(categoryLabel(b))
    )
  }, [members])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return [...members]
      .sort(byNewest)
      .filter((entry) => {
        if (activeCategory !== 'all' && entry.category !== activeCategory) {
          return false
        }
        if (!needle) return true
        const haystack = [
          entry.name,
          entry.profession,
          entry.school,
          entry.about,
          categoryLabel(entry.category)
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(needle)
      })
  }, [members, search, activeCategory])

  return (
    <main className="portfolio page">
      {/* Blurred backdrop + dark wash, so the page reads as part of the site. */}
      <div className="portfolio__bg" aria-hidden="true">
        {BACKDROP_IMAGES.map((src, index) => (
          <div
            key={src + index}
            className="portfolio__bg-slide"
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="portfolio__bg-overlay" />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="portfolio__hero">
        <div className="container">
          <motion.div
            className="portfolio__hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="portfolio__eyebrow">Animation Guild Uganda</span>
            <h1 className="portfolio__title">Member Portfolio</h1>
            <p className="portfolio__subtitle">
              The animators, studios and students who make up the Guild — with
              the work they share and a line about themselves.
            </p>
            <p className="portfolio__count">
              {loading
                ? '…'
                : `${filtered.length} ${filtered.length === 1 ? 'member' : 'members'}`}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Controls: search + category filter ───────────────────────────── */}
      <section className="portfolio__controls">
        <div className="container">
          <div className="portfolio__toolbar">
            <label className="portfolio__search" htmlFor="portfolio-search">
              <span className="portfolio__search-icon" aria-hidden="true">⌕</span>
              <input
                id="portfolio-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, profession or keyword…"
                autoComplete="off"
              />
            </label>

            {categories.length > 1 && (
              <div
                className="portfolio__chips"
                role="group"
                aria-label="Filter by category"
              >
                <button
                  type="button"
                  className={`portfolio__chip ${activeCategory === 'all' ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  All
                </button>
                {categories.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`portfolio__chip ${activeCategory === id ? 'is-active' : ''}`}
                    onClick={() => setActiveCategory(id)}
                  >
                    {categoryLabel(id)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── The grid ─────────────────────────────────────────────────────── */}
      <section className="portfolio__list">
        <div className="container">
          {loading ? (
            <div className="portfolio__status">
              <div className="spinner" />
              <p>Loading members…</p>
            </div>
          ) : failed ? (
            <div className="portfolio__status">
              <p>Members could not be loaded right now. Please try again.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="portfolio__status">
              <p>
                {search || activeCategory !== 'all'
                  ? 'No members match your search.'
                  : 'No members have joined yet — be the first.'}
              </p>
              {!search && activeCategory === 'all' && (
                <Link to="/signup" className="portfolio__empty-cta">
                  Join the Guild
                </Link>
              )}
            </div>
          ) : (
            <ul className="portfolio__grid">
              {filtered.map((entry, index) => {
                const links = portfolioEntries(entry.portfolio)
                const detailValue = entry.isStudent ? entry.school : entry.profession
                const detailLabel = entry.isStudent ? 'Institution' : 'Profession'

                return (
                  <motion.li
                    key={entry.id}
                    className="portfolio__card"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, delay: Math.min(index * 0.06, 0.4) }}
                  >
                    <div className="portfolio__card-head">
                      <span className="portfolio__avatar" aria-hidden="true">
                        {initialsOf(entry.name) || '—'}
                      </span>
                      <div className="portfolio__identity">
                        <h2 className="portfolio__name">{entry.name || 'Member'}</h2>
                        <span className="portfolio__category">
                          {categoryLabel(entry.category) || 'Member'}
                        </span>
                      </div>
                    </div>

                    {detailValue && (
                      <p className="portfolio__detail">
                        <span className="portfolio__detail-label">{detailLabel}</span>
                        <span className="portfolio__detail-value">{detailValue}</span>
                      </p>
                    )}

                    {/* The 50-word "tell us about yourself" note. Omitted
                        entirely when a member left it blank. */}
                    {entry.about && <p className="portfolio__about">{entry.about}</p>}

                    <div className="portfolio__links">
                      {links.length > 0 ? (
                        links.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="portfolio__link"
                          >
                            <span className="portfolio__link-label">{link.label}</span>
                            <span className="portfolio__link-host">{hostOf(link.url)}</span>
                          </a>
                        ))
                      ) : (
                        <span className="portfolio__link-empty">No links shared yet.</span>
                      )}
                    </div>

                    <Link to={`/member/${entry.id}`} className="portfolio__view">
                      View full profile →
                    </Link>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

export default Portfolio

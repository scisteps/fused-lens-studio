// components/BenefitsCarousel
//
// One member benefit at a time, advancing on its own — 5 seconds per card by
// default — with arrows and dots for manual control. Used twice:
//   * the top of the Membership section (the lead-in to "Apply")
//   * the welcome screen, under the apply button
//
// Card fills cycle white → orange → green, matching the palette the membership
// benefits grid already uses, so the two presentations feel like one family.
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { highlightLead } from '../../lib/highlightLead'
import './BenefitsCarousel.css'

const VARIANTS = ['white', 'orange', 'green']
const DEFAULT_INTERVAL = 5000

export function BenefitsCarousel({
  benefits = [],
  interval = DEFAULT_INTERVAL,
  className = ''
}) {
  const items = benefits.filter(Boolean)
  const total = items.length
  const [index, setIndex] = useState(0)
  // Auto-advance pauses while the visitor is reading/hovering or tabbing
  // through the controls, so a slide never changes under their cursor.
  const [paused, setPaused] = useState(false)

  // Keep the index valid if the CMS shortens the list while we are on screen.
  useEffect(() => {
    setIndex((current) => (current >= total ? 0 : current))
  }, [total])

  useEffect(() => {
    if (total < 2 || paused) return undefined
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % total)
    }, interval)
    return () => clearInterval(id)
  }, [total, interval, paused])

  if (!total) return null

  const safeIndex = Math.min(index, total - 1)
  const variant = VARIANTS[safeIndex % VARIANTS.length]
  const displayNumber = String(safeIndex + 1).padStart(2, '0')

  const step = (delta) =>
    setIndex((current) => ((Math.min(current, total - 1) + delta + total) % total))

  return (
    <div
      className={['benefits-carousel', className].filter(Boolean).join(' ')}
      role="group"
      aria-roledescription="carousel"
      aria-label="Member benefits"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="benefits-carousel__viewport">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={safeIndex}
            className={`benefits-carousel__slide benefits-carousel__slide--${variant}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            aria-live="polite"
          >
            <span className="benefits-carousel__number" aria-hidden="true">
              {displayNumber}
            </span>
            <p className="benefits-carousel__text">
              {highlightLead(items[safeIndex])}
            </p>
          </motion.article>
        </AnimatePresence>

        {total > 1 && (
          <>
            <button
              type="button"
              className="benefits-carousel__arrow benefits-carousel__arrow--prev"
              onClick={() => step(-1)}
              aria-label="Previous benefit"
            >
              ‹
            </button>
            <button
              type="button"
              className="benefits-carousel__arrow benefits-carousel__arrow--next"
              onClick={() => step(1)}
              aria-label="Next benefit"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thin timer showing how long the current card has left (5s by default) */}
      <div className="benefits-carousel__progress" aria-hidden="true">
        <span
          key={safeIndex}
          className="benefits-carousel__progress-bar"
          style={{
            animationDuration: `${interval}ms`,
            animationPlayState: paused ? 'paused' : 'running'
          }}
        />
      </div>

      {total > 1 && (
        <div className="benefits-carousel__dots" role="tablist" aria-label="Choose a benefit">
          {items.map((item, i) => (
            <button
              key={`${i}-${String(item).slice(0, 12)}`}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`Benefit ${i + 1}`}
              className={`benefits-carousel__dot ${i === safeIndex ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BenefitsCarousel

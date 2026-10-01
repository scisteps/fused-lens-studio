// components/PortfolioLinks
//
// The "Portfolio links" field on the sign-up form.
//
// A grid of tiles, one per platform (LinkedIn, Instagram, Behance, Dribbble,
// Web, Other). Tapping a tile opens a box underneath it to paste the link —
// several tiles can be filled in turn, because most animators keep their reel
// in more than one place. "Other" is the escape hatch for a link that is none
// of the above.
//
// The tile LABELS come from src/data/portfolio.js — that is the only file to
// touch to add, rename or remove a platform. Like ProfessionPicker, the tiles
// are text-only: no icons, no artwork, nothing to download.
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PORTFOLIO_LINKS } from '../../data/portfolio'
import './PortfolioLinks.css'

const BOX_MOTION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.25, ease: 'easeInOut' }
}

export function PortfolioLinks({
  // A { linkedin: '…', instagram: '…' } map — the same shape stored on the
  // profile and written to the sheet.
  value = {},
  onChange,
  // The single "paste at least one link" message for the whole group.
  error = '',
  // Per-tile messages, keyed by platform id, e.g.
  // { linkedin: 'That does not look like a link.' }
  fieldErrors = {},
  id = 'su-portfolio'
}) {
  const [openId, setOpenId] = useState('')
  const rootRef = useRef(null)
  const boxRef = useRef(null)

  // A tile is "filled" when it holds a link; a prefilled tile opens itself so
  // an edit-in-place profile still shows what the member already saved.
  const filledId = PORTFOLIO_LINKS.find((link) => value?.[link.id])?.id || ''
  const activeId = openId || filledId

  // Tapping the open tile closes it again.
  const toggle = (platformId) => {
    setOpenId((current) => (current === platformId ? '' : platformId))
  }

  const setLink = (platformId, url) => {
    onChange?.({ ...value, [platformId]: url })
  }

  // Keep the caret in the box they just opened.
  useEffect(() => {
    if (!activeId) return
    window.requestAnimationFrame(() => boxRef.current?.focus())
  }, [activeId])

  // Escape closes the open box, matching the profession picker.
  useEffect(() => {
    if (!activeId) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpenId('')
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeId])

  return (
    <div className="pf-links" ref={rootRef}>
      <div className="pf-links__grid" role="group" aria-label="Portfolio platforms">
        {PORTFOLIO_LINKS.map((platform) => {
          const open = platform.id === activeId
          const filled = Boolean(value?.[platform.id])
          const invalid = Boolean(fieldErrors?.[platform.id])

          return (
            <button
              key={platform.id}
              type="button"
              className={[
                'pf-links__tile',
                platform.isOther ? 'pf-links__tile--other' : '',
                open ? 'is-open' : '',
                filled && !open ? 'is-filled' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={open}
              aria-invalid={invalid ? 'true' : undefined}
              onClick={() => toggle(platform.id)}
            >
              <span className="pf-links__tile-label">{platform.label}</span>
              {/* A tick so a member can see at a glance which tiles they have
                  already filled in without opening each one. */}
              {filled && (
                <span className="pf-links__tick" aria-hidden="true">✓</span>
              )}
            </button>
          )
        })}
      </div>
{/* The single link box for whichever tile is open. One box at a time —
          the member fills it, then taps the next platform. */}
      <AnimatePresence initial={false}>
        {PORTFOLIO_LINKS.map((platform) => {
          if (platform.id !== activeId) return null

          const invalid = Boolean(fieldErrors?.[platform.id])

          return (
            <motion.div
              key={platform.id}
              className="pf-links__box"
              {...BOX_MOTION}
            >
              <label
                className="pf-links__box-label"
                htmlFor={`${id}-${platform.id}`}
              >
                {platform.label} link
              </label>
              <input
                id={`${id}-${platform.id}`}
                ref={boxRef}
                type="url"
                inputMode="url"
                autoComplete="url"
                spellCheck="false"
                value={value?.[platform.id] || ''}
                placeholder={platform.placeholder}
                aria-invalid={invalid ? 'true' : undefined}
                onChange={(event) => setLink(platform.id, event.target.value)}
              />
              {fieldErrors?.[platform.id] ? (
                <span className="pf-links__box-error">
                  {fieldErrors[platform.id]}
                </span>
              ) : (
                <span className="pf-links__box-hint">
                  {platform.isOther
                    ? 'Any link that shows your work — a reel, a Vimeo, a PDF.'
                    : `Paste your ${platform.label} URL — https:// is added for you.`}
                </span>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* The group-level message ("add at least one link"). It lives here
          rather than on a tile because it is about the group, not one of
          them. */}
      <div aria-live="polite">
        {error ? (
          <span className="pf-links__error">{error}</span>
        ) : (
          <span className="pf-links__hint">
            Tap a platform, paste your link, then tap the next one — add as many
            as you like.
          </span>
        )}
      </div>
    </div>
  )
}

export default PortfolioLinks
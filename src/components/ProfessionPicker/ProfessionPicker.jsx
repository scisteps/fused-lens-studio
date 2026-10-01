// components/ProfessionPicker
//
// The "Profession" field on the sign-up form.
//
// The trigger is styled like every other input in the form. Opening it drops a
// box underneath holding one tile per category — a plain label, laid out row
// by column. Choosing the "Other" tile opens a free-text box so the member can
// name a category that is not on the grid; whatever they type becomes their
// profession.
//
// The tiles (labels and order) all come from src/data/professions.js — that is
// the only file to touch to add or rename a category. The tiles are text-only:
// the Lottie artwork each one used to carry has been removed, so nothing here
// downloads an animation.
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROFESSION_CATEGORIES } from '../../data/professions'
import './ProfessionPicker.css'

const PANEL_MOTION = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
}

export function ProfessionPicker({
  value = '',
  onChange,
  categories = PROFESSION_CATEGORIES,
  id = 'su-profession',
  error = ''
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const otherRef = useRef(null)

  // A value that matches no tile was typed into the "Other" box.
  const isListed = categories.some(
    (category) => !category.isOther && category.label === value
  )

  const [otherOpen, setOtherOpen] = useState(() => Boolean(value) && !isListed)
  const [other, setOther] = useState(() => (isListed ? '' : value))

  const invalid = Boolean(error)

  const setOtherValue = (next) => {
    setOther(next)
    onChange?.(next)
  }

  const choose = (category) => {
    if (category.isOther) {
      // Keep the grid on screen — the text box they just asked for appears
      // underneath it, with the caret already in it.
      setOtherOpen(true)
      onChange?.(other.trim())
      window.requestAnimationFrame(() => otherRef.current?.focus())
      return
    }

    setOtherOpen(false)
    onChange?.(category.label)
    setOpen(false)
  }

  // Close on outside click / Escape while the box is open.
  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="prof-picker" ref={rootRef}>
      <button
        type="button"
        id={id}
        className="prof-picker__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={['prof-picker__value', value ? '' : 'is-placeholder']
            .filter(Boolean)
            .join(' ')}
        >
          {value || 'Select your profession…'}
        </span>
        <svg
          className="prof-picker__chevron"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="prof-picker__panel"
            role="group"
            aria-label="Profession categories"
            {...PANEL_MOTION}
          >
            <div className="prof-picker__grid">
              {categories.map((category) => {
                const selected = category.isOther
                  ? otherOpen
                  : category.label === value

                return (
                  <button
                    key={category.id || category.label}
                    type="button"
                    className={[
                      'prof-picker__tile',
                      category.isOther ? 'prof-picker__tile--other' : '',
                      selected ? 'is-selected' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={selected}
                    onClick={() => choose(category)}
                  >
                    <span className="prof-picker__tile-label">
                      {category.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* The "Other" free-text box */}
            <AnimatePresence initial={false}>
              {otherOpen && (
                <motion.div
                  className="prof-picker__other"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <label
                    className="prof-picker__other-label"
                    htmlFor={`${id}-other`}
                  >
                    Your category
                  </label>
                  <input
                    id={`${id}-other`}
                    ref={otherRef}
                    type="text"
                    autoComplete="off"
                    value={other}
                    placeholder="e.g. Comic Artist"
                    aria-invalid={invalid ? 'true' : undefined}
                    onChange={(event) => setOtherValue(event.target.value)}
                  />
                  <span className="prof-picker__other-hint">
                    Type the category that fits you best.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {invalid && (
        <span id={`${id}-error`} className="auth__error-text">
          {error}
        </span>
      )}
    </div>
  )
}

export default ProfessionPicker


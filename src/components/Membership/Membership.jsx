import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../../lib/useSiteContent'
import { resolveImage } from '../../data/images'
import './Membership.css'

// Bolds the lead clause (up to the first comma/period) of a sentence so
// CMS-authored text reads with a scannable, condensed feel.
function highlightLead(text = '') {
  const match = text.match(/^([^,.:]+)([,.:]?.*)$/s)
  if (!match) return text
  return (
    <>
      <strong>{match[1]}</strong>
      {match[2]}
    </>
  )
}

// Group benefits into rows with matching glows.
// Indices refer to positions in membership.benefits — the numbers
// shown on each card come from that index + 1, so they stay sequential
// across all groups (01, 02, 03, 04, 05…).
const BENEFIT_GROUPS = [
  { indices: [0, 1], variant: 'green',  label: 'Core Membership' },
  { indices: [2],    variant: 'white',  label: 'Participation' },
  { indices: [3, 4], variant: 'orange', label: 'Advocacy & Voice' },
]

export function Membership() {
  const { content } = useSiteContent()
  const [activeIndex, setActiveIndex] = useState(0)
  const [openCategory, setOpenCategory] = useState(null)

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

  const mappedIndices = BENEFIT_GROUPS.flatMap(g => g.indices)
  const extras = benefits
    .map((_, i) => i)
    .filter(i => !mappedIndices.includes(i))
    .map(i => ({ benefit: benefits[i], index: i }))

  const benefitGroups = [
    ...BENEFIT_GROUPS.map(group => ({
      ...group,
      items: group.indices
        .map(i => ({ benefit: benefits[i], index: i }))
        .filter(item => item.benefit),
    })),
  ]
  if (extras.length) {
    benefitGroups.push({ variant: 'white', label: 'More', items: extras })
  }

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

   {membership.eligibility && (
  <motion.div
    className="membership__join membership__join--light"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: 0.2 }}
  >
    <h3 className="membership__join-title">Who Can Join?</h3>
    <p className="membership__join-text">
      {highlightLead(membership.eligibility)}
    </p>
  </motion.div>
)}

        {membership.categories?.length > 0 && (
          <motion.div
            className="membership__categories"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="membership__categories-title">Membership Categories</h3>
            <div className="membership__categories-grid">
              {membership.categories.map((category, index) => {
                const isOpen = openCategory === index
                const variant = ['white', 'orange', 'green'][index % 3]

                return (
                  <button
                    key={index}
                    type="button"
                    className={[
                      'membership__category',
                      `membership__category--${variant}`,
                      isOpen ? 'is-open' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setOpenCategory(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <div className="membership__category-header">
                      <span className="membership__category-name">{category.name}</span>
                      <span className="membership__category-toggle">
                        {isOpen ? '−' : '>'}
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
                          {category.fee && (
                            <p className="membership__category-fee">
                              <strong>{category.fee}</strong>
                            </p>
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

        {/* Benefits — grouped into rows, globally numbered 01, 02, 03… */}
        {benefits.length > 0 && (
          <motion.div
            className="membership__benefits"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="membership__benefits-title">Member Benefits</h3>

            {benefitGroups.map((group, gi) => (
              <div
                key={gi}
                className={`membership__benefit-group membership__benefit-group--${group.variant}`}
              >
                <span className="membership__benefit-group-label">
                  {group.label}
                </span>

                <div className="membership__benefit-row">
                  {group.items.map(({ benefit, index }) => {
                    const displayNumber = String(index + 1).padStart(2, '0')

                    return (
                      <div
                        key={index}
                        className={`membership__benefit membership__benefit--${group.variant}`}
                      >
                        <span className="membership__benefit-number">
                          {displayNumber}
                        </span>
                        <p className="membership__benefit-description">
                          {highlightLead(benefit)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}

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
          <h3>Ready to Join?</h3>
          <p>
            {membership.description ||
              'Apply now to become a member of the Animation Guild Uganda.'}
          </p>
          <button className="btn btn--secondary">Apply for Membership</button>
        </motion.div>
      </div>
    </section>
  )
}
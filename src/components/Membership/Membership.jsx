import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../../lib/useSiteContent'
import { resolveImage } from '../../data/images'
import './Membership.css'

// Bolds the lead clause (up to the first comma/period) of a sentence so
// CMS-authored text reads with a scannable, condensed feel without
// changing the underlying data shape.
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

export function Membership() {
  const { content } = useSiteContent()
  const [activeIndex, setActiveIndex] = useState(0)
  const [openCategory, setOpenCategory] = useState(null)

  const bgImageIds = (content.heroSlides || [])
    .map(slide => slide.imageId)
    .filter(Boolean)

  // Cycle the blurred background through the hero carousel images.
  useEffect(() => {
    if (bgImageIds.length < 2) return
    const id = setInterval(() => {
      setActiveIndex(current => (current + 1) % bgImageIds.length)
    }, 6000)
    return () => clearInterval(id)
  }, [bgImageIds.length])

  if (content.visibility?.membership === false) return null

  const membership = content.membership || {}

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
          <span className="section-label">{membership.title || 'Membership'}</span>
          <h2 className="section-title">Join Our Community</h2>
          <p className="section-subtitle">
            {membership.overview || "Become part of Uganda's leading animation guild and grow with us."}
          </p>
          <span className="membership__registered-badge">Officially Registered in Uganda</span>
        </motion.div>

        {membership.eligibility && (
          <motion.div
            className="membership__join"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3>Who Can Join?</h3>
            <p>{highlightLead(membership.eligibility)}</p>
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
                return (
                  <button
                    key={index}
                    type="button"
                    className={`membership__category ${isOpen ? 'is-open' : ''}`}
                    onClick={() => setOpenCategory(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <div className="membership__category-header">
                      <span className="membership__category-name">{category.name}</span>
                      <span className="membership__category-toggle">{isOpen ? '−' : '+'}</span>
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
                            <p className="membership__category-fee"><strong>{category.fee}</strong></p>
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

        {membership.benefits?.length > 0 && (
          <motion.div
            className="membership__benefits"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="membership__benefits-title">Member Benefits</h3>
            {membership.benefits.map((benefit, index) => (
              <div className="membership__benefit" key={index}>
                <div className="membership__benefit-icon">✓</div>
                <p className="membership__benefit-description">{highlightLead(benefit)}</p>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="membership__cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link to="/members" className="btn btn--primary">View All Members</Link>
        </motion.div>

        <motion.div
          className="membership__join"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3>Ready to Join?</h3>
          <p>{membership.description || 'Apply now to become a member of the Animation Guild Uganda.'}</p>
          <button className="btn btn--secondary">Apply for Membership</button>
        </motion.div>
      </div>
    </section>
  )
}
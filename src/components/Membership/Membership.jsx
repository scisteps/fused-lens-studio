import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../../lib/useSiteContent'
import './Membership.css'

export function Membership() {
  const { content } = useSiteContent()
  if (content.visibility?.membership === false) return null

  return (
    <section id="membership" className="membership section section--dark">
      <div className="container">
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="section-label">Membership</span>
          <h2 className="section-title">Join Our Community</h2>
          <p className="section-subtitle">
            Become part of Uganda's leading animation guild and grow with us.
          </p>
        </motion.div>

        <motion.div
          className="membership__cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link to="/members" className="btn btn--primary">
            View All Members
          </Link>
        </motion.div>

        <motion.div
          className="membership__join"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3>Ready to Join?</h3>
          <p>Apply now to become a member of the Animation Guild Uganda.</p>
          <button className="btn btn--secondary">Apply for Membership</button>
        </motion.div>
      </div>
    </section>
  )
}

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './Membership.css'

export function Membership() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch members from API
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const benefits = [
    {
      icon: '🎯',
      title: 'president',
      description: 'Rayment Malinga.'
    },
    {
      icon: '🤝',
      title: 'Vice President',
      description: 'Vijay jay.'
    },
    {
      icon: '📚',
      title: 'Secretary',
      description: 'Mushe Alex.'
    },
    {
      icon: '🎬',
      title: 'Vice Secretary',
      description: 'Sam Nungi.'
    },
    {
      icon: '🏆' ,
      title: 'Treasurer',
      description: 'Juliet Nsiima.'
    },
    {
      icon: '📢',
      title: 'Vice Treasurer',
      description: 'Kizito Mbuga'
    }
  ]

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

        {/* Members Button */}
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

        {/* Benefits Grid */}
        <div className="membership__benefits">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="membership__benefit"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              <div className="membership__benefit-icon">{benefit.icon}</div>
              <h3 className="membership__benefit-title">{benefit.title}</h3>
              <p className="membership__benefit-description">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Join CTA */}
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
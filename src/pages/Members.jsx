import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { resolveImage } from '../data/images'
import { useCollection } from '../lib/useCollection'
import './Members.css'

export function Members() {
  const { items: members, loading } = useCollection('members')
  const [bgIndex, setBgIndex] = useState(0)

  const bgImages = members
    .map(member => resolveImage(member.imageId) || member.image)
    .filter(Boolean)

  // Slow blurred slideshow behind the black background
  useEffect(() => {
    if (bgImages.length < 2) return
    const id = setInterval(() => {
      setBgIndex(current => (current + 1) % bgImages.length)
    }, 6000)
    return () => clearInterval(id)
  }, [bgImages.length])

  if (loading) return <div className="members__loading"><div className="spinner" /><p>Loading members...</p></div>

  return (
    <main className="members page">
      {/* Black background + blurred member slideshow */}
      <div className="members__bg" aria-hidden="true">
        {bgImages.map((src, index) => (
          <div
            key={src + index}
            className={`members__bg-slide ${index === bgIndex ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="members__bg-overlay" />
      </div>

      <section className="members__hero">
        <div className="container">
          <motion.div
            className="members__hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="members__eyebrow">Animation Guild Uganda</span>
            <h3> Executive Committee</h3>
            {/* <p className="members__subtitle">
              Elected leadership guiding the Guild — strategy, records,
              finance and representation for Uganda&apos;s animation community.
            </p> */}
            <p className="members__count">{members.length} members</p>
          </motion.div>
        </div>
      </section>

      <section className="members__list">
        <div className="container">
          {/* Single column — one executive per row, revealed one at a time */}
          <ol className="members__column">
            {members.map((member, index) => {
              const image = resolveImage(member.imageId) || member.image
              const rank = String(index + 1).padStart(2, '0')
              return (
                <motion.li
                  key={member.id}
                  className="members__row"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: Math.min(index * 0.08, 0.4) }}
                >
                  <span className="members__rank" aria-hidden="true">{rank}</span>
                  <div className="members__portrait">
                    {image ? (
                      <img src={image} alt={member.name} loading="lazy" />
                    ) : (
                      <div className="members__portrait-fallback">
                        {member.name?.split(' ').map(name => name[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div className="members__details">
                    <h3 className="members__name">{member.name}</h3>
                    <p className="members__role">{member.role}</p>
                    {/* <p className="members__meta">
                      {[member.expertise, member.joined && `Since ${new Date(`${member.joined}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </p> */}
                    {/* {member.bio && <p className="members__bio">{member.bio}</p>} */}
                  </div>
                </motion.li>
              )
            })}
          </ol>
          {!members.length && (
            <div className="members__empty"><p>No committee members published yet.</p></div>
          )}
        </div>
      </section>
    </main>
  )
}


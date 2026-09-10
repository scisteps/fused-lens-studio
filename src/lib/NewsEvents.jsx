import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lightbox } from '../components/Lightbox'
import { useCollection } from '../../hooks/useCollection'
import './NewsEvents.css'

gsap.registerPlugin(ScrollTrigger)

// A small self-contained carousel for entries with more than one image.
// Single-image entries just render a plain <img> — no controls needed.
function CardImage({ item }) {
  const [index, setIndex] = useState(0)
  const images = item.images || []

  if (images.length === 0) {
    return (
      <div className="news-events__card-placeholder">
        <span>🎬</span>
      </div>
    )
  }

  if (images.length === 1) {
    return <img src={images[0].url} alt={images[0].alt || item.title} />
  }

  const go = (e, dir) => {
    e.stopPropagation()
    setIndex(prev => (prev + dir + images.length) % images.length)
  }

  return (
    <div className="news-events__carousel">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index].url}
          alt={images[index].alt || item.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        />
      </AnimatePresence>
      <button className="news-events__carousel-nav news-events__carousel-nav--prev" onClick={(e) => go(e, -1)} aria-label="Previous photo">‹</button>
      <button className="news-events__carousel-nav news-events__carousel-nav--next" onClick={(e) => go(e, 1)} aria-label="Next photo">›</button>
      <div className="news-events__carousel-dots">
        {images.map((_, i) => (
          <span key={i} className={`news-events__carousel-dot ${i === index ? 'news-events__carousel-dot--active' : ''}`} />
        ))}
      </div>
    </div>
  )
}

export function NewsEvents() {
  const { items: newsItems, loading } = useCollection('newsEvents')
  const [selectedImage, setSelectedImage] = useState(null)
  const [filter, setFilter] = useState('all')
  const gridRef = useRef(null)
  const itemRefs = useRef([])

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'event', label: 'Events' },
    { id: 'workshop', label: 'Workshops' },
    { id: 'news', label: 'News' },
    { id: 'showcase', label: 'Showcases' }
  ]

  const filteredItems = filter === 'all'
    ? newsItems
    : newsItems.filter(item => item.category === filter)

  useEffect(() => {
    const items = itemRefs.current.filter(Boolean)
    gsap.set(items, { opacity: 0, y: 60, scale: 0.95 })
    const animation = gsap.to(items, {
      opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: gridRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
    })
    return () => {
      animation.kill()
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [filteredItems])

  if (loading) {
    return (
      <div className="news-events__loading">
        <div className="spinner"></div>
        <p>Loading news & events...</p>
      </div>
    )
  }

  return (
    <main className="news-events page">
      <section className="news-events__hero">
        <div className="container">
          <motion.div
            className="news-events__hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1>News & Events</h1>
            <p>Stay updated with the latest happenings at Animation Guild Uganda</p>
          </motion.div>
        </div>
      </section>

      <section className="news-events__gallery">
        <div className="container">
          <motion.div
            className="news-events__filters"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`news-events__filter ${filter === cat.id ? 'news-events__filter--active' : ''}`}
                onClick={() => setFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          <div className="news-events__grid" ref={gridRef}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.article
                  key={item.id}
                  ref={(el) => (itemRefs.current[index] = el)}
                  className="news-events__card"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => item.images?.length && setSelectedImage(item)}
                >
                  <div className="news-events__card-image">
                    <CardImage item={item} />
                    <span className="news-events__card-category">{item.category}</span>
                  </div>
                  <div className="news-events__card-content">
                    <time className="news-events__card-date">
                      {item.date && new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </time>
                    <h3 className="news-events__card-title">{item.title}</h3>
                    <p className="news-events__card-description">{item.description}</p>
                    {item.location && (
                      <span className="news-events__card-location">📍 {item.location}</span>
                    )}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          {filteredItems.length === 0 && (
            <div className="news-events__empty">
              <p>No news or events found in this category.</p>
            </div>
          )}
        </div>
      </section>

      <Lightbox
        image={selectedImage}
        images={filteredItems.filter(item => item.images?.length)}
        onClose={() => setSelectedImage(null)}
        onNavigate={setSelectedImage}
      />
    </main>
  )
}

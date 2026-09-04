import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lightbox } from '../components/Lightbox'
import './NewsEvents.css'

gsap.registerPlugin(ScrollTrigger)

export function NewsEvents() {
  const [newsItems, setNewsItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [filter, setFilter] = useState('all')
  const gridRef = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    // Fetch news and events from API
    fetch('/api/news-events')
      .then(res => res.json())
      .then(data => {
        setNewsItems(data)
        setLoading(false)
      })
      .catch(() => {
        // Fallback data
        setNewsItems([
          {
            id: 1,
            title: 'Animation Guild Uganda Inaugural Meeting',
            date: '2026-01-15',
            category: 'event',
            description: 'The first official meeting of the Animation Guild Uganda was held in Kampala.',
            image: '/images/event1.jpg',
            location: 'Kampala, Uganda'
          },
          {
            id: 2,
            title: 'Mobile Animation Workshop 2026',
            date: '2026-02-10',
            category: 'workshop',
            description: 'Learn how to create animations using mobile devices.',
            image: '/images/event2.jpg',
            location: 'Online'
          }
        ])
        setLoading(false)
      })
  }, [])

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

  // Scroll animations
  useEffect(() => {
    const items = itemRefs.current.filter(Boolean)
    
    gsap.set(items, { opacity: 0, y: 60, scale: 0.95 })
    
    const animation = gsap.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: gridRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      }
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
          {/* Filters */}
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

          {/* Grid */}
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
                  onClick={() => item.image && setSelectedImage(item)}
                >
                  <div className="news-events__card-image">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <div className="news-events__card-placeholder">
                        <span>🎬</span>
                      </div>
                    )}
                    <span className="news-events__card-category">{item.category}</span>
                  </div>
                  <div className="news-events__card-content">
                    <time className="news-events__card-date">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
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

      {/* Lightbox */}
      <Lightbox
        image={selectedImage}
        images={filteredItems.filter(item => item.image)}
        onClose={() => setSelectedImage(null)}
        onNavigate={setSelectedImage}
      />
    </main>
  )
}
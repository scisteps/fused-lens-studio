import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollection } from '../lib/useCollection'
import { heroSlides } from '../data/images'
import { imageSource, categoryLabel, formatDate, FILTERS } from '../lib/newsFormat'
import { BlurredBackdrop, RequireAuth } from '../components'
import { NewsArticle } from '../components/NewsArticle'
import './NewsEvents.css'

// The article is addressed by URL — /news-events?article=<id> — so a
// notification can link straight to a story, and a story can be bookmarked or
// shared. `openId` is no longer the source of truth; the query string is.
export function NewsEvents() {
  const { items: newsItems, loading } = useCollection('newsEvents')
  const [filter, setFilter] = useState('all')
  const [searchParams, setSearchParams] = useSearchParams()

  // The article named in the URL, or null for the list view.
  const requestedId = searchParams.get('article')
  const openId = requestedId && newsItems.some(item => item.id === requestedId)
    ? requestedId
    : null

  const closeArticle = () => {
    // Drop only ?article, keeping any other query the visitor arrived with.
    setSearchParams(
      current => {
        const next = new URLSearchParams(current)
        next.delete('article')
        return next
      },
      { replace: true }
    )
  }

  const filteredItems = useMemo(
    () => (filter === 'all' ? newsItems : newsItems.filter(item => item.category === filter)),
    [filter, newsItems]
  )

  // Photos for the blurred backdrop stay in published order, so the wash behind
  // the page matches the stories a reader is looking at.
  const backdropImages = useMemo(() => {
    const fromNews = newsItems.flatMap(item => (item.images || []).map(imageSource)).filter(Boolean)
    const fromHero = heroSlides.map(slide => slide.image).filter(Boolean)
    return fromNews.length >= 2 ? fromNews : [...fromNews, ...fromHero]
  }, [newsItems])

  const openIndex = newsItems.findIndex(item => item.id === openId)
  const openItem = openIndex >= 0 ? newsItems[openIndex] : null
  const nextItem = openIndex >= 0 ? newsItems[openIndex + 1] || null : null
  const prevItem = openIndex > 0 ? newsItems[openIndex - 1] : null

  const openStory = (item) => {
    if (!item) return
    setSearchParams(
      current => {
        const next = new URLSearchParams(current)
        next.set('article', item.id)
        return next
      },
      { replace: false }
    )
    window.scrollTo(0, 0)
  }

  // Escape from the reading view goes back to the list, like closing a book.
  useEffect(() => {
    if (!openItem) return
    const onKeyDown = event => {
      if (event.key === 'Escape') closeArticle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openItem])

  if (loading) {
    return (
      <main className="news-events page">
        <div className="news-events__loading">
          <div className="spinner" />
          <p>Loading news &amp; events...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="news-events page">
      <BlurredBackdrop images={backdropImages} strength={openItem ? 'strong' : 'normal'} />

      <AnimatePresence mode="wait">
        {openItem ? (
          /* The story itself is member content. A signed-out visitor who
             followed a notification, a shared link or a bookmark lands here and
             is offered the sign-in screen, then returned to this same URL. */
          <RequireAuth key={`article-${openItem.id}`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <NewsArticle
                item={openItem}
                next={nextItem}
                prev={prevItem}
                onNext={() => openStory(nextItem)}
                onPrev={() => openStory(prevItem)}
                onBack={closeArticle}
                index={openIndex}
                total={newsItems.length}
              />
            </motion.div>
          </RequireAuth>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <section className="news-events__hero">
              <div className="container">
                <motion.div
                  className="news-events__hero-content"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <span className="news-events__eyebrow">Animation Guild Uganda</span>
                  <h1>News &amp; Events</h1>
                  <p>Dispatches, workshops and showcases from Uganda&apos;s animation community</p>
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
                  {FILTERS.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`news-events__filter ${filter === cat.id ? 'news-events__filter--active' : ''}`}
                      onClick={() => setFilter(cat.id)}
                      aria-pressed={filter === cat.id}
                    >
                      {cat.label}
                    </button>
                  ))}
                </motion.div>

                <div className="news-events__grid">
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item, index) => (
                      <motion.article
                        key={item.id}
                        className="news-events__card"
                        layout
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <button
                          type="button"
                          className="news-events__card-hit clickable"
                          onClick={() => openStory(item)}
                          aria-label={`Read: ${item.title}`}
                        >
                          <div className="news-events__card-image">
                            {imageSource(item.images?.[0]) ? (
                              <img
                                src={imageSource(item.images[0])}
                                alt={item.images[0].alt || item.title}
                                loading="lazy"
                              />
                            ) : (
                              <div className="news-events__card-placeholder">
                                <span aria-hidden="true">🎬</span>
                              </div>
                            )}
                            <span className="news-events__card-category">{categoryLabel(item.category)}</span>
                          </div>

                          <div className="news-events__card-content">
                            {item.date && (
                              <time className="news-events__card-date" dateTime={item.date}>
                                {formatDate(item.date)}
                              </time>
                            )}
                            <h3 className="news-events__card-title">{item.title}</h3>
                            <p className="news-events__card-description">{item.description}</p>
                            <span className="news-events__card-meta">
                              {item.location && <span className="news-events__card-location">{item.location}</span>}
                              <span className="news-events__card-cta">Read article →</span>
                            </span>
                          </div>
                        </button>
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
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

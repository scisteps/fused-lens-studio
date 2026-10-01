// components/NewsCarousel
//
// A horizontal strip of news & events stories, shown on the home page directly
// under the hero — but only to signed-in members, because it links straight
// into the members-only article view.
//
// It is a scroll-snap track rather than an auto-advancing slideshow: the reader
// controls it with the arrows, can swipe it on touch, and the position never
// moves out from under them mid-sentence. `scroll-snap-type: x mandatory` does
// the snapping; this file only handles the arrows and the edge fades.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCollection } from '../../lib/useCollection'
import { useAuth } from '../../lib/useAuth'
import { imageSource, categoryLabel, formatDate } from '../../lib/newsFormat'
import { NOTIFICATION_IMAGE_SIZE } from '../../data/notifications'
import './NewsCarousel.css'

// How far one arrow press moves the track — one card plus its gap.
const STEP_RATIO = 1.05

function StoryCard({ item, onOpen }) {
  const image = imageSource(item.images?.[0])

  return (
    <button
      type="button"
      className="news-carousel__card clickable"
      onClick={() => onOpen(item)}
      aria-label={`Read: ${item.title}`}
    >
      <span className="news-carousel__media">
        {image ? (
          <img src={image} alt={item.images?.[0]?.alt || item.title} loading="lazy" />
        ) : (
          <span className="news-carousel__placeholder" aria-hidden="true">
            🎬
          </span>
        )}
        <span className="news-carousel__category">
          {categoryLabel(item.category)}
        </span>
      </span>

      <span className="news-carousel__body">
        {item.date && (
          <time className="news-carousel__date" dateTime={item.date}>
            {formatDate(item.date)}
          </time>
        )}
        <span className="news-carousel__title">{item.title}</span>
        {item.description && (
          <span className="news-carousel__description">{item.description}</span>
        )}
      </span>
    </button>
  )
}

export function NewsCarousel() {
  const { items, loading } = useCollection('newsEvents')
  const { user, loading: authLoading } = useAuth()
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const trackRef = useRef(null)
  const navigate = useNavigate()

  const stories = (items || []).slice(0, 12)

  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setAtStart(track.scrollLeft <= 4)
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4)
  }, [])

  useEffect(() => {
    if (!stories.length) return undefined
    updateEdges()
    const track = trackRef.current
    if (!track) return undefined
    track.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges)
    return () => {
      track.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
    }
  }, [stories.length, updateEdges])

  const nudge = (direction) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector('.news-carousel__card')
    const step = (card?.offsetWidth || NOTIFICATION_IMAGE_SIZE * 2.4) * STEP_RATIO
    track.scrollBy({ left: step * direction, behavior: 'smooth' })
  }

  // Deep link, so the article opens in its own URL and can be shared or
  // bookmarked — and so a notification can point straight at it.
  const openStory = (item) => {
    if (!item?.id) return
    navigate(`/news-events?article=${encodeURIComponent(item.id)}`)
  }

  // Every hook above this line. Members only — and hidden while the session is
  // still resolving, so the strip never appears and then vanishes for a
  // returning member.
  if (authLoading || !user) return null
  if (loading || stories.length === 0) return null

  return (
    <motion.section
      className="news-carousel"
      aria-label="Latest news and events"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container">
        <div className="news-carousel__head">
          <div>
            <span className="news-carousel__eyebrow">Members</span>
            <h2 className="news-carousel__title">Latest News &amp; Events</h2>
          </div>

          <div className="news-carousel__controls">
            <button
              type="button"
              className="news-carousel__arrow clickable"
              onClick={() => nudge(-1)}
              disabled={atStart}
              aria-label="Previous stories"
            >
              ‹
            </button>
            <button
              type="button"
              className="news-carousel__arrow clickable"
              onClick={() => nudge(1)}
              disabled={atEnd}
              aria-label="Next stories"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div
        className="news-carousel__track"
        ref={trackRef}
        // A scroll region with a label is announced as such, and keyboard
        // users can still reach the cards because each one is a real button.
        role="region"
        aria-label="News and events stories, scrollable"
        tabIndex={0}
      >
        {stories.map(item => (
          <StoryCard key={item.id} item={item} onOpen={openStory} />
        ))}
      </div>
    </motion.section>
  )
}

export default NewsCarousel

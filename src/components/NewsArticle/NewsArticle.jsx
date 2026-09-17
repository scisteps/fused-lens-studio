import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSiteContent } from '../../lib/useSiteContent'
import { Lightbox } from '../Lightbox'
import { SocialLinks } from '../Social'
import { imageSource, categoryLabel, formatDate, toParagraphs } from '../../lib/newsFormat'
import './NewsArticle.css'

// The foot of every article: how to follow the Guild, and the way on to the next
// piece. Location and email now live in the site footer, which renders below.
function ArticleFooter({ socials, next, onNext, onBack }) {
  const hasSocials = Object.values(socials || {}).some(Boolean)

  return (
    <footer className="news-article__footer">
      {hasSocials && (
        <div className="news-article__follow">
          <h2 className="news-article__follow-title">Follow Us</h2>
          <SocialLinks social={socials} />
        </div>
      )}

      {next && (
        <button type="button" className="news-article__next" onClick={onNext}>
          <span className="news-article__next-eyebrow">Read next</span>
          <span className="news-article__next-title">{next.title}</span>
          <span className="news-article__next-meta">
            {categoryLabel(next.category)}
            {next.date ? ` · ${formatDate(next.date)}` : ''}
          </span>
          <span className="news-article__next-arrow" aria-hidden="true">→</span>
        </button>
      )}

      <button type="button" className="news-article__back" onClick={onBack}>
        ← All news &amp; events
      </button>
    </footer>
  )
}


export function NewsArticle({ item, next, prev, onNext, onPrev, onBack, index = 0, total = 1 }) {
  const { content } = useSiteContent()
  const [enlargedImage, setEnlargedImage] = useState(null)

  const gallery = useMemo(() => (item?.images || []).map((image, i) => ({
    ...image,
    id: `${item.id}-photo-${i}`,
    srcLarge: imageSource(image)
  })), [item])

  const paragraphs = useMemo(() => toParagraphs(item?.body), [item])
  const lead = useMemo(() => toParagraphs(item?.description), [item])

  const heroImage = imageSource(item?.images?.[0])
  const restOfGallery = gallery.filter(image => image.srcLarge && image.srcLarge !== heroImage)

  // Start every article at the top rather than wherever the reader stopped.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [item?.id])

  useEffect(() => {
    const onKeyDown = event => {
      if (enlargedImage) return
      if (event.key === 'ArrowRight') onNext?.()
      if (event.key === 'ArrowLeft') onPrev?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enlargedImage, onNext, onPrev])

  if (!item) return null

  return (
    <article className="news-article">
      <header className="news-article__masthead">
        <div className="container">
          <nav className="news-article__crumbs" aria-label="Breadcrumb">
            <button type="button" className="news-article__crumb-link" onClick={onBack}>
              News &amp; Events
            </button>
            <span aria-hidden="true">/</span>
            <span>{categoryLabel(item.category)}</span>
          </nav>
          <p className="news-article__kicker">
            {categoryLabel(item.category)}
            {item.location ? ` · ${item.location}` : ''}
          </p>
          <h1 className="news-article__headline">{item.title}</h1>
          {lead.length > 0 && <p className="news-article__lede">{lead[0]}</p>}
          <div className="news-article__byline">
            <span>Animation Guild Uganda</span>
            {item.date && <><span className="news-article__dot" aria-hidden="true" />{formatDate(item.date)}</>}
            <span className="news-article__counter">{index + 1} of {total}</span>
          </div>
        </div>
      </header>

      {heroImage && (
        <motion.figure
          className="news-article__hero"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src={heroImage} alt={item.images?.[0]?.alt || item.title} />
        </motion.figure>
      )}

      <div className="container">
        <div className="news-article__body">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
          ) : (
            <p className="news-article__body-empty">
              The full write-up for this entry has not been published yet. Please check back soon.
            </p>
          )}
        </div>

        {restOfGallery.length > 0 && (
          <section className="news-article__gallery" aria-label="Photos from this entry">
            <h2 className="news-article__section-title">More photos</h2>
            <div className="news-article__gallery-grid">
              {restOfGallery.map((image, i) => (
                <motion.button
                  key={image.id}
                  type="button"
                  className="news-article__gallery-item clickable"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  onClick={() => setEnlargedImage(image)}
                >
                  <img src={image.srcLarge} alt={image.alt || item.title} loading="lazy" />
                </motion.button>
              ))}
            </div>
          </section>
        )}

        <ArticleFooter
          socials={content?.studioInfo?.social}
          next={next}
          onNext={onNext}
          onBack={onBack}
        />
      </div>

      <Lightbox
        image={enlargedImage}
        images={restOfGallery}
        onClose={() => setEnlargedImage(null)}
        onNavigate={setEnlargedImage}
      />
    </article>
  )
}
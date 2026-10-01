import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { heroSlides, resolveImage } from '../../data/images'
import { useSiteContent } from '../../lib/useSiteContent'
import { useAuth, useUserProfile } from '../../lib/useAuth'
import { logOut } from '../../lib/auth'
import { categoryLabel } from '../../data/signup'
import { portfolioEntries } from '../../data/portfolio'
import './Hero.css'
import final from '../../jsons/final6.json'
import { Player } from '@lottiefiles/react-lottie-player'

// ─── Intro timing (seconds) ────────────────────────────────────────────
const TIMING = {
  introHold: 2,       // how long the lottie plays alone on white bg
  slidesFade: 1.2,    // background slideshow fade-in duration
  titleGap: 0.3,      // pause after slides before the title starts fading in
  titleFade: 0.8,     // title fade-in duration
  staggerGap: 0.5,    // pause between each element after the title
  elementFade: 0.8,   // fade-in duration for description/actions/indicators/etc.
}

export function Hero() {
  const navigate = useNavigate()
  const { content } = useSiteContent()
  const { user, loading: authLoading } = useAuth()
  const { profile } = useUserProfile(user?.uid)
  const studioInfo = content.studioInfo
  const slides = useMemo(() => (
    (content.heroSlides?.length ? content.heroSlides : heroSlides).map(slide => ({
      ...slide,
      image: resolveImage(slide.imageId) || slide.image
    }))
  ), [content.heroSlides])

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const imageRefs = useRef([])

  // GSAP-controlled intro reveal refs
  const slidesWrapRef = useRef(null)
  const titleWrapRef = useRef(null)
  const descriptionRef = useRef(null)
  const actionsRef = useRef(null)
  const indicatorsRef = useRef(null)
  const scrollRef = useRef(null)
  const cornerTlRef = useRef(null)
  const cornerBrRef = useRef(null)

  // Ken Burns effect on images
  useEffect(() => {
    if (!isLoaded) return
    const currentImage = imageRefs.current[currentSlide]
    if (currentImage) {
      gsap.set(currentImage, { scale: 1, x: 0, y: 0 })
      gsap.to(currentImage, {
        scale: 1.15,
        x: currentSlide % 2 === 0 ? '3%' : '-3%',
        y: currentSlide % 2 === 0 ? '-2%' : '2%',
        duration: 8,
        ease: 'none'
      })
    }
  }, [currentSlide, isLoaded])

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [slides.length])

  // NOTE: the hero deliberately applies NO scroll transform.
  //
  // It used to parallax the whole <section> with `translateY(scrollY * 0.4)`.
  // A transformed ancestor also becomes the containing block for
  // fixed-position descendants, which is why the Login / Sign Up row used to
  // be rendered OUTSIDE the section with `position: fixed` — and that in turn
  // pinned those buttons to the viewport for the entire page, so they floated
  // over About, Services and everything below.
  //
  // Both halves of that workaround are now gone: the row lives back inside the
  // hero as .hero__actions-hero (`position: absolute`), so it scrolls away with
  // the hero instead of hanging over the whole site.

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      const promises = slides.map((slide) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.src = slide.image
          img.onload = resolve
          img.onerror = resolve
        })
      })
      await Promise.all(promises)
      setIsLoaded(true)
    }
    loadImages()
  }, [slides])

  // GSAP intro reveal — white bg + lottie hold, then everything fades in
  useEffect(() => {
    if (!isLoaded) return

    // Grab refs defensively — a null ref never kills the whole timeline.
    const slides = slidesWrapRef.current
    const title = titleWrapRef.current
    const desc = descriptionRef.current
    const actions = actionsRef.current
    const indicators = indicatorsRef.current
    const scroll = scrollRef.current
    const cornerTl = cornerTlRef.current
    const cornerBr = cornerBrRef.current

    const all = [slides, title, desc, actions, indicators, scroll, cornerTl, cornerBr]
      .filter(Boolean)

    if (!all.length) return

    gsap.set(all, { opacity: 0 })
    if (desc) gsap.set(desc, { y: 20 })
    if (actions) gsap.set(actions, { y: 20 })

    const tl = gsap.timeline({ delay: TIMING.introHold })

    if (slides) {
      tl.to(slides, { opacity: 1, duration: TIMING.slidesFade, ease: 'power2.out' })
    }
    if (title) {
      tl.to(title, { opacity: 1, duration: TIMING.titleFade, ease: 'power3.out' },
        `+=${TIMING.titleGap}`)
    }
    if (desc) {
      tl.to(desc, { opacity: 1, y: 0, duration: TIMING.elementFade, ease: 'power3.out' },
        `+=${TIMING.staggerGap}`)
    }
    if (actions) {
      tl.to(actions, { opacity: 1, y: 0, duration: TIMING.elementFade, ease: 'power3.out' },
        `+=${TIMING.staggerGap}`)
    }
    if (indicators) {
      tl.to(indicators, { opacity: 1, duration: TIMING.elementFade, ease: 'power2.out' },
        `+=${TIMING.staggerGap}`)
    }
    if (scroll) {
      tl.to(scroll, { opacity: 1, duration: TIMING.elementFade, ease: 'power2.out' }, '<')
    }
    if (cornerTl || cornerBr) {
      tl.to([cornerTl, cornerBr].filter(Boolean), {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'power2.out',
        stagger: 0.2,
      }, `+=${TIMING.staggerGap}`)
    }

    return () => tl.kill()
  }, [isLoaded])

  // Close the profile panel if the visitor signs out from anywhere.
  useEffect(() => {
    if (!user) setProfileOpen(false)
  }, [user])

  // Escape closes the profile panel, like the site's other overlays.
  useEffect(() => {
    if (!profileOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [profileOpen])

  if (content.visibility?.hero === false) return null

  const scrollToAbout = () => {
    const about = document.getElementById('about')
    if (about) about.scrollIntoView({ behavior: 'smooth' })
  }

  // Signed-in actions reuse the same doors signed-out visitors get, minus the
  // sign-in ones: Contact and News instead of Login / Sign Up.
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleMemberSignOut = async () => {
    setProfileOpen(false)
    await logOut()
  }

  return (
    <>
      <section id="home" className="hero">
      {/* Background Slides */}
      <div className="hero__slides" ref={slidesWrapRef} style={{ opacity: 0 }}>
        <AnimatePresence mode="wait">
          {slides.map((slide, index) => (
            index === currentSlide && (
              <motion.div
                key={slide.id}
                className="hero__slide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <img
                  ref={(el) => (imageRefs.current[index] = el)}
                  src={slide.image}
                  alt={`${slide.title} ${slide.subtitle}`}
                  className="hero__image"
                />
              </motion.div>
            )
          ))}
        </AnimatePresence>

        <div className="hero__overlay hero__overlay--gradient" />
        <div className="hero__overlay hero__overlay--vignette" />
      </div>

      {/* Content */}
      <div className="hero__content">
        <div className="hero__text">
          {/* Lottie — sits directly above the tagline/description block */}
          <div className="hero__lottie">
            <Player
              autoplay
              keepLastFrame
              loop={false}
              src={final}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          <div className="hero__title-wrapper" ref={titleWrapRef} style={{ opacity: 0 }}>
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentSlide}
                className="hero__title"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Both lines are white. The second used to pick up a palette colour per
                    slide (orange / green / white), which made the tagline fight
                    the background photo and changed colour mid-rotation. */}
                <span className="hero__title-line">{slides[currentSlide].title}</span>
                <span className="hero__title-line hero__title-line--accent">
                  {slides[currentSlide].subtitle}
                </span>
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="hero__indicators" ref={indicatorsRef} style={{ opacity: 0 }}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`hero__indicator ${index === currentSlide ? 'hero__indicator--active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              <span className="hero__indicator-fill" />
            </button>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="hero__scroll" ref={scrollRef} style={{ opacity: 0 }} onClick={scrollToAbout}>
          {/* <span className="hero__scroll-text">Scroll</span>
          <motion.div
            className="hero__scroll-line"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          /> */}
        </div>
      </div>

{/* Login / Sign Up — belongs to the HERO, so it scrolls away with it.
          This used to be `position: fixed` and rendered outside the <section>,
          which pinned it to the bottom-left of the viewport for the whole page:
          the buttons then floated over About, Services and every section below.
          `position: absolute` (see .hero__actions-hero in Hero.css) anchors it
          to .hero instead — same place on screen, but it now leaves with the
          hero as soon as the visitor scrolls. */}
      <div className="hero__actions-hero">
        <div className="hero__actions" ref={actionsRef} style={{ opacity: 0 }}>
          {/* Signed out — the invitation to join. */}
          {!authLoading && !user && (
            <>
              <motion.a
                href="/login"
                className="hero__btn hero__btn--primary"
                onClick={(event) => {
                  event.preventDefault()
                  navigate('/login')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Login</span>
              </motion.a>
              <motion.a
                href="/signup"
                className="hero__btn hero__btn--outline"
                onClick={(event) => {
                  event.preventDefault()
                  navigate('/signup')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Sign Up</span>
              </motion.a>
              <motion.a
                href="#contact"
                className="hero__btn hero__btn--outline"
                onClick={(event) => {
                  event.preventDefault()
                  scrollToContact()
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get in Touch
              </motion.a>
            </>
          )}

          {/* Signed in — their membership category (opens the profile) plus
              the two doors they actually need: Contact and News. */}
          {!authLoading && user && (
            <>
              <motion.button
                type="button"
                className="hero__btn hero__btn--category"
                onClick={() => setProfileOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="hero__category-dot" aria-hidden="true" />
                <span>{categoryLabel(profile?.category) || 'Member'}</span>
              </motion.button>
              <motion.a
                href="#contact"
                className="hero__btn hero__btn--outline"
                onClick={(event) => {
                  event.preventDefault()
                  scrollToContact()
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Contact Us
              </motion.a>
              <motion.a
                href="/news-events"
                className="hero__btn hero__btn--outline"
                onClick={(event) => {
                  event.preventDefault()
                  navigate('/news-events')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                News
              </motion.a>
            </>
          )}
        </div>
      </div>
      {/* Decorative Elements */}
      <div className="hero__decorative">
        <div className="hero__corner hero__corner--tl" ref={cornerTlRef} style={{ opacity: 0, transform: 'scale(0)' }} />
        <div className="hero__corner hero__corner--br" ref={cornerBrRef} style={{ opacity: 0, transform: 'scale(0)' }} />
      </div>
      </section>

      {/* Member profile — lives OUTSIDE the parallax <section> so its
          position: fixed is not trapped by the section's scroll transform. */}
      <AnimatePresence>
        {profileOpen && user && (
          <motion.div
            className="hero__profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setProfileOpen(false)}
          >
            <motion.div
              className="hero__profile"
              role="dialog"
              aria-modal="true"
              aria-label="Your member profile"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <span className="hero__profile-eyebrow">Members Area</span>
              <h2 className="hero__profile-name">
                {profile?.name || user.displayName || 'Member'}
              </h2>
              <span className="hero__profile-category">
                {categoryLabel(profile?.category) || 'Member'}
              </span>

              <dl className="hero__profile-list">
                <div className="hero__profile-row">
                  <dt>Email</dt>
                  <dd>{profile?.email || user.email}</dd>
                </div>
                <div className="hero__profile-row">
                  <dt>Phone</dt>
                  <dd>{profile?.phone || '—'}</dd>
                </div>
                <div className="hero__profile-row">
                  <dt>Category</dt>
                  <dd>{categoryLabel(profile?.category) || '—'}</dd>
                </div>
                {/* Students name an institution, everyone else a profession —
                    the same branch the sign-up form and Login screen use. */}
                {profile?.isStudent ? (
                  <div className="hero__profile-row">
                    <dt>Institution</dt>
                    <dd>{profile?.school || '—'}</dd>
                  </div>
                ) : (
                  <div className="hero__profile-row">
                    <dt>Profession</dt>
                    <dd>{profile?.profession || '—'}</dd>
                  </div>
                )}
                <div className="hero__profile-row">
                  <dt>Status</dt>
                  <dd className="hero__profile-status">{profile?.status || 'pending'}</dd>
                </div>
                {/* The portfolio links shared at sign-up — hidden entirely when
                    there are none, so the pop-over never grows an empty row. */}
                {portfolioEntries(profile?.portfolio).length > 0 && (
                  <div className="hero__profile-row">
                    <dt>Portfolio</dt>
                    <dd className="hero__profile-links">
                      {portfolioEntries(profile?.portfolio).map((entry) => (
                        <a
                          key={entry.id}
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {entry.label}
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="hero__profile-actions">
                <button
                  type="button"
                  className="hero__profile-exit"
                  onClick={handleMemberSignOut}
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  className="hero__profile-close"
                  onClick={() => setProfileOpen(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
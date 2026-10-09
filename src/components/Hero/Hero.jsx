import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { heroSlides, resolveImage } from '../../data/images'
import { useSiteContent } from '../../lib/useSiteContent'
import { useAuth, useUserProfile } from '../../lib/useAuth'
import { categoryLabel } from '../../data/signup'
import { MemberProfilePanel } from '../MemberProfile'
import { themeIntro } from '../../data/themes'
import { useTheme } from '../../lib/useSiteTheme'
import './Hero.css'
import { Player } from '@lottiefiles/react-lottie-player'

// --- Intro timing (seconds) -------------------------------------------
const TIMING = {
  introHold: 3.8,       // how long the lottie plays alone on white bg
  slidesFade: 1.2,      // background slideshow fade-in duration
  titleGap: 0.3,        // pause after slides before the title starts fading in
  titleFade: 0.6,       // title fade-in duration
  staggerGap: 0.5,      // pause between each element after the title
  elementFade: 0.6,     // fade-in duration for description/actions/indicators/etc.
}

export function Hero() {
  const navigate = useNavigate()
  const { content } = useSiteContent()
  const { user, loading: authLoading } = useAuth()
  const { profile } = useUserProfile(user?.uid)
  // The palette decides which crane animation plays in the hero. Read from
  // context so this does not open a second Firestore listener on the same
  // document that useSiteTheme() already watches.
  const { themeId, themeLoaded } = useTheme()
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
  // A transformed ancestor becomes the containing block for fixed-position
  // descendants, which is why the old Login / Sign Up row had to live outside
  // the section. Everything now lives in one flow column inside the hero.

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

    const slidesEl = slidesWrapRef.current
    const title = titleWrapRef.current
    const actions = actionsRef.current
    const indicators = indicatorsRef.current
    const scroll = scrollRef.current
    const cornerTl = cornerTlRef.current
    const cornerBr = cornerBrRef.current

    const all = [slidesEl, title, actions, indicators, scroll, cornerTl, cornerBr]
      .filter(Boolean)

    if (!all.length) return

    gsap.set(all, { opacity: 0 })
    if (actions) gsap.set(actions, { y: 20 })

    const tl = gsap.timeline({ delay: TIMING.introHold })

    if (slidesEl) {
      tl.to(slidesEl, { opacity: 1, duration: TIMING.slidesFade, ease: 'power2.out' })
    }
    if (title) {
      tl.to(title, { opacity: 1, duration: TIMING.titleFade, ease: 'power3.out' },
        `+=${TIMING.titleGap}`)
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

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
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

        {/* Content — one bottom-anchored flex column:
            crane → tagline → buttons → indicators */}
        <div className="hero__content">
          <div className="hero__text">
            {/* The crane. Which FILE it is depends on the admin's palette
                (orange / grey / gold) — see themeIntro() in data/themes.js.
                It sits directly above the tagline; the 100px air between
                them comes from .hero__lottie's margin-bottom. */}
            <div className="hero__lottie">
              {themeLoaded && (
                <Player
                  key={themeId}
                  autoplay
                  keepLastFrame
                  loop={false}
                  src={themeIntro(themeId)}
                  className="hero__lottie-player"
                />
              )}
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
                  <span className="hero__title-line">{slides[currentSlide].title}</span>
                  <span className="hero__title-line hero__title-line--accent">
                    {slides[currentSlide].subtitle}
                  </span>
                </motion.h2>
              </AnimatePresence>
            </div>
          </div>

          {/* Login / Sign Up / Contact — LAST item of the content stack so
              the column's gap holds it below the wording. Forced to a single
              horizontal row on every device; wraps only if the viewport is
              genuinely too narrow. */}
          <div className="hero__actions-hero">
            <div className="hero__actions" ref={actionsRef} style={{ opacity: 0 }}>
              {!authLoading && !user && (
                <>
                  <motion.a
                    href="/login"
                    className="hero__btn hero__btn--primary"
                    onClick={(event) => { event.preventDefault(); navigate('/login') }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Login</span>
                  </motion.a>
                  <motion.a
                    href="/signup"
                    className="hero__btn hero__btn--outline"
                    onClick={(event) => { event.preventDefault(); navigate('/signup') }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Sign Up</span>
                  </motion.a>
                  <motion.a
                    href="#contact"
                    className="hero__btn hero__btn--outline"
                    onClick={(event) => { event.preventDefault(); scrollToContact() }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get in Touch
                  </motion.a>
                </>
              )}

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
                    onClick={(event) => { event.preventDefault(); scrollToContact() }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Contact Us
                  </motion.a>
                  <motion.a
                    href="/news-events"
                    className="hero__btn hero__btn--outline"
                    onClick={(event) => { event.preventDefault(); navigate('/news-events') }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    News
                  </motion.a>
                </>
              )}
            </div>
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

        {/* Scroll Indicator (currently invisible — kept for future use) */}
        <div className="hero__scroll" ref={scrollRef} style={{ opacity: 0 }} onClick={scrollToAbout} />

        {/* Decorative Corners */}
        <div className="hero__decorative">
          <div className="hero__corner hero__corner--tl" ref={cornerTlRef} style={{ opacity: 0, transform: 'scale(0)' }} />
          <div className="hero__corner hero__corner--br" ref={cornerBrRef} style={{ opacity: 0, transform: 'scale(0)' }} />
        </div>
      </section>

      {/* Member profile — fixed overlay, so rendered OUTSIDE the hero section. */}
      <AnimatePresence>
        {profileOpen && user && (
          <MemberProfilePanel
            isOpen
            onClose={() => setProfileOpen(false)}
            user={user}
            profile={profile}
          />
        )}
      </AnimatePresence>
    </>
  )
}
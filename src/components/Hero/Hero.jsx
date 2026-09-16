import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { heroSlides, resolveImage } from '../../data/images'
import { useSiteContent } from '../../lib/useSiteContent'
import './Hero.css'
import final from '../../jsons/final5.json'
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
  const { content } = useSiteContent()
  const studioInfo = content.studioInfo
  const slides = useMemo(() => (
    (content.heroSlides?.length ? content.heroSlides : heroSlides).map(slide => ({
      ...slide,
      image: resolveImage(slide.imageId) || slide.image
    }))
  ), [content.heroSlides])

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const heroRef = useRef(null)
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

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY
        heroRef.current.style.transform = `translateY(${scrollY * 0.4}px)`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  if (content.visibility?.hero === false) return null

  const scrollToAbout = () => {
    const about = document.getElementById('about')
    if (about) about.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="home" className="hero" ref={heroRef}>
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
                <span className="hero__title-line">{slides[currentSlide].title}</span>
                <span className="hero__title-line hero__title-line--accent">
                  {slides[currentSlide].subtitle}
                </span>
              </motion.h2>
            </AnimatePresence>
          </div>

      

          <div className="hero__actions" ref={actionsRef} style={{ opacity: 0 }}>
            <motion.button
              className="hero__btn hero__btn--primary"
              onClick={scrollToAbout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>About</span>
            </motion.button>
            <motion.a
              href="#contact"
              className="hero__btn hero__btn--outline"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get in Touch
            </motion.a>
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

      {/* Decorative Elements */}
      <div className="hero__decorative">
        <div className="hero__corner hero__corner--tl" ref={cornerTlRef} style={{ opacity: 0, transform: 'scale(0)' }} />
        <div className="hero__corner hero__corner--br" ref={cornerBrRef} style={{ opacity: 0, transform: 'scale(0)' }} />
      </div>
    </section>
  )
}
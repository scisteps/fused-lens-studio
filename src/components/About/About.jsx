import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { aboutImage, resolveImage } from '../../data/images'
import { useSiteContent } from '../../lib/useSiteContent'
import { AnimatedCounter } from '../Effects'
import './About.css'

gsap.registerPlugin(ScrollTrigger)

// Stat color cycling — black → orange → green → black…
const STAT_VARIANTS = ['black', 'orange', 'green', 'black']

export function About() {
  const { content } = useSiteContent()
  const { studioInfo, stats, about } = content || {}

  const selectedImage = resolveImage(content.aboutImageId) || aboutImage
  const sectionRef = useRef(null)
  const imageRef = useRef(null)

  // "Read more" toggle
  const [isExpanded, setIsExpanded] = useState(false)

  // Parallax effect on image
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(imageRef.current, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  }

  if (content.visibility?.about === false) return null

  const storyText =
    about?.story ||
    `At ${studioInfo?.name || 'Animation Guild Uganda'}, we bring together storytellers, animators, and artists from across the Pearl of Africa. Our mission is to build a thriving creative ecosystem where African animation can be developed, distributed, and celebrated on a global stage.

We provide training, mentorship, collaboration opportunities, and industry connections that help animators turn their passion into sustainable careers. From short films to series, from concept to screen — we support every stage of the animation journey.`

  return (
    <section id="about" className="about section" ref={sectionRef}>
      <div className="container">
        <h2 className="about__section-title">ABOUT US</h2>

        <div className="about__layout">
          {/* Image Side */}
          <div className="about__image-container">
            <motion.div
              className="about__image-wrapper"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="about__image-inner" ref={imageRef}>
                <img
                  src={selectedImage}
                  alt="Animation studio"
                  className="about__image"
                />
              </div>

              {/* Floating badge */}
              <motion.div
                className="about__badge"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <span className="about__badge-number">200+</span>
                <span className="about__badge-text">Animators</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Content Side */}
          <motion.div
            className="about__content"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {/* <motion.span className="section-label" variants={itemVariants}>
              About Us
            </motion.span> */}

            <motion.h2 className="about__title" variants={itemVariants}>
              {about?.title || 'We are the Animation Guild Uganda'}
            </motion.h2>

            <motion.p className="about__lead" variants={itemVariants}>
              {about?.content ||
                `At ${studioInfo?.name || 'Animation Guild Uganda'}, we believe every animator should tell a story that resonates deeply with those who view it.`}
            </motion.p>

            {/* Capped story text with Read More toggle */}
            <motion.div variants={itemVariants}>
              <div
                className={`about__story ${isExpanded ? 'about__story--expanded' : ''}`}
              >
                {storyText.split('\n\n').map((para, i) => (
                  <p key={i} className="about__text">
                    {para}
                  </p>
                ))}
              </div>

              <button
                type="button"
                className="about__readmore"
                onClick={() => setIsExpanded((v) => !v)}
                aria-expanded={isExpanded}
              >
                <span>{isExpanded ? 'Read Less' : 'Read More'}</span>
                <span
                  className={`about__readmore-icon ${isExpanded ? 'is-open' : ''}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
            </motion.div>

            {/* Animated Stats — each one gets its own color */}
            <motion.div className="about__stats" variants={itemVariants}>
              {(stats || []).map((stat, index) => {
                const variant = STAT_VARIANTS[index % STAT_VARIANTS.length]
                return (
                  <div
                    key={index}
                    className={`about__stat about__stat--${variant}`}
                  >
                    <span className="about__stat-number">
                      <AnimatedCounter
                        value={stat.value}
                        suffix={stat.suffix}
                        duration={2.5}
                      />
                    </span>
                    <span className="about__stat-label">{stat.label}</span>
                  </div>
                )
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
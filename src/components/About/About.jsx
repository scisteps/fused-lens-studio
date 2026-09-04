import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { aboutImage } from '../../data/images'
import { studioInfo, stats } from '../../data/content'
import { AnimatedCounter } from '../Effects'
import './About.css'

gsap.registerPlugin(ScrollTrigger)

export function About() {
  const [about, setAbout] = useState(null)
  const sectionRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    // Fetch about content
    fetch('/api/content/about')
      .then(res => res.json())
      .then(data => setAbout(data))
      .catch(err => console.error('Failed to load about:', err))
  }, [])

  // Parallax effect on image
  useEffect(() => {
    const image = imageRef.current
    if (!image) return

    gsap.to(image, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    })

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
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

  return (
    <section id="about" className="about section" ref={sectionRef}>
      <div className="container">
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
                  src={aboutImage}
                  alt="Photography studio"
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
                <span className="about__badge-number">{new Date().getFullYear() - studioInfo.founded}+</span>
                <span className="about__badge-text">Years of Excellence</span>
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
            <motion.span className="section-label" variants={itemVariants}>
              About Us
            </motion.span>
            
            <motion.h2 className="about__title" variants={itemVariants}>
              {about?.title || 'We are the Animation Guild Uganda'}
            </motion.h2>
            
            <motion.p className="about__lead" variants={itemVariants}>
              {about?.content || `At ${studioInfo.name}, we believe every animator should tell a story that resonates deeply with those who view it.`}
            </motion.p>
            
            <motion.p className="about__text" variants={itemVariants}>
              {about?.story || 'Loading...'}
            </motion.p>

            {/* Animated Stats */}
            <motion.div className="about__stats" variants={itemVariants}>
              {stats.map((stat, index) => (
                <div key={index} className="about__stat">
                  <span className="about__stat-number">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2.5} />
                  </span>
                  <span className="about__stat-label">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSiteContent } from '../../lib/useSiteContent'
import './RoadMap.css'

gsap.registerPlugin(ScrollTrigger)

// Brand gradient endpoints — keep in sync with --color-accent / --color-secondary
const ORANGE = { r: 253, g: 101, b: 0 }
const GREEN = { r: 12, g: 121, b: 35 }

function stageColor(index, total) {
  const t = total > 1 ? index / (total - 1) : 0
  const r = Math.round(ORANGE.r + (GREEN.r - ORANGE.r) * t)
  const g = Math.round(ORANGE.g + (GREEN.g - ORANGE.g) * t)
  const b = Math.round(ORANGE.b + (GREEN.b - ORANGE.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

export function RoadMap() {
  const { content } = useSiteContent()
  const { timeline } = content
  const sectionRef = useRef(null)
  const timelineRef = useRef(null)
  const progressRef = useRef(null)
  const milestoneRefs = useRef([])

  useEffect(() => {
    const milestones = milestoneRefs.current.filter(Boolean)

    milestones.forEach((milestone, index) => {
      gsap.fromTo(milestone,
        { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: milestone,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      )
    })

    // Connector fill — grows top to bottom as the section scrolls through view
    if (progressRef.current && timelineRef.current) {
      gsap.fromTo(progressRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top center',
            end: 'bottom center',
            scrub: 0.6
          }
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  if (content.visibility?.roadmap === false) return null

  return (
    <section id="RoadMap" className="roadmap section section--dark" ref={sectionRef}>
      <div className="container">
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="section-label">Our Journey</span>
          <h2 className="section-title">Our RoadMap</h2>
          <p className="section-subtitle">
            Tracking our growth and milestones in the animation industry.
          </p>
        </motion.div>

        <div className="roadmap__timeline" ref={timelineRef}>
          <div className="timeline__line" />
          <div className="timeline__progress" ref={progressRef} />

          {timeline.map((milestone, index) => {
            const color = stageColor(index, timeline.length)
            return (
              <div
                key={milestone.id || index}
                ref={(el) => (milestoneRefs.current[index] = el)}
                className={`timeline__item ${index % 2 === 0 ? 'timeline__item--left' : 'timeline__item--right'}`}
                style={{ '--stage-color': color }}
              >
                <div className="timeline__content">
                  <h4 className="timeline__heading">{milestone.title}</h4>
                  <p className="timeline__description">{milestone.description}</p>
                </div>
                <div className="timeline__dot">
                  <motion.div
                    className="timeline__dot-inner"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { timeline } from '../../data/content'
import './RoadMap.css'

gsap.registerPlugin(ScrollTrigger)

export function RoadMap() {
  const sectionRef = useRef(null)
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

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  return (
    <section id="RoadMap" className="RoadMap section" ref={sectionRef}>
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

        <div className="roadmap__timeline">
          <div className="timeline__line" />
          
          {timeline.map((milestone, index) => (
            <div
              key={milestone.id || index}
              ref={(el) => (milestoneRefs.current[index] = el)}
              className={`timeline__item ${index % 2 === 0 ? 'timeline__item--left' : 'timeline__item--right'}`}
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
          ))}
        </div>
      </div>
    </section>
  )
}
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
// import { Player } from '@lottiefiles/react-lottie-player';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteContent } from '../../lib/useSiteContent';
import { serviceAnimations } from '../../data/animations';
import './Services.css';

gsap.registerPlugin(ScrollTrigger)

// Icon resolver — Lottie via @lottiefiles/react-lottie-player, keyed by service id
const ServiceIcon = ({ id, animRef }) => {
  const animationData = serviceAnimations[id]

  if (!animationData) return null

  return (
    <div className="service-card__icon">
      {/* <Player
        ref={(el) => (animRef.current[id] = el)}
        autoplay
        loop
        src={animationData}
        style={{ width: '100%', height: '100%' }}
      /> */}
    </div>
  )
}

export function Services() {
  const { content } = useSiteContent()
  const { services } = content
  const [flippedCard, setFlippedCard] = useState(null)
  const sectionRef = useRef(null)
  const cardRefs = useRef([])
  const animRef = useRef({})   // one player ref per service id

  // Staggered card animation
  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean)

    gsap.fromTo(
      cards,
      { opacity: 0, y: 60, rotateX: -15 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      }
    )

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [])

  const handleCardClick = (id) => {
    setFlippedCard(flippedCard === id ? null : id)
  }

  if (content.visibility?.services === false) return null

  return (
    <section id="services" className="services section section--dark" ref={sectionRef}>
      <div className="container">
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="section-label">Services</span>
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle">
            A collective of animators from the pearl of Africa.
          </p>
        </motion.div>

        {/* Service Cards */}
        <div className="services__grid">
          {services.map((service, index) => (
            <div
              key={service.id}
              ref={(el) => (cardRefs.current[index] = el)}
              className={`service-card ${flippedCard === service.id ? 'service-card--flipped' : ''}`}
              onClick={() => handleCardClick(service.id)}
              style={{ perspective: '1000px' }}
            >
              <div className="service-card__inner">
                {/* Front */}
                <div className="service-card__front">
                  <ServiceIcon id={service.id} animRef={animRef} />
                  <h3 className="service-card__title">{service.title}</h3>
                  <p className="service-card__description">{service.description}</p>
                  <span className="service-card__hint">Click to learn more</span>
                </div>

                {/* Back */}
                <div className="service-card__back">
                  <h3 className="service-card__title">{service.title}</h3>
                  <ul className="service-card__features">
                    {service.features.map((feature, i) => (
                      <li key={i} className="service-card__feature">
                        <span className="service-card__feature-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
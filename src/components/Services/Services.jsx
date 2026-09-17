import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Player } from '@lottiefiles/react-lottie-player';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteContent } from '../../lib/useSiteContent';
import { resolveServiceAnimation } from '../../data/animations';
import { SERVICE_ACCENTS } from '../../data/content';
import { resolveImage } from '../../data/images';
import './Services.css';

gsap.registerPlugin(ScrollTrigger)

const ServiceIcon = ({ icon, cardKey, animRef }) => {
  const animationData = resolveServiceAnimation(icon)
  if (!animationData) return <div className="service-card__icon service-card__icon--empty" aria-hidden="true" />

  return (
    <div className="service-card__icon" key={icon}>
      <Player
        ref={(el) => { if (el) animRef.current[cardKey] = el }}
        autoplay
        loop
        src={animationData}
        style={{ width: '100%', height: '100%', borderRadius: '5px' }}
      />
    </div>
  )
}

export function Services() {
  const { content } = useSiteContent()
  const { services } = content
  const [flippedCard, setFlippedCard] = useState(null)
  const sectionRef = useRef(null)
  const cardRefs = useRef([])
  const animRef = useRef({})

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRefs.current.filter(Boolean),
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
    }, sectionRef)
    return () => ctx.revert()
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

        <div className="services__grid">
          {(services || []).map((service, index) => {
            const accent = SERVICE_ACCENTS.includes(service.accent) ? service.accent : SERVICE_ACCENTS[index % SERVICE_ACCENTS.length]
            const cardKey = service.id ?? index
            const backImage = resolveImage(service.imageId)
            const features = Array.isArray(service.features) ? service.features : []

            return (
              <div
                key={cardKey}
                ref={(el) => (cardRefs.current[index] = el)}
                className={[
                  'service-card',
                  `service-card--${accent}`,
                  flippedCard === service.id ? 'service-card--flipped' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleCardClick(service.id)}
                style={{ perspective: '1000px' }}
              >
                <div className="service-card__inner">

                  {/* ---------- FRONT: icon + title over image ---------- */}
                  <div className="service-card__front">
                    {backImage && (
                      <div className="service-card__front-bg" aria-hidden="true">
                        <img src={backImage} alt="" loading="lazy" />
                      </div>
                    )}
                    <div className="service-card__front-top">
                      <ServiceIcon icon={service.icon} cardKey={cardKey} animRef={animRef} />
                      <h3 className="service-card__title">{service.title}</h3>
                    </div>

                    <div className="service-card__cta-wrap">
                      <span className="service-card__cta-particles" aria-hidden="true">
                        <span /><span /><span /><span /><span /><span />
                      </span>

                      <button
                        type="button"
                        className="service-card__cta"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCardClick(service.id)
                        }}
                      >
                        <span className="service-card__cta-label">More Details</span>
                      </button>
                    </div>
                  </div>

                  {/* ---------- BACK: image + description + features ---------- */}
                  <div className="service-card__back">
                    {backImage && (
                      <div className="service-card__back-media">
                        <img src={backImage} alt={service.title} loading="lazy" />
                      </div>
                    )}
                    <h3 className="service-card__title service-card__title--back">{service.title}</h3>
                    {service.description && (
                      <p className="service-card__description service-card__description--back">{service.description}</p>
                    )}
                    {features.length > 0 && (
                      <ul className="service-card__features">
                        {features.map((feature, i) => (
                          <li key={i} className="service-card__feature">
                            <span className="service-card__feature-icon">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
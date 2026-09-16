import { useEffect, useMemo, useRef, useState } from 'react'
import './FloatingParticles.css'

const DEFAULT_COLORS = ['#ffffff', '#F15A39', '#0C7923']

export function FloatingParticles({
  originRef,                       // ref to the element to sprout from
  count = 20,
  colors = DEFAULT_COLORS,
  maxRadius = 320,                 // how far particles travel (px)
  minRadius = 80,
}) {
  const containerRef = useRef(null)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })

  // Measure origin (logo center) relative to the particle container
  useEffect(() => {
    const measure = () => {
      const el = originRef?.current
      const container = containerRef.current
      if (!el || !container) return

      const elRect = el.getBoundingClientRect()
      const cRect = container.getBoundingClientRect()

      setOrigin({
        x: elRect.left + elRect.width / 2 - cRect.left,
        y: elRect.top + elRect.height / 2 - cRect.top,
      })
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [originRef])

  // Precompute each particle's random trajectory
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2
      const distance = minRadius + Math.random() * (maxRadius - minRadius)
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance

      return {
        id: i,
        color: colors[i % colors.length],
        dx,
        dy,
        size: 3 + Math.random() * 4,           // 3–7px
        duration: 2.5 + Math.random() * 2.5,   // 2.5–5s
        delay: Math.random() * 1.2,            // 0–1.2s
        endOpacity: 0.15 + Math.random() * 0.35,
      }
    })
  }, [count, colors, minRadius, maxRadius])

  return (
    <div className="floating-particles" ref={containerRef} aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="floating-particles__particle"
          style={{
            left: `${origin.x}px`,
            top: `${origin.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--end-opacity': p.endOpacity,
          }}
        />
      ))}
    </div>
  )
}
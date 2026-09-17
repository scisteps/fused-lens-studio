import { useState, useEffect } from 'react'
import './BlurredBackdrop.css'

// Black page with a slow blurred photo slideshow behind the content — the same
// treatment as the Executive Committee page. Fixed so it acts as a backdrop
// while the page scrolls instead of stretching a huge blurred image.
export function BlurredBackdrop({ images = [], interval = 6000, strength = 'normal' }) {
  const [active, setActive] = useState(0)
  const slides = images.filter(Boolean)

  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => {
      setActive(current => (current + 1) % slides.length)
    }, interval)
    return () => clearInterval(id)
  }, [slides.length, interval])

  return (
    <div className={`blurred-backdrop blurred-backdrop--${strength}`} aria-hidden="true">
      {slides.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className={`blurred-backdrop__slide ${index === active ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="blurred-backdrop__overlay" />
    </div>
  )
}
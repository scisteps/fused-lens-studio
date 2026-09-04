import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollProgress } from '../../hooks'
import { studioInfo } from '../../data/content'
import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

export function Navigation() {
  const progress = useScrollProgress()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)

  // Navigation links for the main site
  const navLinks = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'about', label: 'About', path: '/#about' },
    { id: 'services', label: 'Services', path: '/#services' },
    { id: 'membership', label: 'Membership', path: '/#membership' },
    { id: 'contact', label: 'Contact', path: '/#contact' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      
      // Determine active section and theme based on scroll position
      const sections = navLinks.map(link => {
        if (link.path.includes('#')) {
          return document.getElementById(link.path.split('#')[1])
        }
        return null
      })
      const scrollPos = window.scrollY + window.innerHeight / 3
      
      sections.forEach((section, index) => {
        if (section) {
          const top = section.offsetTop
          const height = section.offsetHeight
          
          if (scrollPos >= top && scrollPos < top + height) {
            // Check if section has dark background
            const isDarkSection = section.classList.contains('section--dark') || 
                                  navLinks[index].id === 'home'
            setIsDark(isDarkSection)
          }
        }
      })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    setIsMobileMenuOpen(false)
  }

  const handleNavClick = (e, link) => {
    e.preventDefault()
    if (link.path === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (link.path.includes('#')) {
      const sectionId = link.path.split('#')[1]
      scrollToSection(sectionId)
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <motion.header
        className={`nav ${isScrolled ? 'nav--scrolled' : ''} ${isDark ? 'nav--dark' : 'nav--light'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="nav__container">
          <Link to="/" className="nav__logo clickable">
            <img 
              src="/camlogo.png" 
              alt={studioInfo.name}
              className="nav__logo-image"
            />
            <span className="nav__logo-text">{studioInfo.name}</span>
          </Link>

          <nav className="nav__links">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.id}
                href={link.path}
                className="nav__link clickable"
                onClick={(e) => handleNavClick(e, link)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ y: -2 }}
              >
                {link.label}
              </motion.a>
            ))}
            {/* News & Events link - separate page */}
            <motion.a
              href="/news-events"
              className="nav__link clickable"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = '/news-events'
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * navLinks.length, duration: 0.5 }}
              whileHover={{ y: -2 }}
            >
              News & Events
            </motion.a>
          </nav>

          {/* <motion.button
            className="nav__cta clickable"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('contact')}
          >
            Book Session
          </motion.button> */}

          <button
            className={`nav__mobile-toggle ${isMobileMenuOpen ? 'nav__mobile-toggle--open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Scroll Progress Bar */}
        <motion.div
          className="nav__progress"
          style={{ scaleX: progress }}
          initial={{ scaleX: 0 }}
        />
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            animate={{ opacity: 1, clipPath: 'circle(150% at calc(100% - 40px) 40px)' }}
            exit={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav className="mobile-menu__nav">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.id}
                  href={link.path}
                  className="mobile-menu__link"
                  onClick={(e) => handleNavClick(e, link)}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                >
                  <span className="mobile-menu__link-number">0{index + 1}</span>
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="/news-events"
                className="mobile-menu__link"
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = '/news-events'
                }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + navLinks.length * 0.05, duration: 0.5 }}
              >
                <span className="mobile-menu__link-number">0{navLinks.length + 1}</span>
                News & Events
              </motion.a>
            </nav>
            
            <motion.div
              className="mobile-menu__footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p>{studioInfo.email}</p>
              <p>{studioInfo.phone}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
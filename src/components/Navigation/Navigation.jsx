import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollProgress } from '../../hooks'
import { studioInfo } from '../../data/content'
import logoImage from '../../Images/agublack.png';


import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NotificationsBell } from '../Notifications'
import './Navigation.css'

export function Navigation() {
  const progress = useScrollProgress()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)

  // Navigation links for the main site. The header shows only these four:
  // the three main sections plus News, which lives on its own page.
  const navLinks = [
    { id: 'about', label: 'About', path: '/#about' },
    { id: 'services', label: 'Services', path: '/#services' },
    { id: 'contact', label: 'Contact', path: '/#contact' },
    { id: 'news', label: 'News', path: '/news-events' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)

      // The hero owns the top of the page and is always dark, so while it still
      // fills most of the viewport keep the header in its dark style. Below it,
      // follow whichever section sits under the reading line.
      if (window.scrollY < window.innerHeight * 0.5) {
        setIsDark(true)
        return
      }

      const sections = navLinks.map(link =>
        link.path.includes('#') ? document.getElementById(link.path.split('#')[1]) : null
      )
      const scrollPos = window.scrollY + window.innerHeight / 3

      sections.forEach(section => {
        if (!section) return
        const top = section.offsetTop
        const height = section.offsetHeight
        if (scrollPos >= top && scrollPos < top + height) {
          setIsDark(section.classList.contains('section--dark'))
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

  // Section links must work from /news-events and /members too, where there is
  // no #about/#services element to scroll to — send those visitors home first.
  // News is a real page, so just navigate there.
  const handleNavClick = (e, link) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)

    if (link.path === '/') {
      if (location.pathname !== '/') {
        navigate('/')
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // A full page (e.g. News) rather than an in-page section.
    if (!link.path.includes('#')) {
      if (location.pathname !== link.path) {
        navigate(link.path)
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    const sectionId = link.path.split('#')[1]
    if (document.getElementById(sectionId)) {
      scrollToSection(sectionId)
      return
    }

    navigate(link.path)
  }

  return (
    <>
      <motion.header
        className={`nav ${isScrolled ? 'nav--scrolled' : ''} ${isDark ? 'nav--dark' : 'nav--light'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8,delay:2.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="nav__container">
          <Link to="/" className="nav__logo clickable">
            <img 
              src={logoImage} // Use the imported logo image
              alt={studioInfo.name}
              className="nav__logo-image"
            />
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
          </nav>

          {/* <motion.button
            className="nav__cta clickable"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('contact')}
          >
            Book Session
          </motion.button> */}

          {/* Bell + hamburger are grouped so they sit together at the right
              edge; left loose, space-between would push them apart. */}
          <div className="nav__actions">
            <NotificationsBell />

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
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { NewsEvents } from './pages/NewsEvents'
import { Members } from './pages/Members'
import { FloatingParticles, CursorGlow } from './components'


// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

function App() {
  useEffect(() => {
    // Initialize smooth scroll behavior
    ScrollTrigger.defaults({
      toggleActions: 'play none none reverse'
    })

    // Refresh ScrollTrigger after initial load
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 100)

    // Handle window resize
    const handleResize = () => {
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', handleResize)
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  return (
    <Router>
      <div className="app">
        {/* Global Effects */}
        <FloatingParticles count={25} />
        <CursorGlow />
        
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news-events" element={<NewsEvents />} />
          <Route path="/members" element={<Members />} />
        </Routes>
        
        <Footer />
      </div>
    </Router>
  )
}

export default App
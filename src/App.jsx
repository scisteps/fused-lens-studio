import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Preloader } from './components/Preloader'
import { Home } from './pages/Home'
import { NewsEvents } from './pages/NewsEvents'
import { Members } from './pages/Members'
import { FloatingParticles, CursorGlow } from './components'
import ContentDashboard from './dashboards/ContentDashboard'
import NewsEventsDashboard from './dashboards/NewsEventsDashboard'
import MembersDashboard from './dashboards/MembersDashboard'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

function App() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <Preloader onComplete={() => setLoading(false)} />
  }

  return (
    <Router>
      <AppShell />
    </Router>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  const isDashboard = pathname.startsWith('/admin/')

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
    <div className="app">
        {!isDashboard && <FloatingParticles count={25} />}
        {!isDashboard && <CursorGlow />}
        {!isDashboard && <Navigation />}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news-events" element={<NewsEvents />} />
          <Route path="/members" element={<Members />} />
          <Route path="/admin/content" element={<ContentDashboard />} />
          <Route path="/admin/news-events" element={<NewsEventsDashboard />} />
          <Route path="/admin/members" element={<MembersDashboard />} />

        </Routes>
        
        {!isDashboard && <Footer />}
      </div>
  )
}

export default App
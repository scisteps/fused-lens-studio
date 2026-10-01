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
import NotificationsDashboard from './dashboards/NotificationsDashboard'
import { RequireAdmin } from './components'
import { useSiteTheme } from './lib/useSiteTheme'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { Welcome } from './pages/Welcome'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

function App() {
  const [loading, setLoading] = useState(true)

  // if (loading) {
  //   return <Preloader onComplete={() => setLoading(false)} />
  // }

  return (
    <Router>
      <AppShell />
    </Router>
  )
}

function AppShell() {
  const { pathname, hash } = useLocation()
  const isDashboard = pathname.startsWith('/admin/')

  // Public-site palette chosen by the admin (Content Dashboard → Site theme).
  // Dashboards are excluded inside the hook — the CMS keeps its dark + gold chrome.
  useSiteTheme(isDashboard)

  // Section links from other pages arrive as '/#about'. There is no element to
  // scroll to at the moment of navigation, so wait for the page to paint first.
  useEffect(() => {
    if (!hash) return
    const timeout = setTimeout(() => {
      document.getElementById(hash.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' })
    }, 320)
    return () => clearTimeout(timeout)
  }, [hash, pathname])

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
    }
  }, [])

  return (
    <div className="app">
        {/* {!isDashboard && <FloatingParticles count={25} />} */}
        {/* {!isDashboard && <CursorGlow />} */}
        {!isDashboard && <Navigation />}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news-events" element={<NewsEvents />} />
          <Route path="/members" element={<Members />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/admin/content" element={<RequireAdmin><ContentDashboard /></RequireAdmin>} />
          <Route path="/admin/news-events" element={<RequireAdmin><NewsEventsDashboard /></RequireAdmin>} />
          <Route path="/admin/members" element={<RequireAdmin><MembersDashboard /></RequireAdmin>} />
          <Route path="/admin/notifications" element={<RequireAdmin><NotificationsDashboard /></RequireAdmin>} />

        </Routes>
        
        {!isDashboard && <Footer />}
      </div>
  )
}

export default App
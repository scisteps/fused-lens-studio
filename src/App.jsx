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
import { Portfolio } from './pages/Portfolio'
import { FloatingParticles, CursorGlow } from './components'
import ContentDashboard from './dashboards/ContentDashboard'
import NewsEventsDashboard from './dashboards/NewsEventsDashboard'
import MembersDashboard from './dashboards/MembersDashboard'
import NotificationsDashboard from './dashboards/NotificationsDashboard'
import { RequireAdmin } from './components'
import { useSiteTheme, ThemeContext } from './lib/useSiteTheme'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { Welcome } from './pages/Welcome'
import { MemberProfile } from './pages/MemberProfile'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

// The full-screen intro that used to gate the app before it mounted.
//
// It is OFF, and it was off before this work too — the commented-out
// `if (loading) return <Preloader … />` block in App() was never active. It was
// briefly switched on, which put a second crane on screen because the hero
// already plays one of its own.
//
// Leave it false. If you ever want a full-screen intro as well, set this to
// true — but then remove the hero's <Player>, or you will have two cranes.
const SHOW_PRELOADER = false

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  )
}

function AppShell() {
  const { pathname, hash } = useLocation()
  const isDashboard = pathname.startsWith('/admin/')
  const [loading, setLoading] = useState(true)

  // Public-site palette chosen by the admin (Content Dashboard → Site theme).
  // Dashboards are excluded inside the hook — the CMS keeps its dark + gold chrome.
  // `themeId` also picks the preloader animation, so it has to be read here,
  // alongside the gate that decides whether the intro plays at all.
  // `themeLoaded` holds the intro until the palette is known — without it the
  // crane would start in the default colour and then swap.
  const { themeId, themeLoaded } = useSiteTheme(isDashboard)

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

  // The intro REPLACES the site rather than covering it. Returning early — as
  // the original code did — means the nav, hero and footer are not mounted
  // behind the white screen. OFF by default (see SHOW_PRELOADER): the hero
  // already plays a crane, so switching this on would show two.
  //
  // It sits after every hook on purpose: hooks must run unconditionally, or
  // React throws on the render where the flag flips.
  if (SHOW_PRELOADER && !isDashboard && loading) {
    return (
      <Preloader
        themeId={themeId}
        ready={themeLoaded}
        onComplete={() => setLoading(false)}
      />
    )
  }

  return (
    // The hero reads the resolved palette from here to pick its crane
    // animation, rather than opening a second Firestore listener itself.
    <ThemeContext.Provider value={{ themeId, themeLoaded }}>
      <div className="app">
        {/* {!isDashboard && <FloatingParticles count={25} />} */}
        {/* {!isDashboard && <CursorGlow />} */}
        {!isDashboard && <Navigation />}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news-events" element={<NewsEvents />} />
          <Route path="/members" element={<Members />} />
          {/* The public directory of every signed-up member and their shareable
              portfolio links. Reads memberPortfolios only — never `users`. */}
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/welcome" element={<Welcome />} />
          {/* The public page behind a member's share link. Public by design —
              it reads only the memberPortfolios document, never `users`. */}
          <Route path="/member/:uid" element={<MemberProfile />} />
          <Route path="/admin/content" element={<RequireAdmin><ContentDashboard /></RequireAdmin>} />
          <Route path="/admin/news-events" element={<RequireAdmin><NewsEventsDashboard /></RequireAdmin>} />
          <Route path="/admin/members" element={<RequireAdmin><MembersDashboard /></RequireAdmin>} />
          <Route path="/admin/notifications" element={<RequireAdmin><NotificationsDashboard /></RequireAdmin>} />

        </Routes>
        
        {!isDashboard && <Footer />}
      </div>
    </ThemeContext.Provider>
  )
}

export default App
// pages/Home.js
import { Hero } from '../components/Hero'
import { About } from '../components/About'
import { Services } from '../components/Services'
import { Membership } from '../components/Membership'
import { RoadMap } from '../components/RoadMap'
import { Contact } from '../components/Contact'
import { NewsCarousel } from '../components/NewsCarousel'

export function Home() {
  return (
    <main className="home">
      <Hero />
      {/* Members only — renders nothing at all for a signed-out visitor, and
          nothing while the session is still being resolved. */}
      <NewsCarousel />
      <About />
      <Services />
      <Membership />
      <RoadMap />
      <Contact />
    </main>
  )
}

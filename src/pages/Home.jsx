// pages/Home.js
import { Hero } from '../components/Hero'
import { About } from '../components/About'
import { Services } from '../components/Services'
import { Membership } from '../components/Membership'
import { RoadMap } from '../components/RoadMap'
import { Contact } from '../components/Contact'

export function Home() {
  return (
    <main className="home">
      <Hero />
      <About />
      <Services />
      <Membership />
      <RoadMap />
      <Contact />
    </main>
  )
}
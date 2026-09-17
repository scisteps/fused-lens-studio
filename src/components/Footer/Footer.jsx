import { Link } from 'react-router-dom'
import { useSiteContent } from '../../lib/useSiteContent'
import { SocialLinks } from '../Social'
import './Footer.css'

// Section links are hashes on the main page, so they are written as '/#id'.
// AppShell watches the hash and scrolls once the page has painted, which means
// the same footer works from the main page and from every other route.
const SECTION_LINKS = [
  { to: '/#about', label: 'About' },
  { to: '/#services', label: 'Services' },
  { to: '/#membership', label: 'Membership' },
  { to: '/#contact', label: 'Contact' }
]

const PAGE_LINKS = [
  { to: '/news-events', label: 'News & Events' },
  { to: '/members', label: 'Members' }
]

export function Footer() {
  const { content } = useSiteContent()
  const studio = content.studioInfo || {}
  const year = new Date().getFullYear()

  // 8 particles, cycled through the 3 brand colors
  const PARTICLE_COLORS = ['white', 'orange', 'green']

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          {/* Logo + floating particles wrapper */}
          <div className="footer__logo-wrap">
            <img
              src="/crane.png"
              alt={studio.name || 'Animation Guild Uganda'}
              className="footer__logo"
            />

            <span className="footer__particles" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className={`footer__particle footer__particle--${
                    PARTICLE_COLORS[i % PARTICLE_COLORS.length]
                  }`}
                />
              ))}
            </span>
          </div>

          <strong className="footer__name">
            {studio.name || 'Animation Guild Uganda'}
          </strong>

          <span className="footer__tagline">
            <span className="footer__tagline-word footer__tagline-word--white">Mobilize</span>
            <span className="footer__tagline-sep"> — </span>
            <span className="footer__tagline-word footer__tagline-word--orange">Mentor</span>
            <span className="footer__tagline-sep"> — </span>
            <span className="footer__tagline-word footer__tagline-word--green">Monetize</span>
          </span>
        </div>

        {/* Just the essentials: where we are, how to write, where to follow.
            The phone number is deliberately left to the Contact section. */}
        <div className="footer__cols">
          {(studio.address || studio.email) && (
            <section className="footer__col">
              <h2 className="footer__col-title">Find us</h2>
              <address className="footer__address">
                {studio.address && <span>{studio.address}</span>}
                {studio.email && (
                  <a href={`mailto:${studio.email}`} className="footer__email">
                    {studio.email}
                  </a>
                )}
              </address>
            </section>
          )}

          {studio.social && (
            <section className="footer__col">
              <h2 className="footer__col-title">Follow us</h2>
              <SocialLinks social={studio.social} />
            </section>
          )}
        </div>

        <div className="footer__bar">
          <nav className="footer__links" aria-label="Footer">
            {SECTION_LINKS.map(link => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
            {PAGE_LINKS.map(link => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </nav>

          <p className="footer__copyright">
            © {year} {studio.name || 'Animation Guild Uganda'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
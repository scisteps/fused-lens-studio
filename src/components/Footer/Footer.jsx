import { useSiteContent } from '../../lib/useSiteContent'
import './Footer.css'

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
              alt="Animation Guild Uganda"
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

          {studio.tagline && (
            <span className="footer__tagline">
              <span className="footer__tagline-word footer__tagline-word--white">Mobilize</span>
              <span className="footer__tagline-sep"> — </span>
              <span className="footer__tagline-word footer__tagline-word--orange">Mentor</span>
              <span className="footer__tagline-sep"> — </span>
              <span className="footer__tagline-word footer__tagline-word--green">Monetize</span>
            </span>
          )}
        </div>

        <nav className="footer__links" aria-label="Footer">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#membership">Membership</a>
          <a href="#contact">Contact</a>
        </nav>

        {studio.social && (
          <div className="footer__social">
            {Object.entries(studio.social).map(([platform, url]) =>
              url ? (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </a>
              ) : null
            )}
          </div>
        )}

        <p className="footer__copyright">
          © {year} {studio.name || 'Animation Guild Uganda'}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
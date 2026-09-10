import { useSiteContent } from '../../lib/useSiteContent'
import './Footer.css'

export function Footer() {
  const { content } = useSiteContent()
  const studio = content.studioInfo || {}
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <strong className="footer__name">{studio.name || 'Animation Guild Uganda'}</strong>
          {studio.tagline && <span className="footer__tagline">{studio.tagline}</span>}
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
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer">
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
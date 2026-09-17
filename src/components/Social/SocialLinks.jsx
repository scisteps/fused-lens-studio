// Single source of truth for the Guild's social icons.
// Paths match the set used by the Contact section so the footer, the article
// footer and Contact all read as the same brand.
import './SocialLinks.css'

export const SOCIAL_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  twitter: 'X',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok'
}

export const socialLabel = platform =>
  SOCIAL_LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)

const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.024 10.125 11.927v-8.432H7.078v-3.495h3.047V9.41c0-3.017 1.792-4.689 4.533-4.689 1.312 0 2.686.235 2.686.235v2.973h-1.514c-1.491 0-1.956.93-1.956 1.886v2.263h3.328l-.532 3.495h-2.796V24C19.612 23.097 24 18.092 24 12.073z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.6 3h3.2l-7 8 8.2 10h-6.4l-5-6.1L5 21H1.8l7.5-8.6L1.4 3h6.6l4.5 5.6Zm-1.1 16h1.8L7.6 4.8H5.7Z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.75-1.75C18.3 5.1 12 5.1 12 5.1s-6.3 0-7.85.45A2.5 2.5 0 0 0 2.4 7.3C2 8.8 2 12 2 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.75 1.75C5.7 18.9 12 18.9 12 18.9s6.3 0 7.85-.45a2.5 2.5 0 0 0 1.75-1.75C22 15.2 22 12 22 12ZM10 15.1V8.9l5.4 3.1Z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.6 2.6 0 1 1-1.86-2.5V9.7a5.7 5.7 0 1 0 4.96 5.65V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
    </svg>
  )
}

ICONS.x = ICONS.twitter

export function SocialIcon({ platform }) {
  const icon = ICONS[platform]
  if (!icon) return null
  return <span className="social-icon">{icon}</span>
}

// Renders only the platforms that actually have a URL, so an empty entry in
// the CMS never leaves a dead icon.
export function SocialLinks({ social, showLabels = false, className = '' }) {
  const entries = Object.entries(social || {}).filter(([, url]) => url)
  if (entries.length === 0) return null

  return (
    <ul className={`social-links ${className}`.trim()}>
      {entries.map(([platform, url]) => (
        <li key={platform}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-links__link clickable"
            aria-label={socialLabel(platform)}
            title={socialLabel(platform)}
          >
            <SocialIcon platform={platform} />
            {showLabels && <span className="social-links__text">{socialLabel(platform)}</span>}
          </a>
        </li>
      ))}
    </ul>
  )
}

// ============================================================
//  PORTFOLIO LINKS — the "share your work" field on sign-up
//
//  Every entry below draws ONE tile inside <PortfolioLinks>.
//  Tapping a tile opens a box underneath it where the member
//  pastes their link; "Other" is the escape hatch for anything
//  not on the grid (a Vimeo reel, a Notion page, a PDF of a
//  showreel).
//
//  A member may fill in as many of these as they like, but at
//  least one is required — see validate() in src/pages/SignUp.jsx.
//
//  ── HOW TO ADD / REMOVE / RENAME A PLATFORM ─────────────────
//  Add or delete an object in PORTFOLIO_LINKS, then mirror the
//  same id in these three places, or the write will be rejected
//  by the Firestore rules / land in an unnamed sheet column:
//    • firestore.rules            → hasOnly([...]) in isValidProfile()
//    • google-apps-script/Code.gs → SIGNUP_HEADERS
//    • src/pages/Login.jsx        → nothing (it reads PORTFOLIO_LINKS)
// ============================================================

// Longest URL we store. Mirrored by `k.size() <= 500` in firestore.rules.
export const MAX_PORTFOLIO_URL_LENGTH = 500

// The optional "about you" field on sign-up, shown on the member's public
// portfolio card. Capped in WORDS (not characters) because that is how the
// sign-up form describes it: "Tell us about yourself — up to 50 words."
export const MAX_ABOUT_WORDS = 50

/**
 * Trim + collapse whitespace so a pasted paragraph or soft-wrapped line renders
 * as normal prose and is easy to display on a card. Blank becomes ''.
 */
export function normaliseAbout(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

/** How many words a string holds (blank → 0). Used by the live counter + validation. */
export function aboutWordCount(value) {
  const text = String(value || '').trim()
  if (!text) return 0
  return text.split(/\s+/).length
}

// Label of the free-text tile — kept here so the picker never
// hard-codes it, the same way professions.js holds OTHER_PROFESSION_LABEL.
export const OTHER_PORTFOLIO_LABEL = 'Other'

//   id          — the Firestore field name AND the sheet column suffix
//   label       — what the member reads on the tile
//   placeholder — the example link shown in the box under the tile
//   isOther     — the single escape-hatch tile; always keep it last
export const PORTFOLIO_LINKS = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'linkedin.com/in/your-name'
  },
  {
    id: 'instagram',
    label: 'Instagram',
    placeholder: 'instagram.com/yourhandle'
  },
  {
    id: 'behance',
    label: 'Behance',
    placeholder: 'behance.net/your-name'
  },
  {
    id: 'dribbble',
    label: 'Dribbble',
    placeholder: 'dribbble.com/your-name'
  },
  {
    id: 'web',
    label: 'Web',
    placeholder: 'yourname.com'
  },
  {
    id: 'other',
    label: OTHER_PORTFOLIO_LABEL,
    placeholder: 'https://your-link-here.com',
    isOther: true
  }
]

// Convenience list for validation and for the Firestore rules comment.
export const PORTFOLIO_IDS = PORTFOLIO_LINKS.map((link) => link.id)

/** A fresh { linkedin: '', … } map for the form state. */
export function emptyPortfolio() {
  return PORTFOLIO_IDS.reduce((acc, id) => {
    acc[id] = ''
    return acc
  }, {})
}

/**
 * The public showcase collection read by /portfolio.
 *
 * ⚠️ This is DELIBERATELY NOT the `users` collection. `users/{uid}` holds each
 *    member's email, phone and date of birth, and firestore.rules keeps it
 *    readable only by the owner and admins. A public portfolio page therefore
 *    cannot read it — and loosening that rule to make the page work would
 *    publish every member's phone number and date of birth to the internet.
 *
 *    Instead, signup writes a second, minimal document here containing only
 *    what a portfolio listing legitimately shows: a display name, what the
 *    member does, and the links they chose to share. `buildPublicEntry()` is
 *    the ONLY thing that decides what crosses that boundary — add a field
 *    there deliberately, never by copying the whole profile across.
 *
 * It is a separate collection rather than a sub-collection of `users` so that
 * `allow read: if true` on it can never be widened by accident into exposing
 * the parent document.
 */
export const MEMBER_PORTFOLIOS_COLLECTION = 'memberPortfolios'

/**
 * The shareable subset of a member profile — the exact document written to
 * MEMBER_PORTFOLIOS_COLLECTION at signup.
 *
 * Note what is absent: email, phone, countryCode, dateOfBirth, uid (beyond the
 * document id), role and isAdmin. If you add a field here, it becomes public.
 *
 * @param {object} profile  The fields signUpWithEmail is about to write to
 *                          `users/{uid}`.
 */
export function buildPublicEntry(profile) {
  const links = cleanPortfolioLinks(profile.portfolio)
  const student = Boolean(profile.isStudent)

  return {
    name: String(profile.name || '').trim(),
    category: String(profile.category || '').trim(),
    // A student lists an institution; everyone else a profession. Same pairing
    // the sign-up form and firestore.rules enforce on the private document.
    isStudent: student,
    school: student ? String(profile.school || '').trim() : null,
    profession: student ? null : String(profile.profession || '').trim(),
    portfolio: links,
    // The optional "Tell us about yourself" note (up to 50 words) from sign-up.
    // Normalised here so the card, the Firestore document and the public listing
    // all carry byte-identical text. Blank stays blank so the page can omit it.
    about: normaliseAbout(profile.about),
    // Opt-out switch. The secretariat can set `visible: false` on a single
    // document from the Firebase console to pull one member out of the public
    // listing without deleting their account. Absent means visible, so a
    // document written before this flag existed still shows.
    visible: true,
    createdAt: profile.createdAt
  }
}

/**
 * Human label for a stored portfolio id; falls back to the raw value.
 */
export function portfolioLabel(value) {
  if (!value) return ''
  return PORTFOLIO_LINKS.find((link) => link.id === value)?.label || value
}

/**
 * Members paste "www.linkedin.com/in/jane", "linkedin.com/in/jane" and
 * "https://linkedin.com/in/jane" interchangeably — so give anything without a
 * scheme one before it is validated or stored. That keeps the profile copyable
 * into an email as a real, clickable link.
 */
export function normalisePortfolioUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value.replace(/^\/+/, '')}`
}

/**
 * True when the member typed something that resolves to a real http(s) URL.
 * A bare word ("my work") or a single-label host ("localhost") is rejected, so
 * the secretariat never gets a junk cell in the sheet.
 */
export function isValidPortfolioUrl(raw) {
  const normalised = normalisePortfolioUrl(raw)
  if (!normalised || normalised.length > MAX_PORTFOLIO_URL_LENGTH) return false
  // Whitespace never belongs in a link, and it is the usual sign of two URLs
  // pasted into one box.
  if (/\s/.test(normalised)) return false

  let parsed
  try {
    parsed = new URL(normalised)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  // A real public host has a dot in it ("example.com"). Anything else is a
  // placeholder or a typo.
  return parsed.hostname.includes('.')
}

/**
 * Trim + normalise a whole portfolio map, dropping the tiles left blank.
 * Unknown keys are dropped too — firestore.rules allows only PORTFOLIO_IDS.
 */
export function cleanPortfolioLinks(value) {
  const source = value && typeof value === 'object' ? value : {}

  return PORTFOLIO_IDS.reduce((acc, id) => {
    const url = normalisePortfolioUrl(source[id])
    if (url) acc[id] = url
    return acc
  }, {})
}

/** [{ id, label, url }] for the filled tiles — the order they appear on the form. */
export function portfolioEntries(value) {
  const cleaned = cleanPortfolioLinks(value)
  return PORTFOLIO_LINKS.filter((link) => cleaned[link.id]).map((link) => ({
    id: link.id,
    label: link.label,
    url: cleaned[link.id]
  }))
}

/** How many links the member has supplied. */
export function portfolioCount(value) {
  return portfolioEntries(value).length
}

/**
 * A single "LinkedIn, Instagram" style line, for places that can only show one
 * value (the Google Sheet, the profile pop-over).
 */
export function portfolioSummary(value) {
  return portfolioEntries(value)
    .map((entry) => entry.label)
    .join(', ')
}
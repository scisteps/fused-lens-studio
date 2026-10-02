// src/data/signup.js
//
// The option lists on the sign-up form. They live here, in one editable file,
// so the secretariat can add a dialling code or a membership category without
// touching a component — the same convention src/data/professions.js follows
// for the profession tiles.
//
//   COUNTRY_CODES     — the dialling-code dropdown beside the phone field.
//                       East Africa first (the Guild's constitutional scope),
//                       then the countries members actually write in from.
//   MEMBER_CATEGORIES — the "what kind of member are you?" select. This is the
//                       field that decides which follow-up question the form
//                       asks: a STUDENT names an institution, everyone else
//                       picks a profession.

// ── Phone dialling codes ────────────────────────────────────────────────────
// `code` is the E.164 prefix stored on the profile. The flag is a nicety only —
// it is never parsed, so swap it for an icon if you prefer.
export const COUNTRY_CODES = [
  { code: '+256', label: 'Uganda',           flag: '🇺🇬' },
  { code: '+254', label: 'Kenya',            flag: '🇰🇪' },
  { code: '+255', label: 'Tanzania',         flag: '🇹🇿' },
  { code: '+250', label: 'Rwanda',           flag: '🇷🇼' },
  { code: '+257', label: 'Burundi',          flag: '🇧🇮' },
  { code: '+243', label: 'DR Congo',         flag: '🇨🇩' },
  { code: '+211', label: 'South Sudan',      flag: '🇸🇸' },
  { code: '+251', label: 'Ethiopia',         flag: '🇪🇹' },
  { code: '+252', label: 'Somalia',          flag: '🇸🇴' },
  { code: '+234', label: 'Nigeria',          flag: '🇳🇬' },
  { code: '+233', label: 'Ghana',            flag: '🇬🇭' },
  { code: '+44',  label: 'United Kingdom',   flag: '🇬🇧' },
  { code: '+1',   label: 'USA / Canada',     flag: '🇺🇸' }
]

// Uganda first — the Guild is Ugandan, and it is what toE164() assumed
// before the dropdown existed.
export const DEFAULT_COUNTRY_CODE = '+256'

// ── Membership categories ───────────────────────────────────────────────────
// `id` is what lands on the profile as `category`. Keep the ids in sync with
// the pattern in firestore.rules (isValidProfile), which rejects anything else.
//
//   student      → the form asks for an INSTITUTION, not a profession
//   everything else → the form asks for a PROFESSION
//
// The wording mirrors the membership categories in the Content Dashboard
// (Ordinary/Professional, Student, Studio/Corporate, International/Associate,
// Honorary/Patron) so the two screens agree with each other.
export const MEMBER_CATEGORIES = [
  {
    id: 'professional',
    label: 'Professional',
    blurb: 'Working in animation or a related creative field.'
  },
  {
    id: 'student',
    label: 'Student',
    blurb: 'Studying animation or a related field right now.'
  },
  {
    id: 'studio',
    label: 'Studio',
    blurb: 'A studio, production house, broadcaster, NGO or school.'
  },
  {
    id: 'international',
    label: 'International',
    blurb: 'Supporting the industry from outside Uganda, or as a partner.'
  }
]

export const STUDENT_CATEGORY_ID = 'student'

// Convenience list for validation and for the Firestore rules comment.
export const CATEGORY_IDS = MEMBER_CATEGORIES.map((category) => category.id)

/**
 * Categories that existed before the list was cut down to one-word options.
 * They are no longer offered on the form, but members who signed up earlier
 * still have one stored on their profile.
 *
 * (`professional` used to live here too — it is BACK on the sign-up form as a
 * current category, so it sits in MEMBER_CATEGORIES instead.)
 *
 * These ids stay in:
 *   • firestore.rules  → otherwise those profiles FAIL validation and the owner
 *     can no longer update their own document — they would be locked out of
 *     editing their portfolio links.
 *   • LEGACY_LABELS    → so an old profile still shows a sensible name in the
 *     header chip and on their shareable page instead of a raw id.
 *
 * Once no live profile uses one, drop it from here and from the rules.
 */
export const LEGACY_CATEGORY_LABELS = {
  associate: 'International',
  patron: 'Patron'
}

export const LEGACY_CATEGORY_IDS = Object.keys(LEGACY_CATEGORY_LABELS)

/** Every id the rules must accept: the four current ones plus the legacy ones. */
export const ALL_CATEGORY_IDS = [...CATEGORY_IDS, ...LEGACY_CATEGORY_IDS]

/** The single source of truth for "does this member name an institution?". */
export function isStudentCategory(value) {
  return value === STUDENT_CATEGORY_ID
}

/**
 * Human label for a stored category id; falls back to the raw value.
 * Knows the retired categories too, so an older profile still reads properly.
 */
export function categoryLabel(value) {
  if (!value) return ''
  const current = MEMBER_CATEGORIES.find((c) => c.id === value)
  if (current) return current.label
  return LEGACY_CATEGORY_LABELS[value] || value
}

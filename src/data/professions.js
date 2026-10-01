// ============================================================
//  PROFESSION CATEGORIES — the tile picker on the sign-up form
// ============================================================
//
//  Every entry below draws ONE tile inside <ProfessionPicker>: a
//  category label, laid out row by column. The tiles are text-only — the
//  Lottie artwork that used to sit in each one has been removed, so there is
//  nothing to swap and no animation to download.
//
//  ── HOW TO ADD / REMOVE / RENAME A CATEGORY ───────────────────────────
//  Add or delete an object in PROFESSION_CATEGORIES.
//    id     — unique React key
//    label  — what the member reads, and what is saved as `profession`
//    isOther— special tile: opens the free-text box instead of picking a
//             label. Exactly one entry carries it, and it stays last.
// ============================================================

// Label of the free-text tile — kept here so the picker never hard-codes it.
export const OTHER_PROFESSION_LABEL = 'Other'

export const PROFESSION_CATEGORIES = [
  { id: 'animator-2d', label: '2D Animator' },
  { id: 'animator-3d', label: '3D Animator' },
  { id: 'motion-designer', label: 'Motion Designer' },
  { id: 'illustrator', label: 'Illustrator' },
  { id: 'storyboard-artist', label: 'Storyboard Artist' },
  { id: 'character-designer', label: 'Character Designer' },
  { id: 'vfx-artist', label: 'VFX Artist' },
  { id: 'game-artist', label: 'Game Artist' },
  { id: 'producer', label: 'Producer' },
  { id: 'educator', label: 'Educator' },
  { id: 'student', label: 'Student' },
  { id: 'other', label: OTHER_PROFESSION_LABEL, isOther: true }
]

// True when a stored profession is one of the listed tiles (i.e. it was
// picked, not typed into the "Other" box).
export function isListedProfession(value) {
  const needle = String(value || '').trim().toLowerCase()
  if (!needle) return false
  return PROFESSION_CATEGORIES.some(
    (category) =>
      !category.isOther && category.label.toLowerCase() === needle
  )
}

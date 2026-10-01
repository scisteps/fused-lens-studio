// src/data/themes.js
//
// Color palettes for the public site. The admin picks one in
// Content Dashboard → "Site theme"; it is stored as `themeId` on the
// `siteContent/main` document and applied to every page EXCEPT /admin/*
// (dashboards keep their own dark + gold CMS styling).
//
// HOW TO CHANGE A PALETTE:
//   Just edit the hex values below. Every public component reads
//   var(--color-accent) / var(--color-secondary) (with --rgb helpers for
//   glows), so no component CSS needs touching.
//
// HOW TO SWAP THE OPENING ANIMATION:
//   Each theme carries an `intro` key naming the Lottie in src/jsons/ that
//   plays over the preloader, so the opening crane always matches the palette
//   the admin picked. The three files are the same crane recoloured:
//     greycrane.json  — grey  (0.352, 0.352, 0.352)
//     orange crane.json — orange (0.907, 0.513, 0.251)
//     goldcrane.json  — gold  (0.638, 0.530, 0.291)
//   Change a theme's `intro` to point at a different file and the preloader
//   follows. See <Preloader /> for how it is resolved.

import greyCrane from '../jsons/greycrane.json'
// The filename genuinely contains a space, so it needs the full quoted path.
import orangeCrane from '../jsons/orange crane.json'
import goldCrane from '../jsons/goldcrane.json'

export const INTRO_ANIMATIONS = {
  grey: greyCrane,
  orange: orangeCrane,
  gold: goldCrane
}

export const THEMES = [
  {
    id: 'guild',
    label: 'Guild (green + orange)',
    desc: 'Current palette — orange primary, green secondary.',
    swatches: ['#0a0a0a', '#ffffff', '#FD6500', '#0C7923'],
    intro: 'orange', // the orange primary is the loudest colour on the page
  },
  {
    id: 'mono',
    label: 'Mono (black + white)',
    desc: 'Black and white shades only.',
    swatches: ['#0a0a0a', '#ffffff', '#e8e8e8', '#6b6b6b'],
    intro: 'grey', // no colour of its own, so it takes the grey crane
  },
  {
    id: 'royal',
    label: 'Royal blue (black + white + blue)',
    desc: 'Black and white with a royal-blue accent.',
    swatches: ['#0a0a0a', '#ffffff', '#4169E1', '#0a0a0a'],
    // No blue crane exists, so this falls back to the grey one — which is
    // right: it keeps the intro neutral instead of introducing a colour the
    // rest of the page does not use.
    intro: 'grey',
  },
  {
    id: 'gold',
    label: 'Gold (black + white + gold)',
    desc: 'Black and white with gold — matches the admin dashboards.',
    swatches: ['#0a0a0a', '#ffffff', '#C9A962', '#0a0a0a'],
    intro: 'gold',
  },
]

export const DEFAULT_THEME_ID = 'guild'

// Which animation plays when a theme has no `intro` of its own.
export const DEFAULT_INTRO = 'grey'

export function isThemeId(value) {
  return THEMES.some((theme) => theme.id === value)
}

export function normalizeThemeId(value) {
  return isThemeId(value) ? value : DEFAULT_THEME_ID
}

/**
 * The intro Lottie for a theme id. Falls back through three steps so this can
 * never return undefined and crash <Preloader />: unknown theme id → the
 * default theme → the default animation.
 */
export function themeIntro(themeId) {
  const theme = THEMES.find((t) => t.id === themeId)
  return INTRO_ANIMATIONS[theme?.intro] || INTRO_ANIMATIONS[DEFAULT_INTRO]
}

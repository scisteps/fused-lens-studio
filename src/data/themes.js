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

export const THEMES = [
  {
    id: 'guild',
    label: 'Guild (green + orange)',
    desc: 'Current palette — orange primary, green secondary.',
    swatches: ['#0a0a0a', '#ffffff', '#FD6500', '#0C7923'],
  },
  {
    id: 'mono',
    label: 'Mono (black + white)',
    desc: 'Black and white shades only.',
    swatches: ['#0a0a0a', '#ffffff', '#e8e8e8', '#6b6b6b'],
  },
  {
    id: 'royal',
    label: 'Royal blue (black + white + blue)',
    desc: 'Black and white with a royal-blue accent.',
    swatches: ['#0a0a0a', '#ffffff', '#4169E1', '#0a0a0a'],
  },
  {
    id: 'gold',
    label: 'Gold (black + white + gold)',
    desc: 'Black and white with gold — matches the admin dashboards.',
    swatches: ['#0a0a0a', '#ffffff', '#C9A962', '#0a0a0a'],
  },
]

export const DEFAULT_THEME_ID = 'guild'

export function isThemeId(value) {
  return THEMES.some((theme) => theme.id === value)
}

export function normalizeThemeId(value) {
  return isThemeId(value) ? value : DEFAULT_THEME_ID
}

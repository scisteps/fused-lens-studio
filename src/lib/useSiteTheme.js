// src/lib/useSiteTheme.js
//
// Reads the admin-chosen `themeId` from the published `siteContent/main`
// document and applies it as `data-theme` on <html>. Dashboards (/admin/*)
// are excluded — they keep their own dark + gold CMS styling.
//
// The attribute drives the [data-theme="..."] overrides at the bottom of
// src/styles/index.css. Unknown / missing ids fall back to 'guild'.

import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_THEME_ID, normalizeThemeId } from '../data/themes'

/**
 * The resolved palette, shared through React rather than re-fetched.
 *
 * useSiteTheme() opens one Firestore listener and applies `data-theme` to
 * <html>. Components that also need the theme id IN JavaScript — the hero, to
 * pick which crane animation to play — read it from here instead of opening a
 * second listener on the same document.
 */
export const ThemeContext = createContext({
  themeId: DEFAULT_THEME_ID,
  themeLoaded: false
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function useSiteTheme(isDashboard) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)
  // True once the real theme is known — either the snapshot arrived, or it
  // failed and we have settled on the default.
  //
  // Anything that plays a theme-chosen asset (the hero's crane) waits on this,
  // otherwise it would pick the default and then swap — a visible flash of the
  // wrong colour on every load.
  const [themeLoaded, setThemeLoaded] = useState(false)

  useEffect(() => {
    const ref = doc(db, 'siteContent', 'main')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const next = normalizeThemeId(snap.data()?.themeId)
        setThemeId(next)
        setThemeLoaded(true)
      },
      (err) => {
        console.error('useSiteTheme: falling back to default theme', err)
        // Resolve on failure too, so a Firestore outage cannot leave the hero
        // stuck on the wrong animation.
        setThemeLoaded(true)
      }
    )
    return unsub
  }, [])

  // Apply to <html>. Dashboards deliberately get NO attribute so they
  // always render the default (guild) tokens + their own CMS chrome.
  useEffect(() => {
    const root = document.documentElement
    if (isDashboard) {
      root.removeAttribute('data-theme')
      return
    }
    root.setAttribute('data-theme', themeId)
    return () => root.removeAttribute('data-theme')
  }, [themeId, isDashboard])

  return { themeId, themeLoaded }
}

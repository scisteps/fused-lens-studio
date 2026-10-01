// src/lib/useSiteTheme.js
//
// Reads the admin-chosen `themeId` from the published `siteContent/main`
// document and applies it as `data-theme` on <html>. Dashboards (/admin/*)
// are excluded — they keep their own dark + gold CMS styling.
//
// The attribute drives the [data-theme="..."] overrides at the bottom of
// src/styles/index.css. Unknown / missing ids fall back to 'guild'.

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_THEME_ID, normalizeThemeId } from '../data/themes'

export function useSiteTheme(isDashboard) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)
  // True once the real theme is known — either the snapshot arrived, or it
  // failed and we have settled on the default.
  //
  // <Preloader /> waits on this before playing, because the intro animation is
  // chosen by the theme. Starting it on the default and swapping a moment later
  // would flash the wrong-coloured crane on every page load.
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
        // Unblock the preloader on failure too, or a Firestore outage would
        // leave the visitor staring at a blank white screen.
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

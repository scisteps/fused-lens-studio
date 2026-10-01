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

  useEffect(() => {
    const ref = doc(db, 'siteContent', 'main')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const next = normalizeThemeId(snap.data()?.themeId)
        setThemeId(next)
      },
      (err) => {
        console.error('useSiteTheme: falling back to default theme', err)
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

  return { themeId }
}

// src/hooks/useSiteContent.js
//
// Used by Hero, About, Services, Membership on the public site.
// Reads the *published* content doc, and falls back to the static
// data/content.js values (your current hardcoded copy) if Firestore
// hasn't been configured yet or the fetch fails — so the site never
// breaks while you're mid-migration.

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import * as staticContent from '../data/content'
import { heroSlides } from '../data/images'

export function useSiteContent() {
  const [content, setContent] = useState({
    studioInfo: staticContent.studioInfo,
    about: {
      title: 'We are the Animation Guild Uganda',
      content: `At ${staticContent.studioInfo.name}, we believe every animator should tell a story that resonates deeply with those who view it.`,
      story: ''
    },
    heroSlides,
    aboutImageId: 'agu1',
    visibility: {
      hero: true,
      about: true,
      services: true,
      membership: true,
      roadmap: true,
      contact: true
    },
    stats: staticContent.stats,
    timeline: staticContent.timeline,
    services: staticContent.services
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'siteContent', 'main')
    const unsub = onSnapshot(
      ref,
      snap => {
        if (snap.exists()) setContent(prev => ({ ...prev, ...snap.data() }))
        setLoading(false)
      },
      err => {
        console.error('useSiteContent: falling back to static content.js', err)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  return { content, loading }
}

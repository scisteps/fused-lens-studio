// src/hooks/useSiteContent.js
//
// Used by Hero, About, Services, Membership on the public site.
// Reads the published content doc from Firestore and falls back
// to the default static content if Firestore is unavailable.

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import * as staticContent from '../data/content'
import { heroSlides } from '../data/images'

const DEFAULT_CONTENT = {
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

  services: staticContent.services,

  membership: {
    title: 'Membership',

    overview:
      'The Animation Guild of Uganda brings together animators, digital artists, studios, students, and other professionals who contribute to or support the animation and wider digital creative arts industry.',

    description:
      'Membership provides access to professional development, mentorship, networking, industry opportunities, events, advocacy, and a platform for collaboration and representation within the animation community.',

    eligibility:
      'Membership is open to individuals and organisations connected with, practising, supporting, or contributing to animation and related digital creative arts in East Africa, including Uganda, Kenya, Tanzania, Rwanda and Burundi.',

    categories: [
      {
        name: 'Ordinary / Professional Membership',
        fee: 'UGX 50,000',
        description:
          'For adult individual practitioners and professionals engaged in animation or related digital creative work.'
      },
      {
        name: 'Student Membership',
        fee: 'To be determined',
        description:
          'For full-time students pursuing animation, digital art or related disciplines, subject to proof of student status.'
      },
      {
        name: 'Studio / Corporate Membership',
        fee: 'To be determined',
        description:
          'For animation studios, production companies, broadcasters, NGOs, educational institutions, technology companies and other organisations supporting or participating in the industry.'
      },
      {
        name: 'Honorary / Patron Membership',
        fee: 'By invitation',
        description:
          'For distinguished persons or organisations recognised for outstanding contribution, support or reputation in animation or related creative fields.'
      },
      {
        name: 'International / Associate Membership',
        fee: 'To be determined',
        description:
          'For persons or organisations outside Uganda whose participation supports the objectives of the Guild.'
      }
    ],

    benefits: [
      'Participate in Guild programmes, workshops, seminars and industry activities.',
      'Access professional development, mentorship and peer-to-peer learning.',
      'Participate in networking, exhibitions, screenings, competitions and festivals.',
      'Access professional opportunities and referral networks.',
      'Participate in Guild representation and advocacy for members’ professional interests.',
      'Receive information concerning Guild activities and finances as provided by the Constitution.',
      'Stand for eligible Guild positions and vote where the membership has voting rights.'
    ]
  }
}

export function useSiteContent() {
  const [content, setContent] = useState(DEFAULT_CONTENT)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'siteContent', 'main')

    const unsub = onSnapshot(
      ref,

      snap => {
        if (snap.exists()) {
          setContent(prev => ({
            ...DEFAULT_CONTENT,
            ...prev,
            ...snap.data(),

            // Make sure nested membership defaults are preserved
            membership: {
              ...DEFAULT_CONTENT.membership,
              ...(snap.data().membership || {})
            }
          }))
        }

        setLoading(false)
      },

      err => {
        console.error(
          'useSiteContent: falling back to default content',
          err
        )

        setLoading(false)
      }
    )

    return unsub
  }, [])

  return { content, loading }
}
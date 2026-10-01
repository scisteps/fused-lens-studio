// src/lib/useAuth.js
//
// Thin React wrappers around the member auth session, following the same
// loading/fallback shape as lib/useCollection.js and lib/useSiteContent.js.

import { useEffect, useState } from 'react'
import { watchAuth, subscribeProfile } from './auth'

// Current Firebase user (or null). `loading` is true until the first
// onAuthStateChanged callback fires, which is what stops the UI from
// briefly rendering a signed-out state for a signed-in visitor.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchAuth((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, loading }
}

// The users/{uid} profile document. `uid` may be null (signed out).
export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(uid))

  useEffect(() => {
    if (!uid) {
      setProfile(null)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const unsubscribe = subscribeProfile(uid, (next) => {
      setProfile(next)
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  return { profile, loading }
}

// components/Preloader.jsx
//
// The full-screen intro that plays before the site fades in.
//
// The crane shown here follows the palette the admin picked in
// Content Dashboard → "Site theme", so the opening never clashes with the rest
// of the page:
//   guild (orange + green) → orange crane
//   gold                   → gold crane
//   royal (blue) / mono    → grey crane
//
// The mapping lives in src/data/themes.js as each theme's `intro` key; this
// component only asks themeIntro() which file to play. Note that `themeId`
// arrives asynchronously from Firestore (useSiteTheme), so we hold the screen
// (via the `ready` prop) until it is known — otherwise the default theme's
// crane would start playing and then swap, a visible flash of the wrong colour
// on every load.
//
// LOTTIE LOADING:
//   The three crane JSONs are loaded lazily (dynamic import) rather than
//   bundled statically, so the main chunk stays small and only the crane the
//   theme actually uses is fetched. themeIntro() returns a loader function, not
//   a value; we resolve it here and hand the resulting object to <Player> as
//   `animationData`. Do NOT pass `src` — that expects a URL and would trigger a
//   second fetch of an already-loaded animation.

import { useState, useEffect } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import { themeIntro } from '../data/themes'

// Hard stop in case the Lottie never fires `complete` (a decode hiccup, a
// backgrounded tab). The animation itself finishes in about 6s at 30fps, so
// this is deliberately longer than the animation — it is a safety net, not a
// duration cap. The timer only starts once the animation data has actually
// loaded, so a slow chunk can't cause an early cut-off.
const FALLBACK_MS = 8000
const FADE_MS = 400

export function Preloader({ onComplete, themeId, ready = true }) {
  const [fadingOut, setFadingOut] = useState(false)
  const [animation, setAnimation] = useState(null)

  const finish = () => {
    setFadingOut(true)
    // wait for the fade transition to finish before unmounting
    setTimeout(onComplete, FADE_MS)
  }

  // Resolve the intro Lottie for the current theme. Cancelled on themeId/ready
  // change so a fast swap can't set state from a stale import.
  useEffect(() => {
    if (!ready) return undefined

    let cancelled = false
    setAnimation(null)

    themeIntro(themeId)().then((mod) => {
      if (cancelled) return
      // Dynamic imports of JSON can come through as either the module object
      // (with `.default`) or the value itself, depending on bundler config.
      setAnimation(mod?.default ?? mod)
    })

    return () => {
      cancelled = true
    }
  }, [themeId, ready])

  // Start the fallback timer only once we actually have animation data to play,
  // otherwise the clock would run while the chunk is still in flight.
  useEffect(() => {
    if (!ready || !animation) return undefined

    const timer = setTimeout(finish, FALLBACK_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, animation])

  // Fire onComplete as soon as the Lottie finishes playing, so the preloader
  // doesn't linger longer than the animation.
  const handleEvent = (event) => {
    if (event === 'complete') finish()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fadingOut ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      {/* Nothing is mounted until the theme resolves AND the matching crane has
          loaded, so the first crane the visitor sees is already the right
          colour and fully decoded — no flash, no half-drawn frame. */}
      {ready && animation && (
        <Player
          // Keyed on the animation: switching the theme swaps `animationData`,
          // and this makes the Player tear the old one down and mount the new
          // one rather than trying to re-use the loaded instance.
          key={themeId}
          autoplay
          loop={false}
          animationData={animation}
          onEvent={handleEvent}
          style={{ width: 320, height: 320 }}
        />
      )}
    </div>
  )
}
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
// arrives asynchronously from Firestore (useSiteTheme), so the first paint uses
// the default theme's crane and swaps once the real choice is known.

import { useState, useEffect } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import { themeIntro } from '../data/themes'

// Hard stop in case the Lottie never fires `complete` (a decode hiccup, a
// backgrounded tab). The animation itself finishes in about 6s at 30fps.
const FALLBACK_MS = 4000
const FADE_MS = 400

export function Preloader({ onComplete, themeId, ready = true }) {
  const [fadingOut, setFadingOut] = useState(false)

  const finish = () => {
    setFadingOut(true)
    // wait for the fade transition to finish before unmounting
    setTimeout(onComplete, FADE_MS)
  }

  useEffect(() => {
    // Hold the screen until the theme is known, otherwise the default theme's
    // crane starts playing and is then swapped for the real one — a visible
    // flash of the wrong colour on every load.
    if (!ready) return undefined

    const timer = setTimeout(finish, FALLBACK_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

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
      {/* Nothing is mounted until the theme resolves, so the first crane the
          visitor sees is already the right colour. */}
      {ready && (
        <Player
          // Keyed on the animation: switching the theme swaps `src`, and this
          // makes the Player tear the old one down and mount the new one rather
          // than trying to re-use the loaded instance.
          key={themeId}
          autoplay
          loop={false}
          src={themeIntro(themeId)}
          onEvent={handleEvent}
          style={{ width: 320, height: 320 }}
        />
      )}
    </div>
  )
}
// components/Preloader.jsx
//
// A full-screen intro that plays before the site appears.
//
// ⚠️ THIS COMPONENT IS NOT WIRED UP. App.jsx gates it behind
//    `SHOW_PRELOADER = false`, and that flag was never true in the shipped
//    site. The hero already plays a crane of its own (see Hero.jsx), so
//    enabling this would put a SECOND crane on screen — which is exactly what
//    it did when it was briefly switched on.
//
// If you ever do want it: set SHOW_PRELOADER to true AND remove the hero's
// <Player>. Never both.
//
// The crane shown follows the admin's palette (Content Dashboard → Site theme):
//   guild (orange + green) → orange crane
//   gold                   → gold crane
//   royal (blue) / mono    → grey crane
// The mapping lives in each theme's `intro` key in src/data/themes.js.

import { useState, useEffect } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import { themeIntro } from '../data/themes'

// Hard stop in case the Lottie never fires `complete` (a decode hiccup, a
// backgrounded tab).
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
    // Hold the screen until the palette is known, otherwise the default
    // theme's crane starts playing and is then swapped for the real one — a
    // visible flash of the wrong colour on every load.
    if (!ready) return undefined

    const timer = setTimeout(finish, FALLBACK_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Fire onComplete as soon as the Lottie finishes, so the preloader doesn't
  // linger longer than the animation itself.
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
      {/* themeIntro() returns the parsed Lottie object, passed the same way
          the hero passes its own crane. Keyed on the palette so switching
          themes remounts the Player with the new file. */}
      {ready && (
        <Player
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

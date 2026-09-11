import { useState, useEffect } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import final from '../jsons/final.json'

export function Preloader({ onComplete }) {
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadingOut(true)
      // wait for fade transition to finish before unmounting
      setTimeout(onComplete, 400)
    }, 4000)

    return () => clearTimeout(timer)
  }, [onComplete])

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
        transition: 'opacity 0.4s ease',
      }}
    >
      <Player
        autoplay
        loop={false}
        src={final}
        onEvent={(event) => {
          // Fire onComplete as soon as the Lottie finishes playing,
          // so the preloader doesn't linger longer than the animation.
          if (event === 'complete') {
            setFadingOut(true)
            setTimeout(onComplete, 400)
          }
        }}
        style={{ width: 320, height: 320 }}
      />
    </div>
  )
}
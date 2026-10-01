// src/components/RequireAuth.jsx
//
// Route guard for member-only content — the news article view, and
// anything a notification links to.
//
// A signed-out visitor is sent to /login with the path they were trying to
// reach remembered by lib/returnTo.js, so signing in drops them back on the
// article they tapped rather than on the home page. The path is captured in an
// effect (not during render) because writing to sessionStorage is a side
// effect, and rendering must stay pure under StrictMode's double-invoke.

import { useEffect } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { setReturnTo } from '../lib/returnTo'

const shellStyle = {
  minHeight: '60vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0a0a0a',
  color: '#f2f0ec',
  fontFamily: 'Outfit, system-ui, sans-serif',
  padding: 24
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  const wanted = `${location.pathname}${location.search}${location.hash}`

  useEffect(() => {
    if (!loading && !user) setReturnTo(wanted)
  }, [loading, user, wanted])

  if (loading) {
    return (
      <div style={shellStyle}>
        <p style={{ color: '#9a978f' }}>Checking access…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={shellStyle}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              color: '#FD6500',
              marginBottom: 8
            }}
          >
            ANIMATION GUILD UGANDA
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: '0 0 10px' }}>
            Members only
          </h1>
          <p style={{ color: '#9a978f', fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
            This story is for Animation Guild Uganda members. Sign in to read it,
            or create an account — we will bring you straight back here.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link
              to="/login"
              style={{
                background: '#FD6500',
                color: '#0a0a0a',
                fontWeight: 600,
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                textDecoration: 'none'
              }}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              style={{
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#f2f0ec',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                textDecoration: 'none'
              }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default RequireAuth

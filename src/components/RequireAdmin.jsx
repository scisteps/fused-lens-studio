// src/components/RequireAdmin.jsx
//
// Route guard for /admin/*. Renders children only when the signed-in
// member's users/{uid} profile has `isAdmin === true`. Everyone else
// (signed out or non-admin) gets a locked message with a link home.
//
// Usage in App.jsx:
//   <Route path="/admin/content" element={<RequireAdmin><ContentDashboard /></RequireAdmin>} />

import { Link } from 'react-router-dom'
import { useAuth, useUserProfile } from '../lib/useAuth'

const shellStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0c0c0e',
  color: '#f2f0ec',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: 24,
}

export function RequireAdmin({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile(user?.uid)

  if (authLoading || (user && profileLoading)) {
    return (
      <div style={shellStyle}>
        <p style={{ color: '#9a978f' }}>Checking access…</p>
      </div>
    )
  }

  if (!user || profile?.isAdmin !== true) {
    return (
      <div style={shellStyle}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#c9a962', marginBottom: 8 }}>
            ANIMATION GUILD UGANDA
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: '0 0 10px' }}>
            Admins only
          </h1>
          <p style={{ color: '#9a978f', fontSize: 14, margin: '0 0 20px' }}>
            {!user
              ? 'Sign in with an admin account to open the dashboards.'
              : 'This account does not have admin access. Ask an admin to set isAdmin to true on your user profile.'}
          </p>
          <Link
            to={!user ? '/login' : '/'}
            style={{
              display: 'inline-block',
              background: '#c9a962',
              color: '#0c0c0e',
              fontWeight: 600,
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            {!user ? 'Go to sign in' : 'Back to site'}
          </Link>
        </div>
      </div>
    )
  }

  return children
}

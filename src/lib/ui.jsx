// src/dashboards/ui.jsx
// Shared building blocks so ContentDashboard, NewsEventsDashboard and
// LeadershipDashboard don't each reinvent inputs/cards/publish bar.

export const inputStyle = {
  width: '100%',
  background: '#141417',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8,
  color: '#f2f0ec',
  padding: '10px 12px',
  fontSize: 14.5,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box'
}
export const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: 70, lineHeight: 1.5 }

export function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />
}
export function TextArea(props) {
  return <textarea {...props} style={{ ...textareaStyle, ...(props.style || {}) }} />
}

export function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 12.5, color: '#9a978f', marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  )
}

export function Card({ children, onRemove }) {
  return (
    <div style={{ background: '#141417', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 18, marginBottom: 12, position: 'relative' }}>
      {onRemove && (
        <button onClick={onRemove} title="Remove"
          style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: '#75726a', cursor: 'pointer', fontSize: 13 }}>
          Remove
        </button>
      )}
      {children}
    </div>
  )
}

export function AddButton({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: '1px dashed rgba(201,169,98,0.4)', color: '#c9a962',
      borderRadius: 8, padding: '10px 16px', fontSize: 13.5, cursor: 'pointer', width: '100%', marginTop: 4
    }}>
      + {children}
    </button>
  )
}

export function SectionHeading({ title, desc }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 21, margin: '0 0 6px' }}>{title}</h2>
      <p style={{ color: '#9a978f', fontSize: 13.5, margin: 0 }}>{desc}</p>
    </div>
  )
}

// The bar every dashboard uses to publish / restore. `status` is one of
// idle | saving | publishing | restoring | error (see useDocumentDraft / useCollectionDraft).
export function PublishBar({ isDirty, status, lastLocalSave, onPublish, onRestore }) {
  const busy = status === 'publishing' || status === 'restoring'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 12.5, color: isDirty ? '#c9a962' : '#5b584f' }}>
        {status === 'error' ? 'Something went wrong' :
          isDirty ? 'Unpublished changes saved in this browser' : 'Up to date with published version'}
      </span>
      <button
        onClick={onRestore}
        disabled={busy}
        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#9a978f', borderRadius: 8, padding: '9px 14px', fontSize: 13.5, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
        {status === 'restoring' ? 'Restoring…' : 'Restore last published'}
      </button>
      <button
        onClick={onPublish}
        disabled={busy || !isDirty}
        style={{
          background: !isDirty ? 'rgba(201,169,98,0.3)' : '#c9a962', border: 'none', color: '#0c0c0e', fontWeight: 600,
          borderRadius: 8, padding: '9px 18px', fontSize: 13.5, cursor: (busy || !isDirty) ? 'default' : 'pointer'
        }}>
        {status === 'publishing' ? 'Publishing…' : 'Publish'}
      </button>
    </div>
  )
}

export function DashboardHeader({ eyebrow, title, children }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#c9a962', marginBottom: 4 }}>{eyebrow}</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 26, margin: 0 }}>{title}</h1>
      </div>
      {children}
    </div>
  )
}

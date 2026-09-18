// src/lib/VersionHistory.jsx
//
// Collapsible "Publication history" panel for the document dashboards.
//
// The data comes from useDocumentDraft (which owns the Firestore reads), so
// this component is presentational: it renders the archived versions it is
// given, diffs a version against what is currently live, and asks the hook to
// restore one. Restoring always loads the version into the working draft —
// the admin still presses Publish, so a revert is never a surprise.

import { useEffect, useRef, useState } from 'react'

const COLORS = {
  panel: '#141417',
  border: 'rgba(255,255,255,0.07)',
  text: '#f2f0ec',
  muted: '#9a978f',
  faint: '#5b584f',
  gold: '#c9a962',
  goldSoft: 'rgba(201,169,98,0.18)'
}

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatTime(value) {
  const date = toDate(value)
  if (!date) return 'Unknown time'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function timeAgo(value) {
  const date = toDate(value)
  if (!date) return ''
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months} mo ago`
  return `${Math.round(months / 12)} y ago`
}

// Which top-level fields differ between the live document and an archived one.
function changedKeys(live, version) {
  if (!live) return []

  const skip = new Set(['publishedAt', 'archivedAt', 'id'])
  const keys = new Set([
    ...Object.keys(live || {}),
    ...Object.keys(version || {})
  ])

  const changed = []
  keys.forEach(key => {
    if (skip.has(key)) return
    if (JSON.stringify(live[key]) !== JSON.stringify(version[key])) changed.push(key)
  })

  return changed.sort()
}

// Short "shape" summary so the admin can eyeball a version before restoring.
function summarise(version) {
  const rows = []

  if (version?.studioInfo?.name) rows.push({ label: 'Guild name', value: version.studioInfo.name })
  if (Array.isArray(version?.services)) rows.push({ label: 'Services', value: `${version.services.length}` })
  if (Array.isArray(version?.heroSlides)) rows.push({ label: 'Hero slides', value: `${version.heroSlides.length}` })
  if (Array.isArray(version?.stats)) rows.push({ label: 'Stats', value: `${version.stats.length}` })
  if (Array.isArray(version?.timeline)) rows.push({ label: 'Timeline', value: `${version.timeline.length}` })
  if (Array.isArray(version?.membership?.categories)) {
    rows.push({ label: 'Membership categories', value: `${version.membership.categories.length}` })
  }
  if (Array.isArray(version?.membership?.benefits)) {
    rows.push({ label: 'Membership benefits', value: `${version.membership.benefits.length}` })
  }
  if (version?.version !== undefined) rows.push({ label: 'Schema version', value: `${version.version}` })

  return rows
}

export function VersionHistory({
  versions,
  historyStatus,
  onLoad,
  onPreview,
  onRevert,
  published,
  limit = 20
}) {
  const [open, setOpen] = useState(false)
  const [previewId, setPreviewId] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState(null)
  const requestedRef = useRef(false)

  // Load once, the first time the panel is opened.
  useEffect(() => {
    if (!open || requestedRef.current) return
    requestedRef.current = true
    onLoad?.()
  }, [open, onLoad])

  const toggle = () => setOpen(current => !current)

  const handlePreview = async versionId => {
    setNotice(null)

    if (previewId === versionId) {
      setPreviewId(null)
      setPreview(null)
      return
    }

    setPreviewId(versionId)
    setPreview(null)
    setPreviewLoading(true)

    try {
      const data = await onPreview?.(versionId)
      setPreview(data || null)
    } catch (e) {
      console.error('Could not load version', e)
      setNotice('Could not read that version. Check your Firestore rules.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleRevert = async version => {
    const when = formatTime(version.publishedAt || version.archivedAt)

    const ok = window.confirm(
      `Restore the version published ${when}?\n\n` +
        'It will be loaded into your draft. Nothing goes live until you press Publish.'
    )
    if (!ok) return

    setBusyId(version.id)
    setNotice(null)

    const restored = await onRevert?.(version.id)

    setBusyId(null)

    if (restored) {
      setPreviewId(null)
      setPreview(null)
      setNotice(
        `Version from ${when} loaded into your draft. Review it, then press Publish to put it back on the site.`
      )
    } else {
      setNotice('Could not restore that version. Check your Firestore rules and try again.')
    }
  }

  const list = versions || []
  const loading = historyStatus === 'loading'
  const failed = historyStatus === 'error'

  return (
    <section style={{ marginBottom: 34 }}>
      <div
        style={{
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: '16px 18px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, marginBottom: 3 }}>
              Publication history
            </div>
            <div style={{ color: COLORS.muted, fontSize: 13 }}>
              A snapshot is saved every time you publish. Restore any of the last {limit} versions.
            </div>
          </div>

          <button
            type="button"
            onClick={toggle}
            style={{
              background: open ? 'transparent' : COLORS.goldSoft,
              border: `1px solid ${open ? 'rgba(255,255,255,0.12)' : 'rgba(201,169,98,0.45)'}`,
              color: open ? COLORS.muted : COLORS.gold,
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 13.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {open
              ? 'Hide history'
              : versions === null
                ? 'View previous versions'
                : `View versions (${list.length})`}
          </button>
        </div>

        {!open && versions !== null && list.length > 0 && (
          <p style={{ color: COLORS.faint, fontSize: 12.5, margin: '12px 0 0' }}>
            Latest snapshot: {formatTime(list[0].publishedAt || list[0].archivedAt)} (
            {timeAgo(list[0].publishedAt || list[0].archivedAt)})
          </p>
        )}

        {open && (
          <div style={{ marginTop: 16 }}>
            {loading && (
              <p style={{ color: COLORS.muted, fontSize: 13.5, margin: 0 }}>Loading history…</p>
            )}

            {!loading && failed && (
              <div>
                <p style={{ color: '#e2867a', fontSize: 13.5, margin: '0 0 10px' }}>
                  Could not load history. The <code>versions</code> subcollection needs read access in
                  your Firestore rules.
                </p>
                <button
                  type="button"
                  onClick={() => onLoad?.()}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: COLORS.muted,
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !failed && list.length === 0 && (
              <p style={{ color: COLORS.muted, fontSize: 13.5, margin: 0 }}>
                No previous versions yet. The next time you press Publish, the version that is
                currently live will be saved here first.
              </p>
            )}

            {!loading && !failed && list.length > 0 && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {list.map((version, index) => {
                  const when = version.publishedAt || version.archivedAt
                  const isPreviewing = previewId === version.id
                  const isBusy = busyId === version.id

                  return (
                    <li
                      key={version.id}
                      style={{
                        borderTop: index === 0 ? 'none' : `1px solid ${COLORS.border}`,
                        padding: '13px 0'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, color: COLORS.text }}>
                            {formatTime(when)}
                            {index === 0 && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 11,
                                  letterSpacing: '0.06em',
                                  color: COLORS.gold,
                                  border: `1px solid ${COLORS.goldSoft}`,
                                  borderRadius: 4,
                                  padding: '1px 6px'
                                }}
                              >
                                PREVIOUS
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.faint, marginTop: 3 }}>
                            {timeAgo(when)}
                            {version.studioInfo?.name ? ` · ${version.studioInfo.name}` : ''}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handlePreview(version.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.12)',
                              color: COLORS.muted,
                              borderRadius: 8,
                              padding: '7px 13px',
                              fontSize: 12.5,
                              cursor: 'pointer'
                            }}
                          >
                            {isPreviewing ? 'Close' : 'Preview'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRevert(version)}
                            disabled={busyId !== null}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(201,169,98,0.45)',
                              color: COLORS.gold,
                              borderRadius: 8,
                              padding: '7px 13px',
                              fontSize: 12.5,
                              cursor: busyId !== null ? 'default' : 'pointer',
                              opacity: busyId !== null && !isBusy ? 0.5 : 1
                            }}
                          >
                            {isBusy ? 'Restoring…' : 'Restore'}
                          </button>
                        </div>
                      </div>

                      {isPreviewing && (
                        <div
                          style={{
                            marginTop: 12,
                            background: '#0f0f11',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 8,
                            padding: 14
                          }}
                        >
                          {previewLoading && (
                            <p style={{ color: COLORS.muted, fontSize: 13, margin: 0 }}>
                              Reading version…
                            </p>
                          )}

                          {!previewLoading && preview && (
                            <>
                              <div
                                style={{
                                  fontSize: 11,
                                  letterSpacing: '0.08em',
                                  color: COLORS.gold,
                                  marginBottom: 10
                                }}
                              >
                                WHAT THIS VERSION CONTAINS
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                                  gap: '6px 18px',
                                  marginBottom: 14
                                }}
                              >
                                {summarise(preview).map(row => (
                                  <div key={row.label} style={{ fontSize: 12.5 }}>
                                    <span style={{ color: COLORS.faint }}>{row.label}: </span>
                                    <span style={{ color: COLORS.text }}>{row.value}</span>
                                  </div>
                                ))}
                              </div>

                              {published ? (
                                <ChangesList changes={changedKeys(published, preview)} />
                              ) : (
                                <p style={{ color: COLORS.faint, fontSize: 12.5, margin: 0 }}>
                                  Live version not loaded, so a comparison is not available.
                                </p>
                              )}
                            </>
                          )}

                          {!previewLoading && !preview && (
                            <p style={{ color: COLORS.muted, fontSize: 13, margin: 0 }}>
                              That version could not be read.
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {notice && (
              <p
                style={{
                  color: COLORS.gold,
                  fontSize: 13,
                  margin: '14px 0 0',
                  borderTop: `1px solid ${COLORS.border}`,
                  paddingTop: 12
                }}
              >
                {notice}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function ChangesList({ changes }) {
  if (!changes.length) {
    return (
      <p style={{ color: COLORS.faint, fontSize: 12.5, margin: 0 }}>
        This version is identical to what is live now.
      </p>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 8 }}>
        Differs from the live version in {changes.length} section{changes.length === 1 ? '' : 's'}:
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {changes.map(key => (
          <span
            key={key}
            style={{
              fontSize: 11.5,
              color: COLORS.gold,
              background: COLORS.goldSoft,
              borderRadius: 4,
              padding: '3px 8px'
            }}
          >
            {key}
          </span>
        ))}
      </div>
    </div>
  )
}

export default VersionHistory
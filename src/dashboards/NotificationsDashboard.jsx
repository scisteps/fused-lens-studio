// src/dashboards/NotificationsDashboard.jsx
//
// Manages the bell menu on the public site.
//
// A notification is a title, a subtitle, a square image and a destination. The
// destination is chosen from a fixed set of kinds (an article, the news and
// events page, or the sign-in page) so a link can never point somewhere
// arbitrary - see data/notifications.js.
//
// Like the other collection dashboards it keeps a working draft in
// localStorage, tracks it against the published snapshot, and only writes to
// Firestore when you press Publish.

import { useState, useRef, useEffect } from 'react'
import { useCollection } from '../lib/useCollection'
import { useCollectionDraft } from '../lib/useCollectionDraft'
import { uploadImage } from '../lib/imageUpload'
import { imageOptions, resolveImage } from '../data/images'
import {
  NOTIFICATION_IMAGE_SIZE,
  NOTIFICATION_IMAGE_UPLOAD_SIZE,
  NOTIFICATION_TYPES,
  DEFAULT_NOTIFICATIONS,
  notificationHref,
  notificationNeedsAuth
} from '../data/notifications'
import {
  DashboardHeader,
  DashboardNav,
  Field,
  PublishBar,
  TextArea,
  TextInput,
  inputStyle
} from '../lib/ui'

const COLLECTION_PATH = 'notifications'
const STORAGE_KEY = 'notifications'

// Bump when DEFAULT_NOTIFICATIONS changes, so an older stored draft is offered
// the new seed instead of silently keeping stale copy.
const COLLECTION_VERSION = 1

const emptyDraft = {
  title: '',
  subtitle: '',
  imageId: imageOptions[0].id,
  imageUrl: '',
  type: 'article',
  articleId: ''
}

const pageStyle = {
  minHeight: '100vh',
  background: '#0c0c0e',
  color: '#f2f0ec',
  fontFamily: 'Outfit, system-ui, sans-serif'
}

const cardStyle = {
  background: '#141417',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 10,
  padding: 16,
  marginBottom: 12
}

const listRowStyle = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  background: '#141417',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 10,
  padding: 12,
  marginBottom: 8
}

const primaryButtonStyle = {
  flex: 1,
  background: '#c9a962',
  border: 'none',
  color: '#0c0c0e',
  fontWeight: 600,
  borderRadius: 8,
  padding: '10px 16px',
  fontSize: 14,
  cursor: 'pointer'
}

const smallButtonStyle = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,.12)',
  color: '#f2f0ec',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 12,
  cursor: 'pointer'
}

// The exact tile the bell menu renders, square crop included, so the admin sees
// the real thing rather than a differently-shaped stand-in.
function Thumb({ notification, size = NOTIFICATION_IMAGE_SIZE }) {
  const src = resolveImage(notification.imageId) || notification.imageUrl
  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        background: '#1f1f1f',
        border: '1px solid rgba(255,255,255,.14)',
        display: 'block'
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : null}
    </span>
  )
}

export default function NotificationsDashboard() {
  const { items, setItems, isDirty, status, lastLocalSave, publish, restoreLastPublished } =
    useCollectionDraft(COLLECTION_PATH, STORAGE_KEY, DEFAULT_NOTIFICATIONS)

  // The live list, so the "which story?" picker only offers stories that
  // actually exist. If Firestore is unreachable the picker stays empty rather
  // than offering broken links.
  const { items: publishedNews } = useCollection('newsEvents')

  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const formRef = useRef(null)

  const update = (field, value) =>
    setDraft(current => ({ ...current, [field]: value }))

  const cancel = () => {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  const save = () => {
    if (!draft.title.trim()) return
    // An article notification with no story chosen would resolve to nowhere,
    // so it is refused here rather than published as a dead entry.
    if (draft.type === 'article' && !draft.articleId) return

    if (editingId) {
      setItems(current =>
        current.map(item =>
          item.id === editingId
            ? { ...item, ...draft, __v: COLLECTION_VERSION }
            : item
        )
      )
    } else {
      const id =
        draft.title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `notification-${Date.now()}`
      setItems(current => [{ id, ...draft, __v: COLLECTION_VERSION }, ...current])
    }
    cancel()
  }

  const startEdit = notification => {
    setEditingId(notification.id)
    setDraft({ ...emptyDraft, ...notification })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const remove = id => {
    if (!window.confirm('Remove this notification?')) return
    setItems(current => current.filter(item => item.id !== id))
    if (editingId === id) cancel()
  }

  const move = (index, delta) => {
    setItems(current => {
      const next = [...current]
      const target = index + delta
      if (target < 0 || target >= next.length) return current
      const swap = next[index]
      next[index] = next[target]
      next[target] = swap
      return next
    })
  }

  // Re-seed from DEFAULT_NOTIFICATIONS when the stored collection predates the
  // current version. Asks first, so real edits are never discarded.
  useEffect(() => {
    setItems(current => {
      const storedVersion = current?.[0]?.__v ?? 0
      if (storedVersion === COLLECTION_VERSION) return current
      const hasRealEdits = Array.isArray(current) && current.length > 0
      if (hasRealEdits && typeof window !== 'undefined') {
        const ok = window.confirm(
          'New default notifications are available. Replace the current list with the defaults?'
        )
        if (!ok) return current
      }
      return DEFAULT_NOTIFICATIONS.map(item => ({
        ...item,
        __v: COLLECTION_VERSION
      }))
    })
  }, [setItems])

  const handleUpload = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'notifications')
      // The library id is cleared: a Storage upload takes precedence, and
      // leaving both set would be ambiguous.
      setDraft(current => ({ ...current, imageUrl: url, imageId: '' }))
    } catch (error) {
      console.error('Notification image upload failed', error)
      window.alert('That image could not be uploaded. Try another file.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const typeInfo = NOTIFICATION_TYPES.find(t => t.id === draft.type)
  const missingStory = draft.type === 'article' && !draft.articleId


  return (
    <div style={pageStyle}>
      <DashboardHeader eyebrow="ANIMATION GUILD UGANDA" title="Notifications">
        <PublishBar
          isDirty={isDirty}
          status={status}
          lastLocalSave={lastLocalSave}
          onPublish={publish}
          onRestore={restoreLastPublished}
        />
      </DashboardHeader>

      <DashboardNav current="/admin/notifications" />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 28px 80px' }}>
        <p style={{ color: '#9a978f', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 24px' }}>
          Notifications appear in the bell menu for everyone. Each one shows a
          title, a subtitle and a square {NOTIFICATION_IMAGE_SIZE}px image. A
          story link is members only, so a signed-out visitor is sent to sign
          in and brought straight back to the story.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 330px',
            gap: 32,
            alignItems: 'start'
          }}
        >
          <div>
            <div ref={formRef} style={cardStyle}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, margin: '0 0 16px' }}>
                {editingId ? 'Edit notification' : 'New notification'}
              </h2>

              <Field label="Title">
                <TextInput
                  value={draft.title}
                  onChange={e => update('title', e.target.value)}
                  placeholder="The Grand Launch is here"
                />
              </Field>

              <Field label="Subtitle">
                <TextArea
                  value={draft.subtitle}
                  onChange={e => update('subtitle', e.target.value)}
                  placeholder="One short line under the title."
                  style={{ minHeight: 60 }}
                />
              </Field>

              <Field label="Destination">
                <select
                  value={draft.type}
                  onChange={e => update('type', e.target.value)}
                  style={inputStyle}
                >
                  {NOTIFICATION_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', fontSize: 12, color: '#75726a', marginTop: 6 }}>
                  {typeInfo?.hint}
                </span>
              </Field>


              {draft.type === 'article' && (
                <Field label="Which story?">
                  <select
                    value={draft.articleId}
                    onChange={e => update('articleId', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Choose a story</option>
                    {publishedNews.map(news => (
                      <option key={news.id} value={news.id}>
                        {news.title}
                      </option>
                    ))}
                  </select>
                  {publishedNews.length === 0 && (
                    <span style={{ display: 'block', fontSize: 12, color: '#c98a8a', marginTop: 6 }}>
                      No published stories found. Publish some in News and Events
                      first, or pick a different destination.
                    </span>
                  )}
                </Field>
              )}

              <Field label={'Image (square, shown at ' + NOTIFICATION_IMAGE_SIZE + 'px)'}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Thumb notification={draft} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <select
                      value={draft.imageId}
                      onChange={e => update('imageId', e.target.value)}
                      style={{ ...inputStyle, marginBottom: 8 }}
                    >
                      <option value="">No image</option>
                      {imageOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label style={{ display: 'block', fontSize: 12.5, color: '#9a978f' }}>
                      or upload one (square works best, about{' '}
                      {NOTIFICATION_IMAGE_UPLOAD_SIZE}px)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                        style={{ display: 'block', marginTop: 6, fontSize: 12.5 }}
                      />
                    </label>
                    {uploading && (
                      <span style={{ fontSize: 12, color: '#c9a962' }}>Uploading...</span>
                    )}
                    {draft.imageUrl && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: 11.5,
                          color: '#75726a',
                          marginTop: 6,
                          wordBreak: 'break-all'
                        }}
                      >
                        Uploaded: {draft.imageUrl}
                      </span>
                    )}
                  </div>
                </div>
              </Field>

              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <button onClick={save} style={primaryButtonStyle}>
                  {editingId ? 'Save changes' : 'Add notification'}
                </button>
                {editingId && (
                  <button
                    onClick={cancel}
                    style={{ ...smallButtonStyle, padding: '10px 14px', color: '#9a978f' }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {missingStory && (
                <p style={{ fontSize: 12.5, color: '#c98a8a', margin: '10px 0 0' }}>
                  Choose a story before adding this one. Without it the entry has
                  nowhere to point.
                </p>
              )}
            </div>


            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, margin: '30px 0 12px' }}>
              In the bell menu ({items.length})
            </h2>

            {items.length === 0 && (
              <p style={{ color: '#9a978f', fontSize: 13.5 }}>
                Nothing yet. The bell will say &quot;Nothing new right now&quot;.
              </p>
            )}

            {items.map((item, index) => {
              const href = notificationHref(item)
              const type = NOTIFICATION_TYPES.find(t => t.id === item.type)
              return (
                <div key={item.id} style={listRowStyle}>
                  <Thumb notification={item} size={64} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 15 }}>{item.title}</strong>
                    <div style={{ color: '#c9a962', fontSize: 12.5, margin: '3px 0' }}>
                      {type?.label || item.type}
                      {notificationNeedsAuth(item) ? ' - members only' : ''}
                    </div>
                    <div style={{ color: '#9a978f', fontSize: 13, lineHeight: 1.5 }}>
                      {item.subtitle}
                    </div>
                    <div
                      style={{
                        color: '#75726a',
                        fontSize: 11.5,
                        marginTop: 4,
                        wordBreak: 'break-all'
                      }}
                    >
                      {href || 'No destination chosen - this entry will not open'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                    <button
                      onClick={() => move(index, -1)}
                      style={smallButtonStyle}
                      aria-label="Move up"
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      style={smallButtonStyle}
                      aria-label="Move down"
                      disabled={index === items.length - 1}
                    >
                      ↓
                    </button>
                    <button onClick={() => startEdit(item)} style={smallButtonStyle}>
                      Edit
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      style={{ ...smallButtonStyle, color: '#c98a8a' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>


          <aside
            style={{
              position: 'sticky',
              top: 20,
              border: '7px solid #252529',
              borderRadius: 18,
              overflow: 'hidden',
              background: '#0a0a0a',
              boxShadow: '0 16px 45px rgba(0,0,0,.35)'
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                background: '#252529',
                color: '#9a978f',
                fontSize: 11,
                letterSpacing: '.08em'
              }}
            >
              BELL MENU PREVIEW
            </div>
            <div style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid rgba(255,255,255,.08)',
                  color: '#9a978f',
                  fontSize: 12,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase'
                }}
              >
                Notifications
              </div>

              {items.length === 0 ? (
                <p style={{ padding: 20, textAlign: 'center', color: '#6b6b6b', fontSize: 13 }}>
                  Nothing new right now.
                </p>
              ) : (
                items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      padding: 13,
                      borderBottom: '1px solid rgba(255,255,255,.06)'
                    }}
                  >
                    <Thumb notification={item} size={NOTIFICATION_IMAGE_SIZE} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#f2f0ec',
                          lineHeight: 1.3
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#9a978f',
                          lineHeight: 1.45,
                          marginTop: 3
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}


import { useState, useRef, useEffect } from 'react'
import { useCollectionDraft } from '../lib/useCollectionDraft'
import { uploadImage } from '../lib/imageUpload'
import { imageOptions, resolveImage } from '../data/images'
import { Field, TextInput, TextArea, DashboardHeader, PublishBar, inputStyle } from '../lib/ui'

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap'
const COLLECTION_PATH = 'newsEvents'
const STORAGE_KEY = 'news-events'

// Bump this whenever DEFAULT_ITEMS changes.
const COLLECTION_VERSION = 2

const CATEGORIES = [
  { id: 'event', label: 'Event' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'news', label: 'News' },
  { id: 'showcase', label: 'Showcase' }
]

const DEFAULT_ITEMS = [
  { id: 'inaugural-meeting', title: 'Animation Guild Uganda Inaugural Meeting', date: '2026-08-13', category: 'event', description: 'Unveiling of the draft constitution and interim leadership nominations.', images: [{ imageId: 'uff', alt: 'Inaugural meeting' }], location: 'Kampala, Uganda' },
  { id: 'mobile-animation-workshop-2026', title: 'Mobile Animation Workshop 2026', date: '2026-02-10', category: 'workshop', description: 'Learn how to create animations using mobile devices.', images: [{ imageId: 'agu4', alt: 'Mobile animation workshop' }], location: 'Online' },
  { id: 'uff-2026', title: 'Uganda Film Festival 2026', date: '2026-09-05', category: 'event', description: 'Guild representation on stage to present industry awards and cement national visibility.', images: [{ imageId: 'uff', alt: 'Uganda Film Festival' }], location: 'Kampala, Uganda' },
  { id: 'grand-launch', title: 'Animation Guild Uganda Grand Launch', date: '2026-09-15', category: 'event', description: 'Official launch with sponsors, international guests, academic institutions and the wider East African creative community.', images: [{ imageId: 'agu4', alt: 'Grand launch' }], location: 'Kampala, Uganda' }
]

const emptyDraft = { title: '', date: '', category: 'event', description: '', location: '', images: [] }

export default function NewsEventsDashboard() {
  const { items, setItems, isDirty, status, lastLocalSave, publish, restoreLastPublished } =
    useCollectionDraft(COLLECTION_PATH, STORAGE_KEY, DEFAULT_ITEMS)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [libraryImageId, setLibraryImageId] = useState(imageOptions[0].id)
  const formRef = useRef(null)

  // Re-seed from DEFAULT_ITEMS when the stored collection predates the current
  // version. Stored items get a sentinel `__v` on their way in, so this effect
  // only fires once per version bump.
  useEffect(() => {
    setItems(current => {
      const storedVersion = current?.[0]?.__v ?? 1
      if (storedVersion === COLLECTION_VERSION) return current
      return DEFAULT_ITEMS.map(item => ({ ...item, __v: COLLECTION_VERSION }))
    })
  }, [setItems])

  const startEdit = (item) => {
    setEditingId(item.id)
    setDraft({ title: item.title, date: item.date, category: item.category, description: item.description, location: item.location, images: item.images || [] })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const cancelEdit = () => { setEditingId(null); setDraft(emptyDraft) }

  const saveDraft = () => {
    if (!draft.title.trim()) return
    if (editingId) {
      setItems(prev => prev.map(it => it.id === editingId ? { ...it, ...draft, __v: COLLECTION_VERSION } : it))
    } else {
      const id = draft.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `entry-${Date.now()}`
      setItems(prev => [{ id, ...draft, __v: COLLECTION_VERSION }, ...prev])
    }
    cancelEdit()
  }

  const removeItem = (id) => {
    if (!window.confirm('Delete this entry?')) return
    setItems(prev => prev.filter(it => it.id !== id))
    if (editingId === id) cancelEdit()
  }

  const handleFilesSelected = async (fileList) => {
    setUploading(true)
    try {
      const files = Array.from(fileList)
      const uploaded = await Promise.all(files.map(async f => ({ url: await uploadImage(f), alt: f.name })))
      setDraft(d => ({ ...d, images: [...d.images, ...uploaded] }))
    } catch (e) {
      console.error('Image upload failed', e)
      window.alert('One or more images failed to upload. Check your Firebase Storage rules/config.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (idx) => setDraft(d => ({ ...d, images: d.images.filter((_, i) => i !== idx) }))
  const addLibraryImage = () => {
    const image = imageOptions.find(option => option.id === libraryImageId)
    if (image) setDraft(current => ({ ...current, images: [...current.images, { imageId: image.id, alt: image.label }] }))
  }
  const moveImage = (idx, dir) => setDraft(d => {
    const next = [...d.images]
    const target = idx + dir
    if (target < 0 || target >= next.length) return d
    ;[next[idx], next[target]] = [next[target], next[idx]]
    return { ...d, images: next }
  })

  const filtered = items
    .filter(it => filter === 'all' || it.category === filter)
    .filter(it => !search.trim() || (it.title + it.description + it.location).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0c0c0e', minHeight: '100vh', color: '#f2f0ec' }}>
      <style>{`@import url('${FONT_LINK}');
        .news-dashboard__layout { max-width: 1380px; margin: 0 auto; padding: 28px 28px 80px; display: grid; grid-template-columns: 340px minmax(0, 1fr) 320px; gap: 28px; }
        .news-dashboard__preview { position: sticky; top: 20px; height: fit-content; }
        @media (max-width: 1200px) { .news-dashboard__layout { max-width: 1000px; grid-template-columns: 340px minmax(0, 1fr); } .news-dashboard__preview { display: none; } }
        @media (max-width: 760px) { .news-dashboard__layout { display: block; } .news-dashboard__layout > div:first-child { position: static !important; margin-bottom: 24px; } }
      `}</style>

      <DashboardHeader eyebrow="ANIMATION GUILD UGANDA" title="News & events">
        <PublishBar isDirty={isDirty} status={status} lastLocalSave={lastLocalSave} onPublish={publish} onRestore={restoreLastPublished} />
      </DashboardHeader>

      <div className="news-dashboard__layout">
        <div ref={formRef} style={{ background: '#141417', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, height: 'fit-content', position: 'sticky', top: 20 }}>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, margin: '0 0 16px' }}>{editingId ? 'Edit entry' : 'Add new entry'}</h3>
          <Field label="Title"><TextInput value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Animation Workshop 2026" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Field label="Date"><TextInput type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} /></Field>
            <Field label="Category">
              <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description"><TextArea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></Field>
          <Field label="Location"><TextInput value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} placeholder="e.g. Kampala, Uganda or Online" /></Field>

          <Field label={`Images (${draft.images.length}) — 1 shows as a single photo, 2+ shows as a carousel`}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <select value={libraryImageId} onChange={event => setLibraryImageId(event.target.value)} style={{ ...inputStyle, flex: 1 }}>
                {imageOptions.map(image => <option key={image.id} value={image.id}>{image.label}</option>)}
              </select>
              <button type="button" onClick={addLibraryImage} style={{ background: '#c9a962', border: 'none', color: '#0c0c0e', borderRadius: 7, padding: '0 11px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </div>
            <input type="file" accept="image/*" multiple disabled={uploading}
              onChange={e => { if (e.target.files.length) handleFilesSelected(e.target.files); e.target.value = '' }}
              style={{ fontSize: 13, color: '#9a978f' }} />
          </Field>
          {uploading && <p style={{ fontSize: 12.5, color: '#c9a962', marginTop: -8 }}>Uploading…</p>}

          {draft.images.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {draft.images.map((img, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 6 }}>
                  <img src={resolveImage(img.imageId) || img.url} alt={img.alt} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#9a978f', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.alt}</span>
                  <button onClick={() => moveImage(i, -1)} disabled={i === 0} style={miniBtnStyle}>↑</button>
                  <button onClick={() => moveImage(i, 1)} disabled={i === draft.images.length - 1} style={miniBtnStyle}>↓</button>
                  <button onClick={() => removeImage(i)} style={{ ...miniBtnStyle, color: '#c98a8a' }}>×</button>
                </div>
              ))}
            </div>
          )}

         <div style={{ display: 'flex', gap: 10 }}>
  <button
    onClick={saveDraft}
    style={{
      flex: 1,
      background: '#c9a962',
      border: 'none',
      color: '#0c0c0e',
      fontWeight: 600,
      borderRadius: 8,
      padding: '10px 16px',
      fontSize: 13.5,
      cursor: 'pointer'
    }}
  >
    {editingId ? 'Save changes' : 'Add entry'}
  </button>

  {editingId && (
    <button
      onClick={cancelEdit}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.12)',
        color: '#9a978f',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13.5,
        cursor: 'pointer'
      }}
    >
      Cancel
    </button>
  )}
</div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <TextInput placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 240 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', ...CATEGORIES.map(c => c.id)].map(id => (
                <button key={id} onClick={() => setFilter(id)}
                  style={{
                    padding: '7px 14px', borderRadius: 50, fontSize: 12.5, cursor: 'pointer',
                    background: filter === id ? '#c9a962' : 'transparent',
                    color: filter === id ? '#0c0c0e' : '#9a978f',
                    border: filter === id ? '1px solid #c9a962' : '1px solid rgba(255,255,255,0.1)',
                    fontWeight: filter === id ? 600 : 400, textTransform: 'capitalize'
                  }}>
                  {id === 'all' ? 'All' : CATEGORIES.find(c => c.id === id).label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 12.5, color: '#75726a', marginBottom: 10 }}>{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</div>

          {filtered.map(item => (
            <div key={item.id} style={{ background: '#141417', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 16, marginBottom: 12, display: 'flex', gap: 14 }}>
              {item.images?.[0] && (
                <img src={resolveImage(item.images[0].imageId) || item.images[0].url} alt={item.images[0].alt} style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#c9a962', border: '1px solid rgba(201,169,98,0.35)', borderRadius: 50, padding: '2px 9px', textTransform: 'capitalize' }}>
                      {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                    </span>
                    <span style={{ fontSize: 12, color: '#75726a' }}>{item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}</span>
                    {item.images?.length > 1 && <span style={{ fontSize: 11, color: '#75726a' }}>· {item.images.length} photos (carousel)</span>}
                  </div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16.5, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ color: '#9a978f', fontSize: 13.5, marginBottom: 6, lineHeight: 1.5 }}>{item.description}</div>
                  {item.location && <div style={{ color: '#75726a', fontSize: 12.5 }}>📍 {item.location}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(item)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#f2f0ec', borderRadius: 6, padding: '6px 12px', fontSize: 12.5, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#c98a8a', borderRadius: 6, padding: '6px 12px', fontSize: 12.5, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <NewsLivePreview items={items} />
      </div>
    </div>
  )
}

const miniBtnStyle = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#9a978f',
  borderRadius: 4, width: 24, height: 24, fontSize: 12, cursor: 'pointer', flexShrink: 0
}

function NewsLivePreview({ items }) {
  return (
    <aside className="news-dashboard__preview" aria-label="Live News and Events preview">
      <div style={{ fontSize: 11, color: '#c9a962', letterSpacing: '.08em', marginBottom: 8 }}>DESKTOP LIVE PREVIEW</div>
      <div style={{ border: '7px solid #252529', borderRadius: 18, overflow: 'hidden', background: '#111114', boxShadow: '0 16px 45px rgba(0,0,0,.35)' }}>
        <div style={{ height: 18, background: '#252529', display: 'flex', gap: 4, padding: '6px 8px' }}><i style={previewDot} /><i style={previewDot} /><i style={previewDot} /></div>
        <div style={{ maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}>
          <div style={{ padding: '21px 15px', background: 'linear-gradient(135deg, #1d1b21, #101014)', color: '#fff' }}><div style={{ color: '#d5b76d', fontSize: 9, letterSpacing: '.08em' }}>ANIMATION GUILD UGANDA</div><strong style={{ display: 'block', fontSize: 21, marginTop: 7 }}>News & Events</strong></div>
          <div style={{ padding: 12, display: 'grid', gap: 10 }}>
            {items.slice(0, 5).map(item => {
              const image = item.images?.[0]
              return <article key={item.id} style={{ background: '#1a1a1f', borderRadius: 6, overflow: 'hidden', color: '#f2f0ec' }}>
                {image && <img src={resolveImage(image.imageId) || image.url} alt={image.alt || item.title} style={{ width: '100%', height: 84, display: 'block', objectFit: 'cover' }} />}
                <div style={{ padding: 9 }}><span style={{ fontSize: 8, color: '#d5b76d', textTransform: 'uppercase' }}>{item.category}</span><strong style={{ display: 'block', fontSize: 12, margin: '3px 0' }}>{item.title}</strong><span style={{ fontSize: 9, color: '#9a978f' }}>{item.images?.length > 1 ? `${item.images.length} images - carousel` : 'Single image'}</span></div>
              </article>
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}

const previewDot = { width: 5, height: 5, borderRadius: '50%', background: '#666', display: 'block' }
import { useRef, useState, useEffect } from 'react'
import { imageOptions, resolveImage } from '../data/images'
import { useCollectionDraft } from '../lib/useCollectionDraft'
import { DashboardHeader, Field, PublishBar, TextArea, TextInput, inputStyle } from '../lib/ui'

// Bump this whenever DEFAULT_MEMBERS changes.
const MEMBERS_VERSION = 2

const DEFAULT_MEMBERS = [
  { id: 'chairperson',           name: 'Raymond Malinga',     role: 'Chairperson',         expertise: 'Leadership, Strategy',   joined: '2026-08-13', imageId: 'denis1', bio: 'Presides over meetings and provides strategic direction (Article 7.1).',           __v: MEMBERS_VERSION },
  { id: 'vice-chairperson',      name: 'Vijay Joseph',        role: 'Vice-Chairperson',    expertise: 'Leadership, Operations', joined: '2026-08-13', imageId: 'agu3',   bio: 'Assists the Chairperson and acts in their absence (Article 7.2).',                       __v: MEMBERS_VERSION },
  { id: 'secretary',             name: 'Secretary',           role: 'Secretary',           expertise: 'Records, Correspondence', joined: '2026-08-13', imageId: 'jagwe',  bio: 'Manages minutes, membership register and official documents (Article 7.3).',             __v: MEMBERS_VERSION },
  { id: 'assistant-secretary',   name: 'Assistant Secretary', role: 'Assistant Secretary', expertise: 'Records, Administration', joined: '2026-08-13', imageId: 'denis1', bio: 'Assists the Secretary and acts in their absence (Article 7.4).',                          __v: MEMBERS_VERSION },
  { id: 'treasurer',             name: 'Treasurer',           role: 'Treasurer',           expertise: 'Finance, Accounting',     joined: '2026-08-13', imageId: 'agu3',   bio: 'Accounts for Guild funds and presents financial statements (Article 7.5).',               __v: MEMBERS_VERSION },
  { id: 'assistant-treasurer',   name: 'Assistant Treasurer', role: 'Assistant Treasurer', expertise: 'Finance, Bookkeeping',    joined: '2026-08-13', imageId: 'jagwe',  bio: 'Assists the Treasurer and acts in their absence (Article 7.6).',                          __v: MEMBERS_VERSION }
]

const emptyMember = { name: '', role: '', expertise: '', joined: '', imageId: 'denis1', bio: '', __v: MEMBERS_VERSION }

export default function MembersDashboard() {
  const { items, setItems, isDirty, status, lastLocalSave, publish, restoreLastPublished } = useCollectionDraft('members', 'members', DEFAULT_MEMBERS)
  const [draft, setDraft] = useState(emptyMember)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const formRef = useRef(null)
  const update = (field, value) => setDraft(current => ({ ...current, [field]: value }))
  const startEdit = member => { setEditingId(member.id); setDraft({ ...emptyMember, ...member }); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const cancel = () => { setEditingId(null); setDraft(emptyMember) }
  const save = () => {
    if (!draft.name.trim()) return
    if (editingId) setItems(current => current.map(member => member.id === editingId ? { ...member, ...draft, __v: MEMBERS_VERSION } : member))
    else {
      const id = draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `member-${Date.now()}`
      setItems(current => [{ id, ...draft, __v: MEMBERS_VERSION }, ...current])
    }
    cancel()
  }
  const remove = id => {
    if (!window.confirm('Remove this member?')) return
    setItems(current => current.filter(member => member.id !== id))
    if (editingId === id) cancel()
  }

  // Re-seed from DEFAULT_MEMBERS when stored version is behind.
  useEffect(() => {
    setItems(current => {
      const storedVersion = current?.[0]?.__v ?? 1
      if (storedVersion === MEMBERS_VERSION) return current
      return DEFAULT_MEMBERS
    })
  }, [setItems])

  const filtered = items.filter(member => `${member.name} ${member.role} ${member.expertise}`.toLowerCase().includes(search.toLowerCase()))

  return <div style={pageStyle}>
    <style>{`.members-dashboard__layout { max-width: 1380px; margin: 0 auto; padding: 28px 28px 80px; display: grid; grid-template-columns: 340px minmax(0, 1fr) 320px; gap: 28px; } .members-dashboard__preview { position: sticky; top: 20px; height: fit-content; } @media (max-width: 1200px) { .members-dashboard__layout { max-width: 1000px; grid-template-columns: 340px minmax(0, 1fr); } .members-dashboard__preview { display: none; } } @media (max-width: 760px) { .members-dashboard__layout { display: block; } .members-dashboard__form { position: static !important; margin-bottom: 24px; } }`}</style>
    <DashboardHeader eyebrow="ANIMATION GUILD UGANDA" title="Members"><PublishBar isDirty={isDirty} status={status} lastLocalSave={lastLocalSave} onPublish={publish} onRestore={restoreLastPublished} /></DashboardHeader>
    <main className="members-dashboard__layout">
      <section ref={formRef} className="members-dashboard__form" style={formStyle}>
        <h2 style={formTitleStyle}>{editingId ? 'Edit member' : 'Add member'}</h2>
        <Field label="Full name"><TextInput value={draft.name} onChange={event => update('name', event.target.value)} /></Field>
        <Field label="Role"><TextInput value={draft.role} onChange={event => update('role', event.target.value)} /></Field>
        <Field label="Expertise"><TextInput value={draft.expertise} onChange={event => update('expertise', event.target.value)} placeholder="e.g. 2D Animation, Character Design" /></Field>
        <Field label="Joined"><TextInput type="date" value={draft.joined} onChange={event => update('joined', event.target.value)} /></Field>
        <Field label="Profile image from library"><ImagePicker value={draft.imageId} onChange={value => update('imageId', value)} /></Field>
        <Field label="Bio"><TextArea value={draft.bio} onChange={event => update('bio', event.target.value)} /></Field>
        <div style={{ display: 'flex', gap: 10 }}><button onClick={save} style={primaryButtonStyle}>{editingId ? 'Save changes' : 'Add member'}</button>{editingId && <button onClick={cancel} style={secondaryButtonStyle}>Cancel</button>}</div>
      </section>
      <section>
        <TextInput value={search} onChange={event => setSearch(event.target.value)} placeholder="Search members..." style={{ maxWidth: 280, marginBottom: 16 }} />
        <div style={{ fontSize: 12.5, color: '#75726a', marginBottom: 10 }}>{filtered.length} {filtered.length === 1 ? 'member' : 'members'}</div>
        {filtered.map(member => <article key={member.id} style={memberCardStyle}>
          <img src={resolveImage(member.imageId) || member.image} alt={member.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, background: '#0c0c0e' }} />
          <div style={{ flex: 1, minWidth: 0 }}><strong style={{ fontSize: 16 }}>{member.name}</strong><div style={{ color: '#c9a962', fontSize: 13, margin: '3px 0' }}>{member.role}</div><div style={{ color: '#9a978f', fontSize: 13 }}>{member.expertise}</div></div>
          <div style={{ display: 'grid', gap: 6 }}><button onClick={() => startEdit(member)} style={smallButtonStyle}>Edit</button><button onClick={() => remove(member.id)} style={{ ...smallButtonStyle, color: '#c98a8a' }}>Remove</button></div>
        </article>)}
      </section>
      <MembersPreview members={items} />
    </main>
  </div>
}

function ImagePicker({ value, onChange }) {
  const image = imageOptions.find(option => option.id === value)
  return <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: 10, alignItems: 'center' }}><img src={image?.src} alt="Selected" style={{ width: 58, height: 46, objectFit: 'cover', borderRadius: 6, background: '#0c0c0e' }} /><select value={value} onChange={event => onChange(event.target.value)} style={inputStyle}>{imageOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>
}

function MembersPreview({ members }) {
  return <aside className="members-dashboard__preview"><div style={{ fontSize: 11, color: '#c9a962', letterSpacing: '.08em', marginBottom: 8 }}>DESKTOP LIVE PREVIEW</div><div style={{ border: '7px solid #252529', borderRadius: 18, overflow: 'hidden', background: '#111114', boxShadow: '0 16px 45px rgba(0,0,0,.35)' }}><div style={{ height: 18, background: '#252529' }} /><div style={{ maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}><div style={{ padding: '21px 15px', color: '#fff', background: 'linear-gradient(135deg, #1d1b21, #101014)' }}><span style={{ color: '#d5b76d', fontSize: 9 }}>ANIMATION GUILD UGANDA</span><strong style={{ display: 'block', fontSize: 21, marginTop: 7 }}>Our Members</strong><small>{members.length} members and growing</small></div><div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{members.slice(0, 6).map(member => <div key={member.id} style={{ background: '#1a1a1f', color: '#f2f0ec', borderRadius: 5, overflow: 'hidden' }}><img src={resolveImage(member.imageId) || member.image} alt={member.name} style={{ width: '100%', height: 78, objectFit: 'cover' }} /><div style={{ padding: 7 }}><strong style={{ display: 'block', fontSize: 11 }}>{member.name}</strong><span style={{ color: '#c9a962', fontSize: 9 }}>{member.role}</span></div></div>)}</div></div></div></aside>
}

const pageStyle = { minHeight: '100vh', background: '#0c0c0e', color: '#f2f0ec', fontFamily: 'Inter, system-ui, sans-serif' }
const formStyle = { background: '#141417', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 20, height: 'fit-content', position: 'sticky', top: 20 }
const formTitleStyle = { fontFamily: 'Georgia, serif', fontSize: 18, margin: '0 0 16px' }
const primaryButtonStyle = { flex: 1, background: '#c9a962', border: 'none', color: '#0c0c0e', fontWeight: 600, borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }
const secondaryButtonStyle = { background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: '#9a978f', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }
const smallButtonStyle = { background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: '#f2f0ec', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }
const memberCardStyle = { display: 'flex', gap: 14, alignItems: 'center', background: '#141417', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: 14, marginBottom: 10 }
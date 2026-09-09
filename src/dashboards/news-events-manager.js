import { useState, useEffect, useRef } from 'react';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap';

const CATEGORIES = [
  { id: 'event', label: 'Event' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'news', label: 'News' },
  { id: 'showcase', label: 'Showcase' }
];

const DEFAULT_ITEMS = [
  {
    id: 1,
    title: 'Animation Guild Uganda Inaugural Meeting',
    date: '2026-01-15',
    category: 'event',
    description: 'The first official meeting of the Animation Guild Uganda was held in Kampala.',
    image: '/images/event1.jpg',
    location: 'Kampala, Uganda'
  },
  {
    id: 2,
    title: 'Mobile Animation Workshop 2026',
    date: '2026-02-10',
    category: 'workshop',
    description: 'Learn how to create animations using mobile devices.',
    image: '/images/event2.jpg',
    location: 'Online'
  }
];

const inputStyle = {
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
};
const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: 70, lineHeight: 1.5 };

function TextInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function TextArea(props) { return <textarea {...props} style={textareaStyle} />; }

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 12.5, color: '#9a978f', marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function useDebouncedSave(key, value, ready) {
  const timer = useRef(null);
  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { await window.storage.set(key, JSON.stringify(value), false); } catch (e) { console.error(e); }
    }, 500);
    return () => clearTimeout(timer.current);
  }, [key, value, ready]);
}

const emptyDraft = { title: '', date: '', category: 'event', description: '', image: '', location: '' };

export default function NewsEventsManager() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('agu-news-events', false);
        if (res && res.value) setItems(JSON.parse(res.value));
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  useDebouncedSave('agu-news-events', items, ready);

  useEffect(() => {
    if (!ready) return;
    setSavedFlash(true);
    const t = setTimeout(() => setSavedFlash(false), 900);
    return () => clearTimeout(t);
  }, [items]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft({ title: item.title, date: item.date, category: item.category, description: item.description, image: item.image, location: item.location });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => { setEditingId(null); setDraft(emptyDraft); };

  const saveDraft = () => {
    if (!draft.title.trim()) return;
    if (editingId) {
      setItems(prev => prev.map(it => it.id === editingId ? { ...it, ...draft } : it));
    } else {
      const nextId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
      setItems(prev => [{ id: nextId, ...draft }, ...prev]);
    }
    cancelEdit();
  };

  const removeItem = (id) => {
    if (!window.confirm('Delete this entry?')) return;
    setItems(prev => prev.filter(it => it.id !== id));
    if (editingId === id) cancelEdit();
  };

  const filtered = items
    .filter(it => filter === 'all' || it.category === filter)
    .filter(it => !search.trim() || (it.title + it.description + it.location).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const jsOutput = `export const newsEvents = ${JSON.stringify(items.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')), null, 2)}
`;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0c0c0e', minHeight: '100vh', color: '#f2f0ec' }}>
      <style>{`@import url('${FONT_LINK}');
        ::selection { background: rgba(201,169,98,0.35); }
        input::placeholder, textarea::placeholder { color: #55524b; }
      `}</style>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#c9a962', marginBottom: 4 }}>ANIMATION GUILD UGANDA</div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 26, margin: 0 }}>News &amp; events manager</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12.5, color: savedFlash ? '#c9a962' : '#5b584f', transition: 'color 0.3s' }}>
            {savedFlash ? 'Saved' : 'All changes saved'}
          </span>
          <button onClick={() => setExportOpen(true)} style={{ background: '#c9a962', border: 'none', color: '#0c0c0e', fontWeight: 600, borderRadius: 8, padding: '9px 18px', fontSize: 13.5, cursor: 'pointer' }}>
            Export code
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 28px 80px', display: 'grid', gridTemplateColumns: '340px 1fr', gap: 28 }}>
        {/* Form */}
        <div ref={formRef} style={{ background: '#141417', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, height: 'fit-content', position: 'sticky', top: 20 }}>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, margin: '0 0 16px' }}>
            {editingId ? 'Edit entry' : 'Add new entry'}
          </h3>
          <Field label="Title">
            <TextInput value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Animation Workshop 2026" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Field label="Date">
              <TextInput type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
            </Field>
            <Field label="Category">
              <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <TextArea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="What's happening..." />
          </Field>
          <Field label="Location">
            <TextInput value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} placeholder="e.g. Kampala, Uganda or Online" />
          </Field>
          <Field label="Image path or URL">
            <TextInput value={draft.image} onChange={e => setDraft(d => ({ ...d, image: e.target.value }))} placeholder="/images/event1.jpg" />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={saveDraft} style={{ flex: 1, background: '#c9a962', border: 'none', color: '#0c0c0e', fontWeight: 600, borderRadius: 8, padding: '10px 16px', fontSize: 13.5, cursor: 'pointer' }}>
              {editingId ? 'Save changes' : 'Add entry'}
            </button>
            {editingId && (
              <button onClick={cancelEdit} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#9a978f', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* List */}
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

          {filtered.length === 0 && (
            <div style={{ color: '#75726a', fontSize: 14, padding: '40px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
              No entries match.
            </div>
          )}

          {filtered.map(item => (
            <div key={item.id} style={{ background: '#141417', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#c9a962', border: '1px solid rgba(201,169,98,0.35)', borderRadius: 50, padding: '2px 9px', textTransform: 'capitalize' }}>
                      {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                    </span>
                    <span style={{ fontSize: 12, color: '#75726a' }}>{item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}</span>
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
      </div>

      {exportOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}
          onClick={() => setExportOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#141417', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, maxWidth: 720, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'Fraunces, serif', margin: 0, fontSize: 18 }}>Export news & events data</h3>
              <button onClick={() => setExportOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9a978f', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <p style={{ color: '#9a978f', fontSize: 13, marginTop: 0 }}>Copy this into your data file, or use it as the fallback array in <code>NewsEvents.jsx</code>.</p>
            <textarea readOnly value={jsOutput} style={{ ...textareaStyle, flex: 1, minHeight: 360, fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }} onClick={e => e.target.select()} />
            <button onClick={() => { navigator.clipboard.writeText(jsOutput); }} style={{ marginTop: 12, background: '#c9a962', border: 'none', color: '#0c0c0e', fontWeight: 600, borderRadius: 8, padding: '10px 16px', fontSize: 13.5, cursor: 'pointer' }}>
              Copy to clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

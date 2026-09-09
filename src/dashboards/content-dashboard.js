import { useState, useEffect, useRef } from 'react';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap';

const DEFAULT_DATA = {
  studioInfo: {
    name: 'Animation Guild Uganda',
    tagline: 'Uganda in motion',
    description: 'Building and promoting a sound, sustainable animation industry in Uganda.',
    founded: 2026,
    location: 'Kampala, Uganda',
    address: 'Katoto Studios, Kampala',
    email: 'animationguilduganda@gmail.com',
    phone: '+256 702624936',
    whatsapp: '+256702624936',
    instagram: 'https://www.instagram.com/animationguilduganda',
    facebook: 'https://www.facebook.com/share/1FQfwwTgLd/',
    linkedin: 'https://www.linkedin.com/company/animation-guild-uganda/'
  },
  stats: [
    { value: 750, suffix: '+', label: 'Animators involved' },
    { value: 500, suffix: '+', label: 'Partners' },
    { value: 15, suffix: '', label: 'Awards Won' }
  ],
  timeline: [
    { date: '2026-08-13', title: 'Milestone 1', description: 'Unveiling the draft constitution and conducting interim leadership nominations.' },
    { date: '2026-08-21', title: 'Milestone 2', description: 'Collaborated with leading brands in Kenya.' },
    { date: '2026-09-05', title: 'Milestone 3', description: 'Brand review and logo design competition spearheaded by Mushe Alex.' },
    { date: '2026-09-05', title: 'Milestone 4', description: 'Official representation at the Uganda Film Festival (UFF), featuring guild participation on stage to present industry awards and cement national visibility.' },
    { date: '2026-09-15', title: 'Milestone 5', description: 'The official Grand Launch event, envisioned as a major public gathering involving sponsors, international guests, academic institutions, and the wider East African creative community.' }
  ],
  leadership: [
    { icon: '🎯', title: 'President', description: 'Rayment Malinga.' },
    { icon: '🤝', title: 'Vice President', description: 'Vijay Joseph Jay.' },
    { icon: '📚', title: 'Secretary', description: 'Mushe Alex.' },
    { icon: '🎬', title: 'Vice Secretary', description: 'Sam Nungi.' },
    { icon: '🏆', title: 'Treasurer', description: 'Juliet K Nsiima.' },
    { icon: '📢', title: 'Vice Treasurer', description: 'Kizito Mbuga.' }
  ],
  services: [
    { title: 'Promoting professional development', description: 'Building and promoting a sound, sustainable animation industry in Uganda.', icon: 'Events', features: ['Peer-to-peer sharing', 'Engagement sessions', 'Seminars', 'Highlight films'] },
    { title: 'Supporting animation education', description: 'Supporting animation education.', icon: 'portrait', features: ['Aligning private training methodologies', 'Reviewing the basics'] },
    { title: 'Providing showcase platforms', description: 'Recognizing industry excellence and outstanding achievements.', icon: 'parties', features: ['Festivals', 'Screenings', 'Competitions'] },
    { title: 'Establishing collective representation', description: 'Legitimize animation as a viable career path.', icon: 'event', features: ['Corporate events', 'Advocacy', 'Lawful collective bargaining', 'Legal support for members'] }
  ],
  testimonials: [
    { quote: 'Animation Guild Uganda will provide a step for animators in the industry here.', author: 'Michael', role: 'Director' },
    { quote: 'I think they are doing a good thing.', author: 'James', role: 'Animator' },
    { quote: 'Professional, creative, and incredibly talented. The portraits exceeded all expectations.', author: 'Emma', role: 'Illustrator' }
  ]
};

const SECTIONS = [
  { id: 'studio', label: 'Studio info' },
  { id: 'stats', label: 'Stats' },
  { id: 'timeline', label: 'Roadmap' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'services', label: 'Services' },
  { id: 'testimonials', label: 'Testimonials' }
];

function useDebouncedSave(key, value, ready) {
  const timer = useRef(null);
  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await window.storage.set(key, JSON.stringify(value), false);
      } catch (e) {
        console.error('save failed', e);
      }
    }, 500);
    return () => clearTimeout(timer.current);
  }, [key, value, ready]);
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 12.5, color: '#9a978f', marginBottom: 6, letterSpacing: '0.01em' }}>{label}</span>
      {children}
    </label>
  );
}

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

function TextInput(props) {
  return <input {...props} style={inputStyle} onFocus={e => e.target.style.borderColor = '#c9a962'} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; props.onBlur && props.onBlur(e); }} />;
}
function TextArea(props) {
  return <textarea {...props} style={textareaStyle} onFocus={e => e.target.style.borderColor = '#c9a962'} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; props.onBlur && props.onBlur(e); }} />;
}

function Card({ children, onRemove }) {
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
  );
}

function AddButton({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: '1px dashed rgba(201,169,98,0.4)', color: '#c9a962',
      borderRadius: 8, padding: '10px 16px', fontSize: 13.5, cursor: 'pointer', width: '100%', marginTop: 4
    }}>
      + {children}
    </button>
  );
}

export default function ContentDashboard() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState('studio');
  const [savedFlash, setSavedFlash] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('agu-content-data', false);
        if (res && res.value) setData(JSON.parse(res.value));
      } catch (e) { /* no saved data yet */ }
      setReady(true);
    })();
  }, []);

  useDebouncedSave('agu-content-data', data, ready);

  useEffect(() => {
    if (!ready) return;
    setSavedFlash(true);
    const t = setTimeout(() => setSavedFlash(false), 900);
    return () => clearTimeout(t);
  }, [data]);

  const update = (path, value) => {
    setData(prev => {
      const next = structuredClone(prev);
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const updateArrItem = (key, idx, field, value) => {
    setData(prev => {
      const next = structuredClone(prev);
      next[key][idx][field] = value;
      return next;
    });
  };

  const addItem = (key, template) => {
    setData(prev => ({ ...prev, [key]: [...prev[key], structuredClone(template)] }));
  };

  const removeItem = (key, idx) => {
    setData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };

  const resetAll = async () => {
    if (!window.confirm('Reset all content back to defaults? This cannot be undone.')) return;
    setData(DEFAULT_DATA);
    try { await window.storage.set('agu-content-data', JSON.stringify(DEFAULT_DATA), false); } catch (e) {}
  };

  const jsOutput = buildContentJs(data);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0c0c0e', minHeight: '100vh', color: '#f2f0ec' }}>
      <style>{`@import url('${FONT_LINK}');
        ::selection { background: rgba(201,169,98,0.35); }
        input::placeholder, textarea::placeholder { color: #55524b; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#c9a962', marginBottom: 4 }}>ANIMATION GUILD UGANDA</div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 26, margin: 0 }}>Content dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12.5, color: savedFlash ? '#c9a962' : '#5b584f', transition: 'color 0.3s' }}>
            {savedFlash ? 'Saved' : 'All changes saved'}
          </span>
          <button onClick={() => setExportOpen(true)} style={{ background: '#c9a962', border: 'none', color: '#0c0c0e', fontWeight: 600, borderRadius: 8, padding: '9px 18px', fontSize: 13.5, cursor: 'pointer' }}>
            Export code
          </button>
          <button onClick={resetAll} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#9a978f', borderRadius: 8, padding: '9px 14px', fontSize: 13.5, cursor: 'pointer' }}>
            Reset
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto' }}>
        {/* Sidebar */}
        <div style={{ width: 190, padding: '28px 12px', flexShrink: 0 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 4,
                background: section === s.id ? 'rgba(201,169,98,0.12)' : 'transparent',
                color: section === s.id ? '#c9a962' : '#b5b2ab',
                border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                borderLeft: section === s.id ? '2px solid #c9a962' : '2px solid transparent'
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: '28px 28px 80px', minWidth: 0 }}>
          {section === 'studio' && (
            <div>
              <SectionHeading title="Studio info" desc="Core details shown across the site — footer, contact section, and hero." />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <Field label="Name"><TextInput value={data.studioInfo.name} onChange={e => update(['studioInfo', 'name'], e.target.value)} /></Field>
                <Field label="Tagline"><TextInput value={data.studioInfo.tagline} onChange={e => update(['studioInfo', 'tagline'], e.target.value)} /></Field>
              </div>
              <Field label="Description"><TextArea value={data.studioInfo.description} onChange={e => update(['studioInfo', 'description'], e.target.value)} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <Field label="Founded (year)"><TextInput type="number" value={data.studioInfo.founded} onChange={e => update(['studioInfo', 'founded'], Number(e.target.value))} /></Field>
                <Field label="Location"><TextInput value={data.studioInfo.location} onChange={e => update(['studioInfo', 'location'], e.target.value)} /></Field>
                <Field label="Address"><TextInput value={data.studioInfo.address} onChange={e => update(['studioInfo', 'address'], e.target.value)} /></Field>
                <Field label="Email"><TextInput value={data.studioInfo.email} onChange={e => update(['studioInfo', 'email'], e.target.value)} /></Field>
                <Field label="Phone"><TextInput value={data.studioInfo.phone} onChange={e => update(['studioInfo', 'phone'], e.target.value)} /></Field>
                <Field label="WhatsApp"><TextInput value={data.studioInfo.whatsapp} onChange={e => update(['studioInfo', 'whatsapp'], e.target.value)} /></Field>
                <Field label="Instagram URL"><TextInput value={data.studioInfo.instagram} onChange={e => update(['studioInfo', 'instagram'], e.target.value)} /></Field>
                <Field label="Facebook URL"><TextInput value={data.studioInfo.facebook} onChange={e => update(['studioInfo', 'facebook'], e.target.value)} /></Field>
                <Field label="LinkedIn URL"><TextInput value={data.studioInfo.linkedin} onChange={e => update(['studioInfo', 'linkedin'], e.target.value)} /></Field>
              </div>
            </div>
          )}

          {section === 'stats' && (
            <div>
              <SectionHeading title="Stats" desc="Animated counters shown in the About section." />
              {data.stats.map((s, i) => (
                <Card key={i} onRemove={() => removeItem('stats', i)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0 16px' }}>
                    <Field label="Value"><TextInput type="number" value={s.value} onChange={e => updateArrItem('stats', i, 'value', Number(e.target.value))} /></Field>
                    <Field label="Suffix"><TextInput value={s.suffix} onChange={e => updateArrItem('stats', i, 'suffix', e.target.value)} placeholder="+ or blank" /></Field>
                    <Field label="Label"><TextInput value={s.label} onChange={e => updateArrItem('stats', i, 'label', e.target.value)} /></Field>
                  </div>
                </Card>
              ))}
              <AddButton onClick={() => addItem('stats', { value: 0, suffix: '', label: 'New stat' })}>Add stat</AddButton>
            </div>
          )}

          {section === 'timeline' && (
            <div>
              <SectionHeading title="Roadmap" desc="Milestones shown on the roadmap timeline. Dates use YYYY-MM-DD." />
              {data.timeline.map((t, i) => (
                <Card key={i} onRemove={() => removeItem('timeline', i)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0 16px' }}>
                    <Field label="Date"><TextInput type="date" value={t.date} onChange={e => updateArrItem('timeline', i, 'date', e.target.value)} /></Field>
                    <Field label="Title"><TextInput value={t.title} onChange={e => updateArrItem('timeline', i, 'title', e.target.value)} /></Field>
                  </div>
                  <Field label="Description"><TextArea value={t.description} onChange={e => updateArrItem('timeline', i, 'description', e.target.value)} /></Field>
                </Card>
              ))}
              <AddButton onClick={() => addItem('timeline', { date: '', title: 'New milestone', description: '' })}>Add milestone</AddButton>
            </div>
          )}

          {section === 'leadership' && (
            <div>
              <SectionHeading title="Leadership" desc="Guild leadership shown on the membership section." />
              {data.leadership.map((m, i) => (
                <Card key={i} onRemove={() => removeItem('leadership', i)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 2fr', gap: '0 16px' }}>
                    <Field label="Icon"><TextInput value={m.icon} onChange={e => updateArrItem('leadership', i, 'icon', e.target.value)} /></Field>
                    <Field label="Role"><TextInput value={m.title} onChange={e => updateArrItem('leadership', i, 'title', e.target.value)} /></Field>
                    <Field label="Name"><TextInput value={m.description} onChange={e => updateArrItem('leadership', i, 'description', e.target.value)} /></Field>
                  </div>
                </Card>
              ))}
              <AddButton onClick={() => addItem('leadership', { icon: '⭐', title: 'New role', description: 'Name' })}>Add leadership role</AddButton>
            </div>
          )}

          {section === 'services' && (
            <div>
              <SectionHeading title="Services" desc="What the guild does, shown in the Services section." />
              {data.services.map((s, i) => (
                <Card key={i} onRemove={() => removeItem('services', i)}>
                  <Field label="Title"><TextInput value={s.title} onChange={e => updateArrItem('services', i, 'title', e.target.value)} /></Field>
                  <Field label="Description"><TextArea value={s.description} onChange={e => updateArrItem('services', i, 'description', e.target.value)} /></Field>
                  <Field label="Icon key"><TextInput value={s.icon} onChange={e => updateArrItem('services', i, 'icon', e.target.value)} /></Field>
                  <Field label="Features (one per line)">
                    <TextArea value={s.features.join('\n')} onChange={e => updateArrItem('services', i, 'features', e.target.value.split('\n'))} />
                  </Field>
                </Card>
              ))}
              <AddButton onClick={() => addItem('services', { title: 'New service', description: '', icon: 'event', features: [] })}>Add service</AddButton>
            </div>
          )}

          {section === 'testimonials' && (
            <div>
              <SectionHeading title="Testimonials" desc="Quotes shown on the homepage." />
              {data.testimonials.map((t, i) => (
                <Card key={i} onRemove={() => removeItem('testimonials', i)}>
                  <Field label="Quote"><TextArea value={t.quote} onChange={e => updateArrItem('testimonials', i, 'quote', e.target.value)} /></Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Field label="Author"><TextInput value={t.author} onChange={e => updateArrItem('testimonials', i, 'author', e.target.value)} /></Field>
                    <Field label="Role"><TextInput value={t.role} onChange={e => updateArrItem('testimonials', i, 'role', e.target.value)} /></Field>
                  </div>
                </Card>
              ))}
              <AddButton onClick={() => addItem('testimonials', { quote: '', author: '', role: '' })}>Add testimonial</AddButton>
            </div>
          )}
        </div>
      </div>

      {exportOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}
          onClick={() => setExportOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#141417', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, maxWidth: 720, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'Fraunces, serif', margin: 0, fontSize: 18 }}>Export content.js</h3>
              <button onClick={() => setExportOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9a978f', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <p style={{ color: '#9a978f', fontSize: 13, marginTop: 0 }}>Copy this and paste it over your <code>data/content.js</code> exports.</p>
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

function SectionHeading({ title, desc }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 21, margin: '0 0 6px' }}>{title}</h2>
      <p style={{ color: '#9a978f', fontSize: 13.5, margin: 0 }}>{desc}</p>
    </div>
  );
}

function js(v) { return JSON.stringify(v, null, 2); }

function buildContentJs(data) {
  const s = data.studioInfo;
  return `export const studioInfo = {
  name: ${JSON.stringify(s.name)},
  tagline: ${JSON.stringify(s.tagline)},
  description: ${JSON.stringify(s.description)},
  founded: ${s.founded},
  location: ${JSON.stringify(s.location)},
  address: ${JSON.stringify(s.address)},
  email: ${JSON.stringify(s.email)},
  phone: ${JSON.stringify(s.phone)},
  whatsapp: ${JSON.stringify(s.whatsapp)},
  social: {
    instagram: ${JSON.stringify(s.instagram)},
    facebook: ${JSON.stringify(s.facebook)},
    linkedin: ${JSON.stringify(s.linkedin)}
  }
}

export const stats = ${js(data.stats)}

export const timeline = ${js(data.timeline)}

export const leadership = ${js(data.leadership)}

export const services = ${js(data.services.map((sv, i) => ({ id: i + 1, ...sv })))}

export const testimonials = ${js(data.testimonials.map((t, i) => ({ id: i + 1, ...t })))}
`;
}

import { useEffect, useMemo } from 'react'
import * as staticContent from '../data/content'
import { heroSlides, imageOptions } from '../data/images'
import { useDocumentDraft } from '../lib/useDocumentDraft'
import { AddButton, Card, DashboardHeader, Field, PublishBar, TextArea, TextInput } from '../lib/ui'

// Bump this whenever DEFAULT_CONTENT changes shape or seed values.
const CONTENT_VERSION = 2

const DEFAULT_CONTENT = {
  version: CONTENT_VERSION,
  studioInfo: staticContent.studioInfo,

  about: {
    title: 'We are the Animation Guild Uganda',
    content: `At ${staticContent.studioInfo.name}, we believe every animator should tell a story that resonates deeply with those who view it.`,
    story: 'We, the members of the Animation Guild of Uganda, recognising the importance of animation and the wider digital creative arts sector to Uganda\'s cultural, educational, social and economic development, hereby establish this Constitution to provide a framework for professional development, representation, collaboration, ethical practice and sustainable growth of the animation industry in Uganda.'
  },

  heroSlides,

  aboutImageId: 'agu1',

  visibility: {
    hero: true,
    about: true,
    services: true,
    membership: true,
    roadmap: true,
    contact: true
  },

  stats: staticContent.stats,

  timeline: staticContent.timeline.map((item, index) => ({
    id: item.id || `milestone-${index + 1}`,
    date: String(item.date || item.year || ''),
    title: item.title,
    description: item.description
  })),

  services: staticContent.services,

  membership: {
    title: 'Membership',

    overview:
      'The Animation Guild of Uganda brings together animators, digital artists, studios, students, and other professionals who contribute to or support the animation and wider digital creative arts industry.',

    description:
      'Membership provides access to professional development, mentorship, networking, industry opportunities, events, advocacy, and a platform for collaboration and representation within the animation community.',

    eligibility:
      'Membership is open to individuals and organisations connected with, practising, supporting, or contributing to animation and related digital creative arts in East Africa, including Uganda, Kenya, Tanzania, Rwanda and Burundi.',

  categories: [
  { name: 'Ordinary / Professional Membership', fee: 'UGX 50,000', description: 'Adult animators and creative professionals working in the industry.' },
  { name: 'Student Membership', fee: 'To be determined', description: 'Full-time students in animation or related fields, with proof of status.' },
  { name: 'Studio / Corporate Membership', fee: 'To be determined', description: 'Studios, broadcasters, NGOs, schools and companies supporting animation.' },
  { name: 'Honorary / Patron Membership', fee: 'By invitation', description: 'For those recognised for outstanding contribution to the craft.' },
  { name: 'International / Associate Membership', fee: 'To be determined', description: 'For members based outside Uganda who support the Guild\'s mission.' }
]

    ,benefits: [
      'Participate in Guild programmes, workshops, seminars and industry activities.',
      'Access professional development, mentorship and peer-to-peer learning.',
      'Participate in networking, exhibitions, screenings, competitions and festivals.',
      'Access professional opportunities and referral networks.',
      'Participate in Guild representation and advocacy for members’ professional interests.',
      'Receive information concerning Guild activities and finances as provided by the Constitution.',
      'Stand for eligible Guild positions and vote where the membership has voting rights.'
    ]
  }
}

const pageStyle = {
  minHeight: '100vh',
  background: '#0c0c0e',
  color: '#f2f0ec',
  fontFamily: 'Inter, system-ui, sans-serif'
}

export default function ContentDashboard() {
  const {
    data,
    setData,
    isDirty,
    status,
    lastLocalSave,
    publish,
    restoreLastPublished
  } = useDocumentDraft('siteContent/main', 'site-content', DEFAULT_CONTENT)

  // Re-seed from DEFAULT_CONTENT when the stored draft predates the current
  // schema version.
  useEffect(() => {
    setData(current => {
      const stale = current.version !== CONTENT_VERSION

      return {
        ...DEFAULT_CONTENT,
        ...current,
        version: CONTENT_VERSION,

        studioInfo: {
          ...DEFAULT_CONTENT.studioInfo,
          ...(stale ? {} : current.studioInfo),
          social: {
            ...DEFAULT_CONTENT.studioInfo.social,
            ...(stale ? {} : current.studioInfo?.social)
          }
        },

        about: stale
          ? DEFAULT_CONTENT.about
          : { ...DEFAULT_CONTENT.about, ...current.about },

        services: stale
          ? DEFAULT_CONTENT.services
          : (current.services?.length
              ? current.services
              : DEFAULT_CONTENT.services),

        stats: stale
          ? DEFAULT_CONTENT.stats
          : (current.stats?.length
              ? current.stats
              : DEFAULT_CONTENT.stats),

        timeline: stale
          ? DEFAULT_CONTENT.timeline
          : (current.timeline?.length
              ? current.timeline
              : DEFAULT_CONTENT.timeline),

        visibility: {
          ...DEFAULT_CONTENT.visibility,
          ...current.visibility
        },

        heroSlides:
          current.heroSlides || DEFAULT_CONTENT.heroSlides,

        membership: stale
          ? DEFAULT_CONTENT.membership
          : {
              ...DEFAULT_CONTENT.membership,
              ...current.membership,
              categories:
                current.membership?.categories?.length
                  ? current.membership.categories
                  : DEFAULT_CONTENT.membership.categories
            }
      }
    })
  }, [setData])

  const studio = data.studioInfo || DEFAULT_CONTENT.studioInfo
  const about = data.about || DEFAULT_CONTENT.about
  const stats = data.stats || []
  const timeline = data.timeline || []
  const services = data.services || []
  const visibility = data.visibility || DEFAULT_CONTENT.visibility
  const heroSlidesDraft =
    data.heroSlides || DEFAULT_CONTENT.heroSlides

  const membership =
    data.membership || DEFAULT_CONTENT.membership

  const publishMessage = useMemo(() => {
    if (status === 'error') {
      return 'Firebase rejected the publish. Check your Firestore rules.'
    }

    return 'Edits are saved locally until you select Publish.'
  }, [status])

  const updateStudio = (field, value) => {
    setData(current => ({
      ...current,
      studioInfo: {
        ...current.studioInfo,
        [field]: value
      }
    }))
  }

  const updateSocial = (field, value) => {
    setData(current => ({
      ...current,
      studioInfo: {
        ...current.studioInfo,
        social: {
          ...current.studioInfo.social,
          [field]: value
        }
      }
    }))
  }

  const updateAbout = (field, value) => {
    setData(current => ({
      ...current,
      about: {
        ...current.about,
        [field]: value
      }
    }))
  }

  const updateVisibility = (section, checked) => {
    setData(current => ({
      ...current,
      visibility: {
        ...DEFAULT_CONTENT.visibility,
        ...current.visibility,
        [section]: checked
      }
    }))
  }

  const updateHeroSlide = (index, field, value) => {
    updateArray('heroSlides', index, field, value)
  }

  const updateArray = (key, index, field, value) => {
    setData(current => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    }))
  }

  const removeArrayItem = (key, index) => {
    setData(current => ({
      ...current,
      [key]: current[key].filter(
        (_, itemIndex) => itemIndex !== index
      )
    }))
  }

  const addArrayItem = (key, item) => {
    setData(current => ({
      ...current,
      [key]: [...(current[key] || []), item]
    }))
  }

  const updateMembershipCategory = (index, field, value) => {
    setData(current => ({
      ...current,
      membership: {
        ...current.membership,
        categories: current.membership.categories.map(
          (item, itemIndex) =>
            itemIndex === index
              ? { ...item, [field]: value }
              : item
        )
      }
    }))
  }

  return (
    <div style={pageStyle}>
      <style>{`
        .content-dashboard__layout {
          max-width: 1320px;
          margin: 0 auto;
          padding: 28px 28px 80px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 32px;
        }

        .content-dashboard__preview {
          position: sticky;
          top: 20px;
          height: fit-content;
        }

        @media (max-width: 1050px) {
          .content-dashboard__layout {
            display: block;
            max-width: 960px;
          }

          .content-dashboard__preview {
            display: none;
          }
        }
      `}</style>

      <DashboardHeader
        eyebrow="ANIMATION GUILD UGANDA"
        title="Site content"
      >
        <PublishBar
          isDirty={isDirty}
          status={status}
          lastLocalSave={lastLocalSave}
          onPublish={publish}
          onRestore={restoreLastPublished}
        />
      </DashboardHeader>

      <main className="content-dashboard__layout">
        <div>
          <p
            style={{
              color: '#9a978f',
              fontSize: 13.5,
              margin: '0 0 28px'
            }}
          >
            {publishMessage}
          </p>

          <Section
            title="Studio information"
            description="Used in the hero, about, and contact sections."
          >
            <Grid>
              <Field label="Name">
                <TextInput
                  value={studio.name || ''}
                  onChange={event =>
                    updateStudio('name', event.target.value)
                  }
                />
              </Field>

              <Field label="Tagline">
                <TextInput
                  value={studio.tagline || ''}
                  onChange={event =>
                    updateStudio('tagline', event.target.value)
                  }
                />
              </Field>

              <Field label="Founded">
                <TextInput
                  type="number"
                  value={studio.founded || ''}
                  onChange={event =>
                    updateStudio(
                      'founded',
                      Number(event.target.value)
                    )
                  }
                />
              </Field>

              <Field label="Location">
                <TextInput
                  value={studio.location || ''}
                  onChange={event =>
                    updateStudio('location', event.target.value)
                  }
                />
              </Field>

              <Field label="Email">
                <TextInput
                  type="email"
                  value={studio.email || ''}
                  onChange={event =>
                    updateStudio('email', event.target.value)
                  }
                />
              </Field>

              <Field label="Phone">
                <TextInput
                  value={studio.phone || ''}
                  onChange={event =>
                    updateStudio('phone', event.target.value)
                  }
                />
              </Field>

              <Field label="WhatsApp number">
                <TextInput
                  value={studio.whatsapp || ''}
                  onChange={event =>
                    updateStudio(
                      'whatsapp',
                      event.target.value
                    )
                  }
                />
              </Field>

              <Field label="Address">
                <TextInput
                  value={studio.address || ''}
                  onChange={event =>
                    updateStudio(
                      'address',
                      event.target.value
                    )
                  }
                />
              </Field>
            </Grid>

            <Field label="Description">
              <TextArea
                value={studio.description || ''}
                onChange={event =>
                  updateStudio(
                    'description',
                    event.target.value
                  )
                }
              />
            </Field>

            <Grid>
              {['instagram', 'facebook', 'linkedin'].map(
                platform => (
                  <Field
                    key={platform}
                    label={`${platform[0].toUpperCase()}${platform.slice(1)} URL`}
                  >
                    <TextInput
                      value={
                        studio.social?.[platform] || ''
                      }
                      onChange={event =>
                        updateSocial(
                          platform,
                          event.target.value
                        )
                      }
                    />
                  </Field>
                )
              )}
            </Grid>
          </Section>

          <Section
            title="Section visibility"
            description="Turn a homepage section on or off. Hidden sections are not rendered on the public site."
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10
              }}
            >
              {[
                ['hero', 'Hero'],
                ['about', 'About'],
                ['services', 'Services'],
                ['membership', 'Membership'],
                ['roadmap', 'Roadmap'],
                ['contact', 'Contact']
              ].map(([key, label]) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    gap: 9,
                    alignItems: 'center',
                    background: '#141417',
                    border:
                      '1px solid rgba(255,255,255,.08)',
                    padding: '11px 12px',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibility[key] !== false}
                    onChange={event =>
                      updateVisibility(
                        key,
                        event.target.checked
                      )
                    }
                  />

                  <span>{label}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section
            title="Hero carousel"
            description="Choose a local image and edit the text for each hero slide."
          >
            {heroSlidesDraft.map((slide, index) => (
              <Card
                key={slide.id || index}
                onRemove={() =>
                  removeArrayItem(
                    'heroSlides',
                    index
                  )
                }
              >
                <Grid>
                  <Field label="Image">
                    <ImageSelect
                      value={slide.imageId || ''}
                      onChange={value =>
                        updateHeroSlide(
                          index,
                          'imageId',
                          value
                        )
                      }
                    />
                  </Field>

                  <Field label="Title">
                    <TextInput
                      value={slide.title || ''}
                      onChange={event =>
                        updateHeroSlide(
                          index,
                          'title',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <Field label="Accent text">
                    <TextInput
                      value={slide.subtitle || ''}
                      onChange={event =>
                        updateHeroSlide(
                          index,
                          'subtitle',
                          event.target.value
                        )
                      }
                    />
                  </Field>
                </Grid>
              </Card>
            ))}

            <AddButton
              onClick={() =>
                addArrayItem('heroSlides', {
                  id: `slide-${Date.now()}`,
                  imageId: imageOptions[0].id,
                  title: 'New title',
                  subtitle: 'New subtitle'
                })
              }
            >
              Add slide
            </AddButton>
          </Section>

          <Section
            title="About copy"
            description="Used in the About section."
          >
            <Field label="About image">
              <ImageSelect
                value={data.aboutImageId || 'agu1'}
                onChange={value =>
                  setData(current => ({
                    ...current,
                    aboutImageId: value
                  }))
                }
              />
            </Field>

            <Field label="Heading">
              <TextInput
                value={about.title || ''}
                onChange={event =>
                  updateAbout(
                    'title',
                    event.target.value
                  )
                }
              />
            </Field>

            <Field label="Lead paragraph">
              <TextArea
                value={about.content || ''}
                onChange={event =>
                  updateAbout(
                    'content',
                    event.target.value
                  )
                }
              />
            </Field>

            <Field label="Story">
              <TextArea
                value={about.story || ''}
                onChange={event =>
                  updateAbout(
                    'story',
                    event.target.value
                  )
                }
              />
            </Field>
          </Section>

          <Section
            title="Statistics"
            description="Counters displayed in the About section."
          >
            {stats.map((stat, index) => (
              <Card
                key={index}
                onRemove={() =>
                  removeArrayItem('stats', index)
                }
              >
                <Grid>
                  <Field label="Value">
                    <TextInput
                      type="number"
                      value={stat.value ?? ''}
                      onChange={event =>
                        updateArray(
                          'stats',
                          index,
                          'value',
                          Number(event.target.value)
                        )
                      }
                    />
                  </Field>

                  <Field label="Suffix">
                    <TextInput
                      value={stat.suffix || ''}
                      onChange={event =>
                        updateArray(
                          'stats',
                          index,
                          'suffix',
                          event.target.value
                        )
                      }
                    />
                  </Field>
                </Grid>

                <Field label="Label">
                  <TextInput
                    value={stat.label || ''}
                    onChange={event =>
                      updateArray(
                        'stats',
                        index,
                        'label',
                        event.target.value
                      )
                    }
                  />
                </Field>
              </Card>
            ))}

            <AddButton
              onClick={() =>
                addArrayItem('stats', {
                  value: 0,
                  suffix: '',
                  label: 'New statistic'
                })
              }
            >
              Add statistic
            </AddButton>
          </Section>

          <Section
            title="Roadmap"
            description="Milestones displayed on the homepage roadmap."
          >
            {timeline.map((milestone, index) => (
              <Card
                key={milestone.id || index}
                onRemove={() =>
                  removeArrayItem(
                    'timeline',
                    index
                  )
                }
              >
                <Grid>
                  <Field label="Date or year">
                    <TextInput
                      value={milestone.date || ''}
                      onChange={event =>
                        updateArray(
                          'timeline',
                          index,
                          'date',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <Field label="Title">
                    <TextInput
                      value={milestone.title || ''}
                      onChange={event =>
                        updateArray(
                          'timeline',
                          index,
                          'title',
                          event.target.value
                        )
                      }
                    />
                  </Field>
                </Grid>

                <Field label="Description">
                  <TextArea
                    value={
                      milestone.description || ''
                    }
                    onChange={event =>
                      updateArray(
                        'timeline',
                        index,
                        'description',
                        event.target.value
                      )
                    }
                  />
                </Field>
              </Card>
            ))}

            <AddButton
              onClick={() =>
                addArrayItem('timeline', {
                  id: `milestone-${Date.now()}`,
                  date: '',
                  title: 'New milestone',
                  description: ''
                })
              }
            >
              Add milestone
            </AddButton>
          </Section>

          <Section
            title="Services"
            description="Cards displayed in the Services section."
          >
            {services.map((service, index) => (
              <Card
                key={service.id || index}
                onRemove={() =>
                  removeArrayItem(
                    'services',
                    index
                  )
                }
              >
                <Grid>
                  <Field label="Title">
                    <TextInput
                      value={service.title || ''}
                      onChange={event =>
                        updateArray(
                          'services',
                          index,
                          'title',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <Field label="Icon key">
                    <TextInput
                      value={service.icon || ''}
                      onChange={event =>
                        updateArray(
                          'services',
                          index,
                          'icon',
                          event.target.value
                        )
                      }
                    />
                  </Field>
                </Grid>

                <Field label="Description">
                  <TextArea
                    value={
                      service.description || ''
                    }
                    onChange={event =>
                      updateArray(
                        'services',
                        index,
                        'description',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Features, one per line">
                  <TextArea
                    value={(service.features || []).join(
                      '\n'
                    )}
                    onChange={event =>
                      updateArray(
                        'services',
                        index,
                        'features',
                        event.target.value
                          .split('\n')
                          .filter(Boolean)
                      )
                    }
                  />
                </Field>
              </Card>
            ))}

            <AddButton
              onClick={() =>
                addArrayItem('services', {
                  id: `service-${Date.now()}`,
                  title: 'New service',
                  icon: 'Events',
                  description: '',
                  features: []
                })
              }
            >
              Add service
            </AddButton>
          </Section>

          <Section
            title="Membership"
            description="Overview and membership information displayed before the member listings."
          >
            <Field label="Heading">
              <TextInput
                value={membership.title || ''}
                onChange={event =>
                  setData(current => ({
                    ...current,
                    membership: {
                      ...current.membership,
                      title: event.target.value
                    }
                  }))
                }
              />
            </Field>

            <Field label="Overview">
              <TextArea
                value={membership.overview || ''}
                onChange={event =>
                  setData(current => ({
                    ...current,
                    membership: {
                      ...current.membership,
                      overview: event.target.value
                    }
                  }))
                }
              />
            </Field>

            <Field label="Description">
              <TextArea
                value={membership.description || ''}
                onChange={event =>
                  setData(current => ({
                    ...current,
                    membership: {
                      ...current.membership,
                      description: event.target.value
                    }
                  }))
                }
              />
            </Field>

            <Field label="Eligibility">
              <TextArea
                value={membership.eligibility || ''}
                onChange={event =>
                  setData(current => ({
                    ...current,
                    membership: {
                      ...current.membership,
                      eligibility: event.target.value
                    }
                  }))
                }
              />
            </Field>

            <h3
              style={{
                fontSize: 16,
                margin: '24px 0 12px'
              }}
            >
              Membership categories
            </h3>

            {(membership.categories || []).map(
              (category, index) => (
                <Card
                  key={index}
                  onRemove={() => {
                    setData(current => ({
                      ...current,
                      membership: {
                        ...current.membership,
                        categories:
                          current.membership.categories.filter(
                            (_, itemIndex) =>
                              itemIndex !== index
                          )
                      }
                    }))
                  }}
                >
                  <Grid>
                    <Field label="Category">
                      <TextInput
                        value={category.name || ''}
                        onChange={event =>
                          updateMembershipCategory(
                            index,
                            'name',
                            event.target.value
                          )
                        }
                      />
                    </Field>

                    <Field label="Fee">
                      <TextInput
                        value={category.fee || ''}
                        onChange={event =>
                          updateMembershipCategory(
                            index,
                            'fee',
                            event.target.value
                          )
                        }
                      />
                    </Field>
                  </Grid>

                  <Field label="Description">
                    <TextArea
                      value={
                        category.description || ''
                      }
                      onChange={event =>
                        updateMembershipCategory(
                          index,
                          'description',
                          event.target.value
                        )
                      }
                    />
                  </Field>
                </Card>
              )
            )}

            <AddButton
              onClick={() =>
                setData(current => ({
                  ...current,
                  membership: {
                    ...current.membership,
                    categories: [
                      ...(current.membership?.categories ||
                        []),
                      {
                        name: 'New membership category',
                        fee: 'To be determined',
                        description: ''
                      }
                    ]
                  }
                }))
              }
            >
              Add membership category
            </AddButton>
          </Section>
        </div>

        <LivePreview
          data={{
            ...data,
            visibility,
            heroSlides: heroSlidesDraft,
            aboutImageId:
              data.aboutImageId || 'agu1'
          }}
        />
      </main>
    </div>
  )
}

function Section({ title, description, children }) {
  return (
    <section style={{ marginBottom: 42 }}>
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 23,
          margin: '0 0 5px'
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: '#9a978f',
          fontSize: 13.5,
          margin: '0 0 18px'
        }}
      >
        {description}
      </p>

      {children}
    </section>
  )
}

function Grid({ children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0 16px'
      }}
    >
      {children}
    </div>
  )
}

function ImageSelect({ value, onChange }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '58px 1fr',
        gap: 10,
        alignItems: 'center'
      }}
    >
      <img
        src={
          imageOptions.find(
            image => image.id === value
          )?.src
        }
        alt="Selected"
        style={{
          width: 58,
          height: 44,
          objectFit: 'cover',
          borderRadius: 6,
          background: '#0c0c0e'
        }}
      />

      <select
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={{
          width: '100%',
          background: '#141417',
          border:
            '1px solid rgba(255,255,255,.09)',
          borderRadius: 8,
          color: '#f2f0ec',
          padding: '10px 12px'
        }}
      >
        {imageOptions.map(image => (
          <option
            key={image.id}
            value={image.id}
          >
            {image.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function LivePreview({ data }) {
  const studio = data.studioInfo || {}
  const about = data.about || {}
  const membership =
    data.membership || DEFAULT_CONTENT.membership

  const visible = key =>
    data.visibility?.[key] !== false

  const hero = data.heroSlides?.[0]

  const heroImage =
    imageOptions.find(
      image => image.id === hero?.imageId
    )?.src

  const aboutImage =
    imageOptions.find(
      image => image.id === data.aboutImageId
    )?.src

  return (
    <aside
      className="content-dashboard__preview"
      aria-label="Live page preview"
    >
      <div
        style={{
          fontSize: 11,
          color: '#c9a962',
          letterSpacing: '.08em',
          marginBottom: 8
        }}
      >
        DESKTOP LIVE PREVIEW
      </div>

      <div
        style={{
          border: '7px solid #252529',
          borderRadius: 18,
          overflow: 'hidden',
          background: '#111114',
          boxShadow:
            '0 16px 45px rgba(0,0,0,.35)'
        }}
      >
        <div
          style={{
            height: 18,
            background: '#252529',
            display: 'flex',
            gap: 4,
            padding: '6px 8px'
          }}
        >
          <i style={dotStyle} />
          <i style={dotStyle} />
          <i style={dotStyle} />
        </div>

        <div
          style={{
            maxHeight:
              'calc(100vh - 110px)',
            overflowY: 'auto',
            fontSize: 10,
            lineHeight: 1.35
          }}
        >
          {visible('hero') && (
            <div
              style={{
                minHeight: 170,
                padding: 18,
                color: 'white',
                background:
                  `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.25)), url(${heroImage}) center/cover`
              }}
            >
              <div
                style={{
                  color: '#d5b76d',
                  fontSize: 9
                }}
              >
                {studio.tagline}
              </div>

              <strong
                style={{
                  display: 'block',
                  fontSize: 25,
                  lineHeight: 1.05,
                  marginTop: 12
                }}
              >
                {hero?.title}
              </strong>

              <strong
                style={{
                  display: 'block',
                  fontSize: 25,
                  lineHeight: 1.05,
                  color: '#d5b76d'
                }}
              >
                {hero?.subtitle}
              </strong>

              <p
                style={{
                  maxWidth: 210,
                  opacity: 0.85
                }}
              >
                {studio.description}
              </p>
            </div>
          )}

          {visible('about') && (
            <PreviewSection label="ABOUT">
              <img
                src={aboutImage}
                alt="About"
                style={{
                  width: '100%',
                  height: 84,
                  objectFit: 'cover',
                  borderRadius: 5,
                  marginBottom: 9
                }}
              />

              <strong style={{ fontSize: 15 }}>
                {about.title}
              </strong>

              <p style={{ color: '#bbb' }}>
                {about.content}
              </p>
            </PreviewSection>
          )}

          {visible('services') && (
            <PreviewSection label="SERVICES">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 6
                }}
              >
                {(data.services || [])
                  .slice(0, 4)
                  .map(service => (
                    <div
                      key={
                        service.id ||
                        service.title
                      }
                      style={{
                        padding: 7,
                        background: '#1b1b20',
                        borderRadius: 4
                      }}
                    >
                      <strong>
                        {service.title}
                      </strong>
                    </div>
                  ))}
              </div>
            </PreviewSection>
          )}

          {visible('membership') && (
            <PreviewSection label="MEMBERSHIP">
              <strong
                style={{ fontSize: 15 }}
              >
                {membership.title ||
                  'Membership'}
              </strong>

              <p
                style={{ color: '#bbb' }}
              >
                {membership.overview}
              </p>

              <p
                style={{ color: '#bbb' }}
              >
                {membership.description}
              </p>

              <strong
                style={{
                  display: 'block',
                  marginTop: 10
                }}
              >
                Membership categories
              </strong>

              {(membership.categories || [])
                .slice(0, 3)
                .map((category, index) => (
                  <div
                    key={index}
                    style={{
                      padding: 7,
                      background: '#1b1b20',
                      borderRadius: 4,
                      marginTop: 6
                    }}
                  >
                    <strong>
                      {category.name}
                    </strong>

                    <div
                      style={{
                        color: '#d5b76d'
                      }}
                    >
                      {category.fee}
                    </div>
                  </div>
                ))}

              <p
                style={{
                  color: '#bbb',
                  marginTop: 10
                }}
              >
                View members and apply
                to join.
              </p>
            </PreviewSection>
          )}

          {visible('roadmap') && (
            <PreviewSection label="ROADMAP">
              {(data.timeline || [])
                .slice(0, 3)
                .map(item => (
                  <div
                    key={
                      item.id ||
                      item.title
                    }
                    style={{
                      borderLeft:
                        '2px solid #c9a962',
                      paddingLeft: 7,
                      margin: '7px 0'
                    }}
                  >
                    <strong>
                      {item.title}
                    </strong>

                    <div
                      style={{
                        color: '#999'
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                ))}
            </PreviewSection>
          )}

          {visible('contact') && (
            <PreviewSection label="CONTACT">
              <strong
                style={{ fontSize: 15 }}
              >
                Let's Create Together
              </strong>

              <p
                style={{ color: '#bbb' }}
              >
                {studio.email}
                <br />
                {studio.phone}
              </p>
            </PreviewSection>
          )}
        </div>
      </div>
    </aside>
  )
}

function PreviewSection({ label, children }) {
  return (
    <section
      style={{
        padding: '14px 14px',
        borderBottom:
          '1px solid #29292e'
      }}
    >
      <span
        style={{
          display: 'block',
          color: '#d5b76d',
          fontSize: 8,
          letterSpacing: '.08em',
          marginBottom: 7
        }}
      >
        {label}
      </span>

      {children}
    </section>
  )
}

const dotStyle = {
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: '#666',
  display: 'block'
}
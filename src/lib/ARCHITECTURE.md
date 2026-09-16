# Animation Guild Uganda — Website & CMS
## Software Engineering Documentation

**Status:** Living document — generated from source review. Sections marked
**[INFERRED]** are based on usage patterns observed in reviewed files, not
direct inspection of that file. Sections marked **[NOT REVIEWED]** describe
files referenced by imports but not yet shared; treat their contents as
assumptions to verify.

**Reviewed files (all revisions):** `App.jsx`, `ContentDashboard.jsx`,
`MembersDashboard.jsx`, `NewsEventsDashboard.jsx`, `Services.jsx`,
`publishService.js`, `useDocumentDraft.js`, `useCollectionDraft.js`,
`useSiteContent.js`, `About.jsx/css`, `Contact.jsx/css`,
`Membership.jsx/css`, `Footer.jsx/css` (newly authored this cycle).

---

## ⚠️ Open Issue: Duplicate `Footer` Components

`App.jsx` imports an **existing** Footer:

```js
import { Footer } from './components/Footer'
```

This component has not been reviewed and predates the `Footer.jsx` built
in this documentation cycle (Section 7.6), which currently lives
unimported anywhere. **These need to be reconciled before deploy:**

- If the existing `./components/Footer` is the production one, the new
  `Footer.jsx` (with the tagline/nav/social/copyright layout described in
  Section 7.6) should either replace its contents or be discarded.
- If the existing one is a stub/placeholder, confirm that before deleting
  it, since `AppShell` already wires it into every non-admin route.

**Action required:** share the existing `src/components/Footer/*` files so
this can be resolved with certainty rather than guessed at.

---

## 1. Purpose

The project is the public website and lightweight content-management
system (CMS) for the **Animation Guild of Uganda**, a Uganda-registered
guild (under the Cooperative Societies Act, Chapter 107) representing
animators, illustrators, studios and related digital-creative
professionals across East Africa.

The system has two audiences and two corresponding surfaces:

| Surface | Audience | Goal |
|---|---|---|
| **Public site** | Prospective members, partners, press, the public | Communicate what the Guild does, who its members are, upcoming events, and how to join. |
| **Admin dashboards** | Guild secretariat / content editors | Let non-technical staff edit site copy, members, and news without touching code or deploying. |

There is no traditional backend CMS (e.g. Sanity, Contentful, WordPress).
Instead, the project implements a **bespoke, Firestore-backed CMS**
directly inside the React app — see Section 4.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Build tool | **Vite 5.4.x** | Fast dev server + Rollup-based production build. |
| Framework | **React** (function components, hooks) | No class components observed. |
| Routing | **react-router-dom** (`BrowserRouter`) | Confirmed via `App.jsx` — see Section 5. |
| Animation (UI) | **Framer Motion** | Scroll-triggered reveals (mostly `viewport={{ once: true }}`), `AnimatePresence` for mount/unmount transitions, hover/tap micro-interactions. |
| Animation (scroll/parallax) | **GSAP + ScrollTrigger + ScrollToPlugin** | Registered globally in `App.jsx`, used per-section for parallax, staggered reveals, and (in `Services`) a **replaying** flip/tilt-in animation — see Section 7.5's inconsistency note. |
| Animated icons | **@lottiefiles/react-lottie-player** | Used only in `Services.jsx`. Currently the source of the Vercel build failure — see Section 10. |
| Data / persistence | **Firebase Firestore** | Both the CMS drafts' published snapshot and the public content live here. Local drafts live in `localStorage`, not Firestore — see Section 4.3. |
| Deployment | **Vercel** | Static Vite build. |
| Styling | Plain CSS per component (BEM-flavoured class names) + CSS custom properties for design tokens; dashboards use inline JS style objects instead of CSS files. | Two distinct styling conventions coexist — see Section 8.3. |

---

## 3. High-Level Architecture

```
                         ┌─────────────────────────┐
                         │       Firestore          │
                         │                          │
                         │  siteContent/main  (doc) │◄──── published content
                         │  members/*         (col) │◄──── published members
                         │  newsEvents/*      (col) │◄──── published news/events
                         └───────────▲──────────────┘
                                     │
                     publish() / restore()   (publishService.js)
                                     │
                 ┌───────────────────┴────────────────────┐
                 │                                          │
        ┌────────▼─────────┐                      ┌─────────▼────────┐
        │   Admin Dashboards │                      │   Public Site     │
        │  (editor-facing)   │                      │  (visitor-facing) │
        │  /admin/*           │                      │  /, /news-events, │
        │                    │                      │  /members          │
        │ ContentDashboard   │                      │                    │
        │ MembersDashboard   │                      │ Home (Hero, About, │
        │ NewsEventsDashboard│                      │ Services,          │
        │                    │                      │ Membership,        │
        │ ┌────────────────┐ │                      │ Contact), Footer,  │
        │ │ localStorage     │ │                     │ NewsEvents page,   │
        │ │ draft (per-      │ │                     │ Members page       │
        │ │ dashboard key)   │ │                     │                    │
        │ └────────────────┘ │                      │ useSiteContent()  │
        │  useDocumentDraft / │                      │ (onSnapshot,      │
        │  useCollectionDraft │                      │  read-only)       │
        └────────────────────┘                      └────────────────────┘
```

**Key architectural decision:** the admin dashboards do **not** write
directly to the documents the public site reads from on every keystroke.
Instead:

1. Editors work against a **local draft**, persisted to `localStorage`
   (debounced, 400ms — confirmed in Section 4.3), not to Firestore.
2. Clicking **Publish** calls `publishDocument()` / `publishCollection()`
   (`publishService.js`), which writes the draft to Firestore in one
   atomic operation (`setDoc` for documents, `writeBatch` for
   collections).
3. The public site subscribes to the *published* Firestore data via
   `onSnapshot` (`useSiteContent.js`) and updates live when a publish
   lands.

This means editors can make and preview many changes — surviving page
refreshes and browser restarts, since the draft lives in `localStorage` —
without any of them being visible to the public until "Publish" is
explicitly pressed.

---

## 4. Data Layer & CMS Pattern

### 4.1 Two shapes of content

The system explicitly distinguishes two Firestore data shapes
(documented in the `publishService.js` header comment):

1. **"Document" content** — one Firestore document holds an entire nested
   object. Used for `siteContent/main`, edited via `ContentDashboard` and
   the `useDocumentDraft` hook.

2. **"Collection" content** — each entry is its own Firestore document
   inside a collection. Used for `members` (via `MembersDashboard`) and
   `newsEvents` (via `NewsEventsDashboard`), both powered by
   `useCollectionDraft`.

**Naming note:** code comments in both `publishService.js` and
`useCollectionDraft.js` refer to a **"LeadershipDashboard"** as a consumer
of the collection pattern. No such component exists in the reviewed
codebase — the actual component is `MembersDashboard`, routed at
`/admin/members`. This is almost certainly a leftover from an earlier
rename (Members ← Leadership) and is harmless, but worth cleaning up in
comments to avoid confusing future contributors.

### 4.2 `publishService.js` — the persistence boundary

The only module that writes/reads CMS content to/from Firestore.

| Function | Shape | Behaviour |
|---|---|---|
| `publishDocument(path, data)` | Document | `setDoc` with a `publishedAt: serverTimestamp()` stamp. Full overwrite. |
| `restoreDocument(path)` | Document | Reads the doc back; returns `null` if it doesn't exist. |
| `publishCollection(collectionPath, items, orderField)` | Collection | **Diff-based sync**: `batch.set()`s every item (stamping `order` index + `publishedAt`), `batch.delete()`s any existing Firestore doc whose id is no longer in `items`. |
| `restoreCollection(collectionPath, orderField)` | Collection | Queries ordered by `orderField`, returns `{ id, ...data }[]`. |

### 4.3 `useDocumentDraft.js` / `useCollectionDraft.js` — **[CONFIRMED]**

Both hooks share the same shape and lifecycle, differing only in
single-object vs. array semantics.

**Initialization:** state is seeded synchronously from `localStorage` via
`loadDraft(storageKey, defaultValue)` (from `lib/localDraft.js`
**[NOT REVIEWED]**) — so a returning editor sees their in-progress draft
immediately, before any network round-trip.

**On mount:** each hook fires a one-time fetch of the *currently published*
Firestore state (`restoreDocument`/`restoreCollection`) purely to have
something to diff the local draft against for `isDirty`. This fetch does
**not** overwrite the local draft — it's comparison-only.

**Autosave:** every change to `data`/`items` is written back to
`localStorage` via `saveDraft(storageKey, ...)`, **debounced 400ms**
(`setTimeout` + `clearTimeout` on each state change). `lastLocalSave` is
refreshed from `draftSavedAt(storageKey)` after each save, which is what
`<PublishBar>` displays to the editor ("last saved locally at …").

**`isDirty` computation** differs subtly between the two hooks:

- *Document:* `JSON.stringify(data) !== JSON.stringify({ ...data, ...stripMeta(publishedSnapshot) })`
  — builds a merged object (draft fields as the base, published fields
  overlaid) and compares that against the draft. This correctly detects
  both *changed* fields (published overlay differs from draft) and
  *removed* fields (published has a key the draft dropped, which the
  overlay re-introduces, creating a mismatch). It does **not** false-flag
  newly-added draft fields that don't exist in `publishedSnapshot` yet,
  since those survive the spread untouched.
- *Collection:* simpler — `JSON.stringify(items) !== JSON.stringify(publishedSnapshot.map(stripMeta))`,
  a direct array comparison after stripping server-generated metadata.

Both `stripMeta` helpers remove `publishedAt`; the collection variant also
strips `order` (the server-assigned position index), since that's derived
from array order on publish, not authored by the editor.

**`publish()` — asymmetric behaviour worth knowing:**

- *Document:* after a successful `publishDocument()`, `publishedSnapshot`
  is set to the **local `data` object directly** — no re-fetch. This is
  safe because `setDoc` doesn't transform the shape of what you send
  (aside from adding `publishedAt`, which `stripMeta` already accounts
  for on the next `isDirty` check).
- *Collection:* after `publishCollection()`, the hook **re-fetches** via
  `restoreCollection()` and uses *that* as the new `publishedSnapshot`.
  This is necessary because `publishCollection` assigns a server-side
  `order` field per item based on array position — the local `items`
  array doesn't carry that field, so reusing it directly (as the document
  variant does) would make every subsequent `isDirty` check incorrectly
  report dirty due to the missing `order` key.

**`status` values:** the type comment declares
`'idle' | 'saving' | 'publishing' | 'restoring' | 'error'`, but only
`'idle'`, `'publishing'`, `'restoring'`, and `'error'` are ever actually
set in the reviewed code — **`'saving'` is declared but unused.** Autosave
to `localStorage` happens silently without a status transition. If the UI
(`<PublishBar>`) has a visual state for `'saving'`, it will never trigger;
worth confirming intentional vs. a dropped feature.

**`restoreLastPublished()`:** re-fetches from Firestore, strips metadata,
and overwrites *both* the in-memory state and the `localStorage` draft —
i.e. this is a genuine "discard my local changes" action, not just a
display refresh.

### 4.4 Versioned re-seeding pattern

Every dashboard follows the same defensive pattern to handle schema
evolution of its default seed data:

```js
const X_VERSION = 2 // bumped whenever DEFAULT_X changes shape/seed values

useEffect(() => {
  setItems(current => {
    const storedVersion = current?.[0]?.__v ?? 1
    if (storedVersion === X_VERSION) return current
    return DEFAULT_X // re-seed wholesale
  })
}, [setItems])
```

`ContentDashboard` applies this at the top level (`data.version`) with
finer-grained, per-field merge logic rather than a full re-seed; `Members`
and `NewsEvents` dashboards re-seed their entire array wholesale.

**⚠️ Correctness caveat, now sharper given Section 4.3:** because the
local draft lives in `localStorage` and is what gets re-seeded, **a
version bump silently discards an editor's un-published local changes on
their next visit**, with no warning shown. Combined with the fact that
`localStorage` drafts can persist indefinitely across sessions, an editor
could lose real work simply by not having opened the dashboard since the
last schema change shipped.

**Recommendation unchanged from previous revision:** surface a dismissible
warning banner when a version-triggered re-seed occurs.

### 4.5 Public read path — `useSiteContent.js`

Unchanged from prior review. `DEFAULT_CONTENT` is duplicated (not shared)
between this hook and `ContentDashboard.jsx`, and can drift out of sync —
still the highest-leverage refactor opportunity in the codebase (see
Section 12).

---

## 5. Routing & Application Shell — **[CONFIRMED, new]**

`App.jsx` is the root component. Structure:

```jsx
function App() {
  const [loading, setLoading] = useState(true)
  if (loading) return <Preloader onComplete={() => setLoading(false)} />
  return <Router><AppShell /></Router>
}
```

- **`Preloader`** **[NOT REVIEWED]** gates the entire app behind a loading
  screen until it calls `onComplete`. Since this happens *before* the
  Router even mounts, no route (including deep links) renders until the
  preloader finishes — worth confirming this doesn't hurt perceived load
  time or SEO/crawlability for a static marketing site.

- **`AppShell`** reads the current route via `useLocation()` and computes
  `isDashboard = pathname.startsWith('/admin/')`. This single flag governs
  which chrome renders:

  | Element | Rendered when |
  |---|---|
  | `FloatingParticles` **[NOT REVIEWED]** | `!isDashboard` only |
  | `CursorGlow` **[NOT REVIEWED]** | `!isDashboard` only |
  | `Navigation` **[NOT REVIEWED]** | `!isDashboard` only |
  | `Footer` (see open issue above) | `!isDashboard` only |
  | `<Routes>` | always |

  This means the `/admin/*` dashboards render as a **completely bare
  shell** — no site nav, no decorative particle/cursor effects, no footer
  — by design, keeping the CMS visually and functionally separate from
  the public site chrome.

- **GSAP global setup:** `ScrollTrigger` and `ScrollToPlugin` are
  registered once at module scope. `AppShell`'s effect additionally sets
  a **global default** (`ScrollTrigger.defaults({ toggleActions: 'play none none reverse' })`)
  applied to any `ScrollTrigger` instance that doesn't specify its own
  `toggleActions` — meaning most sections replay their entrance animation
  every time they re-enter the viewport by default. **`Services.jsx`
  relies on this default explicitly** (see 7.5); other sections
  (`About`) also don't override it, so they inherit replay behaviour too,
  which contradicts the "animate once" pattern Framer Motion's
  `viewport={{ once: true }}` uses elsewhere in the same sections. This
  is a real cross-library inconsistency: Framer-driven elements animate
  in once; GSAP-driven elements in the *same section* replay on every
  scroll pass.
- A 100ms-delayed `ScrollTrigger.refresh()` runs after mount (likely to
  recalculate trigger positions after images/fonts finish laying out),
  and again on every `window resize`. All ScrollTriggers are killed on
  unmount.

**Route table:**

| Path | Component | Chrome |
|---|---|---|
| `/` | `Home` **[NOT REVIEWED]** | Full public chrome |
| `/news-events` | `NewsEvents` **[NOT REVIEWED]** | Full public chrome |
| `/members` | `Members` **[NOT REVIEWED]** | Full public chrome |
| `/admin/content` | `ContentDashboard` | Bare (no nav/footer/effects) |
| `/admin/news-events` | `NewsEventsDashboard` | Bare |
| `/admin/members` | `MembersDashboard` | Bare |

**Note:** there is no visible authentication/authorization guard on the
`/admin/*` routes in `App.jsx` — anyone with the URL can reach the
dashboards client-side. Firestore Security Rules **[NOT REVIEWED]** may or
may not enforce write restrictions server-side; this should be verified
explicitly, since client-side-only route hiding is not a security
boundary.

---

## 6. Section Structure Breakdown

This section documents the **shared anatomy** every public homepage
section follows, and the assumed section order, since `Home.jsx` itself
hasn't been reviewed directly.

### 6.1 Assumed homepage composition **[INFERRED]**

Based on the sections reviewed, their `visibility` keys
(`hero, about, services, membership, roadmap, contact`), and the natural
narrative order of a guild marketing site, the likely composition of
`Home.jsx` is:

```
Hero → About → Services → Membership → Contact
```

with `roadmap` (the timeline data edited in `ContentDashboard`) currently
**not matched to any reviewed component** — either it renders inside
`About` (near the stats block) or there's a dedicated `Roadmap`/`Timeline`
component not yet reviewed. **This should be confirmed against
`Home.jsx`.**

### 6.2 Common section anatomy

Every reviewed section component (`About`, `Services`, `Membership`,
`Contact`) follows the same structural skeleton:

```jsx
export function SectionName() {
  const { content } = useSiteContent()
  // ...local UI state (open/flipped card, active pointer, carousel index)

  // ...GSAP entrance/parallax effect(s), registered in a useEffect,
  //    cleaned up via ScrollTrigger.getAll().forEach(st => st.kill())

  if (content.visibility?.<key> === false) return null

  return (
    <section id="<key>" className="<key> section [section--dark]">
      <div className="container">
        <motion.div className="section-heading" ...>
          <span className="section-label">...</span>
          <h2 className="section-title">...</h2>
          <p className="section-subtitle">...</p>
        </motion.div>

        {/* section-specific body */}
      </div>
    </section>
  )
}
```

**Consistent conventions across all four:**

1. **Visibility guard is always the last check before render**, always
   comparing `=== false` (fail-open default).
2. **`section-heading` block** (label / title / subtitle trio) is
   identical markup and Framer variant timing in every section that has
   one (`About`'s heading uses a slightly different pattern —
   `containerVariants`/`itemVariants` with staggered children — while
   `Services`, `Membership`, `Contact` use a single `motion.div` with
   fixed `initial`/`whileInView`/`transition` props). **This is a real,
   minor inconsistency**: three sections use one Framer pattern, `About`
   uses a different (more granular) one for the same visual effect.
3. **`section--dark` modifier class** is applied to `Services` and
   `Membership` (both dark-background sections with light text) but not
   `About` or `Contact` (light-background sections) — a straightforward
   light/dark theming convention via class composition, not a CSS
   variable swap.
4. **Data source is always `useSiteContent()`**, destructured per-section
   (`content.about`, `content.services`, `content.membership`,
   `content.studioInfo`) — no section fetches its own data independently.
5. **Local interaction state is section-owned**, not lifted to `content`:
   `flippedCard` (Services), `openCategory`/`activeIndex` (Membership),
   `focusedField`/`formData` (Contact), `activePointer` (About). None of
   this is persisted or shared across sections.
6. **GSAP + Framer Motion coexist within a single section** in `About`
   and `Services` — Framer handles entrance/opacity/stagger of markup,
   GSAP handles continuous scroll-linked effects (parallax, replay-on-
   reentry stagger) that Framer's `whileInView` isn't well-suited for.
   `Membership` and `Contact` use Framer only.

### 6.3 Section-by-section quick reference

| Section | Dark theme | GSAP | Framer pattern | Local state | Visibility key |
|---|---|---|---|---|---|
| About | No | Parallax (image) + pointer stagger | Staggered children variants | `activePointer` | `about` |
| Services | Yes | Card entrance stagger (replays) | Single heading transition | `flippedCard` | `services` |
| Membership | Yes | — | Single heading transition | `activeIndex`, `openCategory` | `membership` |
| Contact | No | — | Staggered children (info column) + single (form) | `formData`, `errors`, `focusedField`, `isSubmitting`, `submitStatus` | `contact` |
| Footer | — | — | — | — | always rendered |

---

## 7. Public-Facing Frontend

### 7.1 Section inventory (updated)

| Component | Purpose | Visibility toggle | Data source | Review status |
|---|---|---|---|---|
| `Hero` | Landing carousel | `visibility.hero` | `content.heroSlides` | **[NOT REVIEWED]** |
| `About` | Guild story, stats, "What We Do" | `visibility.about` | `content.about`, `stats`, `studioInfo`, `aboutImageId` | Reviewed |
| `Services` | Flip-card service offerings with Lottie icons | `visibility.services` | `content.services` | **Reviewed (new)** |
| `Membership` | Membership pitch, categories, benefits | `visibility.membership` | `content.membership`, `content.heroSlides` | Reviewed |
| `Contact` | Contact details + form | `visibility.contact` | `content.studioInfo` | Reviewed |
| `Footer` | Site-wide footer | always | `content.studioInfo` | **Conflicting — see open issue** |
| `Navigation` | Site nav | always (non-admin) | — | **[NOT REVIEWED]** |
| `Preloader` | Initial load gate | always, pre-router | — | **[NOT REVIEWED]** |
| `FloatingParticles`, `CursorGlow` | Decorative effects | always (non-admin) | — | **[NOT REVIEWED]** |
| `Home` | Composes the sections above | route `/` | — | **[NOT REVIEWED]** |
| `NewsEvents` (page) | Full news/event listing | route `/news-events` | `newsEvents` collection | **[NOT REVIEWED]** |
| `Members` (page) | Full member directory | route `/members` | `members` collection | **[NOT REVIEWED]** |

### 7.5 `Services.jsx` — detailed walkthrough **[NEW]**

- **Icons are Lottie animations**, not static SVG/icon-font glyphs like
  the rest of the site. `ServiceIcon` looks up `serviceAnimations[id]`
  (from `data/animations.js` **[NOT REVIEWED]**) keyed by `service.id`,
  and renders it via `<Player autoplay loop src={animationData} />` from
  `@lottiefiles/react-lottie-player`. If no animation is registered for a
  given `service.id`, `ServiceIcon` returns `null` silently — a service
  added via `ContentDashboard` with a new `id` will render with **no
  icon** and no error, unless a matching entry is also added to
  `data/animations.js` by a developer. This is a real coupling: editors
  can add services through the CMS, but icons require a code change.
- **This is the confirmed root cause of the Vercel build failure**
  reported earlier: `Player` is imported statically at module scope, so
  Rollup must resolve `@lottiefiles/react-lottie-player` at build time
  regardless of whether any service actually renders it at runtime. Per
  the two remediation paths given previously, **Option 1 (install and
  commit the dependency) is the only viable fix** unless the Lottie icons
  are removed from the design entirely — there's no conditional/dynamic
  import here to lazy-load around.
- **Flip-card interaction:** clicking a card toggles `flippedCard` (single
  active id, not a per-card boolean set — so only one card can be flipped
  at a time). The card's `service-card--flipped` class presumably drives
  a CSS 3D rotate via `.service-card__inner` (inline `perspective: 1000px`
  is set on the outer card, consistent with a `rotateY`-based CSS flip
  defined in `Services.css` **[NOT REVIEWED]**).
- **Entrance animation:** GSAP `fromTo` on all card refs
  (`opacity/y/rotateX`), triggered at `top 70%` of the section, with
  **`toggleActions: 'play none none reverse'`** explicitly set (redundant
  with the global default set in `App.jsx`, but kept local/explicit here)
  — meaning cards animate out and back in every time the section is
  scrolled past and back into, unlike Framer's `once: true` sections.
- **`animRef`** is a ref object keyed by service id holding each Lottie
  `Player` instance, currently populated but not read anywhere in the
  visible code — likely scaffolding for a planned future interaction
  (e.g. play the animation only on hover/flip rather than continuously
  autoplay-looping).
- Live section copy confirmed: label **"Services"**, title
  **"What We Offer"**, subtitle **"A collective of animators from the
  pearl of Africa."**

### 7.6 `Footer.jsx` — status update

See the open issue callout at the top of this document. The version
described below was authored in the previous documentation cycle and is
**not currently imported anywhere** — `App.jsx` imports a different,
unreviewed `Footer` from `./components/Footer`.

Intended behaviour (as built): renders guild name, tagline, in-page nav
anchors (`#about`, `#services`, `#membership`, `#contact`), social links
(reusing `studioInfo.social`), and a dynamically-year-stamped copyright
line.

*(Sections 7.2–7.4 — About, Membership, Contact detailed walkthroughs —
are unchanged from the previous revision of this document and are omitted
here for brevity; see that revision for full detail on the parallax
image, "What We Do" pointer list, membership category cards, background
carousel, and the hardcoded `localhost:3002` contact-form endpoint.)*

---

## 8. Admin Dashboards

*(Unchanged from previous revision — shared UI kit, common dashboard
template, versioned re-seed pattern, and the styling-convention
divergence between public CSS files and dashboard inline style objects.
See Section 4.3/4.4 above for the now-confirmed hook internals that
underpin this section.)*

---

## 9. Content Sourced from the Guild Constitution

*(Unchanged — see previous revision. Table of constitution → public-copy
mappings for address, tagline, "What We Do," membership categories, and
the registration badge.)*

---

## 10. Build & Deployment

- **Build tool:** Vite 5.4.21 → `npm run build`, hosted on **Vercel**.
- **Confirmed root cause of current build failure:**
  `Services.jsx` statically imports `Player` from
  `@lottiefiles/react-lottie-player` (Section 7.5), which is not present
  in the installed dependency tree at Vercel build time.
- **Resolution:** install and commit the dependency —

  ```bash
  npm install @lottiefiles/react-lottie-player
  ```

  then commit `package.json` + `package-lock.json` and redeploy. Because
  the import is static and unconditional (no dynamic `import()`, no
  feature flag), removing the dependency is not a smaller change than
  installing it — it would require rewriting `ServiceIcon` to drop Lottie
  entirely. Installing is the lower-risk path unless there's a design
  reason to drop Lottie icons altogether.

---

## 11. Known Gaps in This Documentation

Reduced from the previous revision now that `App.jsx`, both draft hooks,
and `Services.jsx` are confirmed. Still outstanding:

- `lib/ui.jsx` — shared dashboard UI kit (`DashboardHeader`, `Field`,
  `PublishBar`, `TextInput`, `TextArea`, `Card`, `AddButton`, `Grid`).
- `lib/localDraft.js` — `loadDraft` / `saveDraft` / `draftSavedAt`
  (confirmed to exist and be `localStorage`-backed by usage in Section
  4.3, but internals — key namespacing, serialization, error handling for
  quota/parse failures — not reviewed).
- `data/images.js`, `data/content.js`, `data/animations.js` — the three
  static data modules referenced throughout.
- `Hero.jsx`, `Home.jsx`, `Navigation.jsx`, `Preloader.jsx`,
  `FloatingParticles`, `CursorGlow` — app shell and homepage-composition
  components.
- Public `NewsEvents.jsx` and `Members.jsx` **pages** (as opposed to their
  dashboards) — to confirm how the `members`/`newsEvents` collections are
  consumed on the read side, and whether a `useMembers`/`useNewsEvents`
  hook mirrors `useSiteContent`'s fallback/error behaviour.
- `lib/firebase.js` and **Firestore Security Rules** — especially given
  Section 5's note that `/admin/*` routes have no visible client-side auth
  guard.
- The existing `src/components/Footer/*` — required to resolve the open
  issue at the top of this document.
- The Node/Express-style backend implied by
  `http://localhost:3002/api/contact`.

---

## 12. Recommendations (Priority Order — updated)

1. **Resolve the Footer duplication** (top of document) before anything
   else touches routing or the public site's chrome.
2. **Install `@lottiefiles/react-lottie-player` and commit the lockfile**
   to unblock the Vercel build (Section 10) — this is now a two-line fix
   with the root cause confirmed.
3. **Fix the contact form's hardcoded `localhost:3002` endpoint** — will
   silently fail for every real visitor once deployed.
4. **Verify Firestore Security Rules enforce `/admin/*` write
   restrictions server-side** — client-side route conditionals in
   `AppShell` are not a security boundary on their own.
5. **De-duplicate `DEFAULT_CONTENT`** between `ContentDashboard.jsx` and
   `useSiteContent.js`.
6. **Add a user-facing warning on version-triggered draft re-seed**
   (Section 4.4) — now confirmed to silently discard real, potentially
   long-lived `localStorage` drafts, not just in-memory state.
7. **Decide on the `status: 'saving'` gap** in both draft hooks (Section
   4.3) — either wire it up during the debounced autosave window, or
   remove it from the type comment if it's intentionally unused.
8. **Couple `Services` icon registration to the CMS**, or document the
   coupling clearly for editors — currently, adding a new service via
   `ContentDashboard` silently produces an icon-less card unless a
   developer also adds a matching entry to `data/animations.js`.
9. Reconcile `About.jsx`'s hardcoded "100+ Animators" badge against the
   editable `content.stats` array (carried over from previous revision).
10. Confirm and document the actual `Home.jsx` section order and the
    placement of `roadmap`/timeline content (Section 6.1).

---

## Appendix A — `siteContent/main` Shape Reference

```js
{
  version: number,
  studioInfo: { name, tagline, founded, location, email, phone, whatsapp,
                address, description, social: { instagram, facebook, linkedin } },
  about: { title, content, story },
  heroSlides: [{ id, imageId, title, subtitle }],
  aboutImageId: string,
  visibility: { hero, about, services, membership, roadmap, contact }, // bool
  stats: [{ value, suffix, label }],
  timeline: [{ id, date, title, description }],
  services: [{ id, title, icon, description, features: string[] }],
  membership: {
    title, overview, description, eligibility,
    categories: [{ name, fee, description }],
    benefits: string[]
  }
}
```

## Appendix B — Collection Shapes

**`members/{id}`**
```js
{ id, name, role, expertise, joined, imageId, bio, __v }
```

**`newsEvents/{id}`**
```js
{
  id, title, date, category: 'event'|'workshop'|'news'|'showcase',
  description, location,
  images: [{ imageId?, url?, alt }],
  __v
}
```

## Appendix C — Draft Hook Contract **[NEW]**

Both `useDocumentDraft(path, storageKey, defaultValue)` and
`useCollectionDraft(collectionPath, storageKey, defaultItems)` return:

```ts
{
  data | items,            // current draft state (setter: setData | setItems)
  isDirty: boolean,        // draft differs from last-known-published snapshot
  status: 'idle' | 'publishing' | 'restoring' | 'error', // 'saving' declared, unused
  lastLocalSave: Date | number | null, // from draftSavedAt(storageKey)
  publish: () => Promise<boolean>,
  restoreLastPublished: () => Promise<boolean>
}
```

Autosave to `localStorage` is automatic, debounced 400ms, and happens
regardless of `publish()` — it is not visible in `status`.

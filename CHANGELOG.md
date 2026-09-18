# Change Log: clinework Branch

**Branch:** `clinework` (compared to `main`)  
**Generated:** 2026-09-17  
**Total Commits:** 8 commits on clinework branch

---

## Summary

This document provides complete documentation of all changes made on the `clinework` branch. The changes span both a **Node.js/Express backend** (with JSON file-based data storage) and a **React/Firebase frontend CMS** system.

---

## 1. Commit History

### Commit: `d8bced9` — "the professional look"
**Date:** 2026-09-17  
**Files Changed:** 8 files  
**Purpose:** Initial professional styling and backend structure

**Changes:**
- `.gitignore` — Added 9 lines (likely node_modules, env files, build artifacts)
- `admin.html` — Modified admin interface (2 line change)
- `server/index.js` — Added contact and comment routes (+2 lines)
- `src/App.jsx` — Minor modification (1 line)
- `src/admin/AdminApp.jsx` — Admin app modifications (3 lines)
- `src/components/About/About.jsx` — About component rewrite (30 lines changed)
- `src/components/Contact/Contact.jsx` — Contact component modifications (6 lines)

**New Files:**
- `public/crane2.png` — New image asset (51,856 bytes)

---

### Commit: `cc2f66f` — "members"
**Date:** 2026-09-17  
**Files Changed:** 7 files  
**Purpose:** Members page and related component updates

**Changes:**
- `src/components/About/About.jsx` — 6 line changes
- `src/components/Contact/Contact.jsx` — 7 line changes  
- `src/components/Services/Services.css` — 33 line changes
- `src/components/Services/Services.jsx` — 30 line changes
- `src/dashboards/ContentDashboard.jsx` — 2 line change
- `src/pages/Members.css` — 297 line changes (major styling overhaul)
- `src/pages/Members.jsx` — 111 line changes (members page functionality)

---

### Commit: `41ba3bd` — "proper committee page"
**Date:** 2026-09-17  
**Files Changed:** 2 files  
**Purpose:** Committee/members page styling refinement

**Changes:**
- `src/pages/Members.css` — 53 line changes
- `src/pages/Members.jsx` — 6 line changes

---

---

## 2. Backend Changes (server/)

### 2.1 Server Entry Point (`server/index.js`)

**Added Routes:**
- `contactRoutes` — Import and mount at `/api/contact`
- `commentRoutes` — Import and mount at `/api/comments`

**Existing Routes:**
- `authRoutes` — `/api/auth` (authentication)
- `contentRoutes` — `/api/content` (CMS content management)
- `photoRoutes` — `/api/photos` (photo gallery management)

**Middleware:**
- CORS enabled
- JSON body parsing (1MB limit)
- Static file serving for `/uploads`

---

### 2.2 Authentication System (`server/routes/auth.js`, `server/middleware/auth.js`)

**Authentication Method:** JWT tokens with bcrypt password hashing

**Endpoints:**
- `POST /api/auth/login` — Login with username/password, returns JWT token
- `GET /api/auth/verify` — Verify token validity (protected)
- `POST /api/auth/change-password` — Change admin password (protected)

**Default Credentials:**
- Username: `admin`
- Password: `admin123` (stored as bcrypt hash in `server/data/admin.json`)

**JWT Configuration:**
- Secret: `fused-lens-secret-key-change-in-production` (from env or default)
- Expiration: 24 hours

---

### 2.3 Content Management API (`server/routes/content.js`)

**Data Source:** `server/data/content.json` (JSON file-based storage)

**Public Endpoints (GET):**
- `GET /api/content/` — Get all content
- `GET /api/content/studio` — Get studio info + social + mission
- `GET /api/content/hero` — Get hero slides
- `GET /api/content/services` — Get services
- `GET /api/content/testimonials` — Get testimonials
- `GET /api/content/collaborators` — Get collaborators
- `GET /api/content/about` — Get about section
- `GET /api/content/stats` — Get statistics

**Protected Endpoints (PUT - requires auth token):**
- `PUT /api/content/studio` — Update studio information
- `PUT /api/content/social` — Update social links
- `PUT /api/content/mission` — Update mission statement
- `PUT /api/content/hero` — Update hero slides
- `PUT /api/content/services` — Update services
- `PUT /api/content/testimonials` — Update testimonials
- `PUT /api/content/collaborators` — Update collaborators
- `PUT /api/content/about` — Update about section
- `PUT /api/content/stats` — Update statistics

---

### 2.4 Contact Form API (`server/routes/contact.js`)

**Data Source:** `server/data/contacts.json` (JSON file-based storage)

**Endpoints:**
- `GET /api/contact/` — Get all contacts (admin only, authenticated)
- `POST /api/contact/` — Submit contact form (public)

**Contact Form Data Structure:**
```json
{
  "id": "timestamp-string",
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "service": "string (optional)",
  "message": "string",
  "submittedAt": "ISO timestamp",
  "status": "unread"
}
```

**Note:** ⚠️ This data is stored in a JSON file and has NO CMS editing interface in the React admin dashboard. Must be edited directly via the server or database interface.

---

### 2.5 Comments API (`server/routes/comments.js`)

**Data Source:** `server/data/comments.json` (JSON file-based storage)


---

## 3. Frontend CMS Changes (src/)

### 3.1 Firebase Integration (`src/lib/firebase.js`)

**Firebase Project:** `animationguilduganda-ef533`

**Services Initialized:**
- Firestore (database)
- Storage
- Analytics (measurementId: G-DCS6Z1X74X)

**⚠️ CRITICAL NOTE:** The frontend uses **Firebase Firestore** for CMS content storage, NOT the Express backend. The backend JSON files are separate and NOT synchronized with Firebase.

---

### 3.2 Content Dashboard (`src/dashboards/ContentDashboard.jsx`)

**Purpose:** Main CMS interface for editing site content

**Features:**
- Live preview of changes
- Draft autosave to localStorage (400ms debounce)
- Publish to Firestore
- Version history with restore capability
- Edit sections: studio info, about, hero slides, services, membership, stats, timeline, visibility toggles

**Data Flow:**
1. User edits content in dashboard
2. Changes saved to localStorage automatically
3. User clicks "Publish"
4. Content published to Firestore `siteContent/main` document
5. Previous version archived to `siteContent/main/versions/` subcollection

**NOTE:** This dashboard publishes to **Firebase Firestore**, NOT to the Express backend JSON files. These are two separate data stores.

---

### 3.3 Site Content Hook (`src/lib/useSiteContent.js`)

**Purpose:** Fetches published content for the public site

**Behavior:**
- Subscribes to Firestore `siteContent/main` document via `onSnapshot`
- Falls back to DEFAULT_CONTENT if Firestore unavailable
- **Membership data IS read from Firestore** (changed from previous behavior where it was hardcoded)

**Affected Components:**
- `Hero.jsx` — Uses studioInfo, heroSlides
- `About.jsx` — Uses studioInfo, stats, about
- `Services.jsx` — Uses services
- `Membership.jsx` — Uses membership (fees, categories, benefits from CMS)
- `Contact.jsx` — Uses studioInfo
- `Footer.jsx` — Uses studioInfo

---

### 3.4 Publish Service (`src/lib/publishService.js`)

**Functions:**
- `publishDocument(path, data)` — Publish document to Firestore with version archiving
- `restoreDocument(path)` — Get current published document
- `publishCollection(collectionPath, items)` — Sync collection with diff-based add/update/delete
- `restoreCollection(collectionPath)` — Get all collection documents
- `archiveCurrentDocument(path)` — Archive current version to versions subcollection
- `listDocumentVersions(path)` — List version history
- `getDocumentVersion(path, versionId)` — Get specific version
- `pruneDocumentVersions(path)` — Remove old versions (keeps last 20)

**Firestore Structure:**
```
siteContent/main              → Live site content document
siteContent/main/versions/    → Version history subcollection
members/{id}                  → Member documents (collection)
newsEvents/{id}              → News/event documents (collection)
```

---

### 3.5 Version History Component (`src/lib/VersionHistory.jsx`)

**Purpose:** UI component for viewing and restoring previous content versions

**Features:**
- Collapsible history panel
- List of archived versions with timestamps
- Preview version differences
- Restore specific version to draft

---

### 3.6 Document Draft Hook (`src/lib/useDocumentDraft.js`)

**Purpose:** Manages draft state with localStorage autosave

**Features:**
- Load draft from localStorage on mount

---

## 4. Data Architecture - CRITICAL INFORMATION

### 4.1 Two Separate Data Stores

This project has **TWO independent data storage systems**:

#### A. Firebase Firestore (Frontend CMS)
- **Used by:** ContentDashboard, useSiteContent, public site components
- **Stores:** Site content (studio info, services, membership, about, hero slides, etc.)
- **Access:** Via Firebase SDK in React app
- **CMS Editing:** ✅ Full CMS support via ContentDashboard

#### B. Express Backend JSON Files (server/data/)
- **Used by:** Express API routes
- **Stores:**
  - `content.json` — Alternative content storage (NOT synced with Firebase)
  - `photos.json` — Photo gallery (managed via photo API)
  - `contacts.json` — Contact form submissions (NO CMS editing)
  - `comments.json` — Photo comments (NO CMS editing)
  - `admin.json` — Admin credentials
- **Access:** Via REST API or direct file access
- **CMS Editing:** ⚠️ Partial — only photos have full CMS support

### 4.2 Data Synchronization Issues

**⚠️ IMPORTANT:** The Firebase content and Express backend content are **NOT synchronized**:

1. **Contact submissions** (`contacts.json`) have NO editing interface in the React admin dashboard
2. **Comments** (`comments.json`) have NO editing interface in the React admin dashboard  
3. **Admin credentials** (`admin.json`) must be edited directly or via password change API

If you edited contact data in the "dashboard," you likely edited it either:
- Directly in the `server/data/contacts.json` file
- Via a database management interface (if connected to external DB)
- Through the Express API directly

### 4.3 Membership Data Flow (Changed in This Branch)

**BEFORE (main branch):**
- Membership data (fees, categories, benefits) was **hardcoded** in `useSiteContent.js` DEFAULT_CONTENT
- CMS changes did NOT affect the public site membership section

**AFTER (clinework branch):**
- Membership data is **read from Firestore** `siteContent/main` document
- CMS edits to membership now **go live on the public site** when published
- Falls back to hardcoded defaults if Firestore data missing/empty

- Autosave to localStorage (400ms debounce)
- Track dirty state (draft vs published)
- Publish to Firestore
- Restore last published version
- Version history management

**Endpoints:**
- `GET /api/comments/` — Get all comments (public)
- `GET /api/comments/:photoId` — Get comments for specific photo (public)

---

## 5. Component Changes Detail

### 5.1 Membership Component (`src/components/Membership/Membership.jsx`)

**Changes:**
- Now pulls membership data from `useSiteContent()` (Firestore)
- Benefit grouping modified (changed which indices belong to which groups)
- Variants adjusted for benefit groups

**Benefit Groups Configuration:**
```javascript
const BENEFIT_GROUPS = [
  { indices: [0, 1], variant: 'white',  label: 'Core Membership' },
  // ... more groups
]
```

---

### 5.2 Backdrop Component (NEW)

**Files:**
- `src/components/Backdrop/BlurredBackdrop.jsx`
- `src/components/Backdrop/BlurredBackdrop.css`
- `src/components/Backdrop/index.js`

**Purpose:** Provides blurred background effect for modal/overlay contexts

---

### 5.3 About Component (`src/components/About/About.jsx`)

**Changes:** Significant rewrite (30 lines in initial commit, 6 more later)
- Now uses `useSiteContent()` for data
- Integrates with CMS-editable content

---

### 5.4 Contact Component (`src/components/Contact/Contact.jsx`)

**Changes:** Multiple modifications across commits
- Uses `useSiteContent()` for studio info
- Contact form submission to Express backend

---

### 5.5 Services Component (`src/components/Services/Services.jsx`)

**Changes:**
- Uses `useSiteContent()` for services data
- Integration with animation system
- CSS major changes (33-53 lines per commit)

---

### 5.6 Footer Component (`src/components/Footer/Footer.jsx`)

---

## 7. Known Issues & Recommendations

From the ARCHITECTURE.md analysis:

1. **Footer Duplication:** There are two Footer components - need reconciliation
2. **Contact Form Hardcoded Endpoint:** Uses `localhost:3002` - will fail in production
3. **Firestore Security Rules:** Need verification for admin route protection
4. **Duplicate DEFAULT_CONTENT:** Defined in both ContentDashboard.jsx and useSiteContent.js
5. **Services Icon Coupling:** Adding services via CMS requires matching icon entries in animations.js
6. **About Page Hardcoded Badge:** "100+ Animators" not tied to editable stats
7. **Missing CMS for Contacts/Comments:** These backend stores have no admin UI

---

## 8. Quick Reference: Where Data Lives

### Editable via CMS (ContentDashboard → Firebase):
- ✅ Studio information (name, tagline, description, location, contact details)
- ✅ Social links
- ✅ Mission statement
- ✅ Hero slides
- ✅ Services (title, description, icon, features)
- ✅ Testimonials
- ✅ Collaborators
- ✅ About section
- ✅ Statistics
- ✅ Timeline/roadmap
- ✅ Membership (title, overview, description, eligibility, categories, benefits)
- ✅ Visibility toggles for all sections

### NOT Editable via CMS (Edit Directly):
- ❌ Contact form submissions (`server/data/contacts.json`)
- ❌ Photo comments (`server/data/comments.json`)
- ❌ Admin credentials (`server/data/admin.json`) - use password change API instead

### Managed via Other Means:
- 🖼️ Photos — Upload/managed via photo API or admin interface
- 🎨 Images — Static assets in `public/` or `server/uploads/`

---

## 9. API Endpoints Summary

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | No | Login, get JWT token |
| GET | /api/auth/verify | Yes | Verify token |
| POST | /api/auth/change-password | Yes | Change password |

### Content (CMS)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/content/ | No | Get all content |
| GET | /api/content/studio | No | Get studio info |
| PUT | /api/content/studio | Yes | Update studio info |
| GET/PUT | /api/content/hero | Yes(PUT) | Hero slides |
| GET/PUT | /api/content/services | Yes(PUT) | Services |
| GET/PUT | /api/content/testimonials | Yes(PUT) | Testimonials |
| GET/PUT | /api/content/collaborators | Yes(PUT) | Collaborators |
| GET/PUT | /api/content/about | Yes(PUT) | About section |
| GET/PUT | /api/content/stats | Yes(PUT) | Statistics |
| GET/PUT | /api/content/social | Yes(PUT) | Social links |
| GET/PUT | /api/content/mission | Yes(PUT) | Mission statement |

### Contact & Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/contact/ | Yes | Get all contacts |
| POST | /api/contact/ | No | Submit contact form |
| GET | /api/comments/ | No | Get all comments |
| GET | /api/comments/:photoId | No | Get photo comments |
| POST | /api/comments/:photoId | No | Add comment |
| PUT | /api/comments/:commentId | Yes | Approve/reject |
| DELETE | /api/comments/:commentId | Yes | Delete comment |

### Photos
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/photos/ | No | Get all photos |
| GET | /api/photos/category/:cat | No | Photos by category |
| GET | /api/photos/categories | No | List categories |
| POST | /api/photos/ | Yes | Upload photo |
| PUT | /api/photos/:id | Yes | Update photo |
| DELETE | /api/photos/:id | Yes | Delete photo |
| PUT | /api/photos/reorder/batch | Yes | Reorder photos |
| POST | /api/photos/categories | Yes | Add category |
| DELETE | /api/photos/categories/:id | Yes | Delete category |


**Changes:** Major rewrite (97+185 lines across commits)
- Now uses `useSiteContent()` for studio info
- Social links from CMS
- Dynamic copyright year

---

## 6. JSON Data Files (src/jsons/, src/data/)

### 6.1 Modified JSON Files

| File | Changes |
|------|---------|
| `src/jsons/collective.json` | 1 line change |
| `src/jsons/showcase.json` | 1 line change |
| `src/jsons/sxs.json` | 1 line change |
| `src/jsons/animeduc2.json` | 2 line change |
| `src/jsons/final5.json` | 2 line change |
| `src/data/animations.js` | 15+2 line changes |
| `src/data/content.js` | Referenced but not shown in diff |

- `POST /api/comments/:photoId` — Add comment to photo (public)
- `PUT /api/comments/:commentId` — Approve/reject comment (admin only)
- `DELETE /api/comments/:commentId` — Delete comment (admin only)

**Comment Data Structure:**
```json
{
  "id": "timestamp-string",
  "photoId": "string",
  "name": "string",
  "email": "string",
  "comment": "string",
  "approved": false,
  "createdAt": "ISO timestamp"
}
```

**Note:** ⚠️ This data is stored in a JSON file and has NO CMS editing interface in the React admin dashboard. Must be managed via API calls or direct file editing.

---

### 2.6 Photos API (`server/routes/photos.js`)

**Data Source:** `server/data/photos.json` + `server/uploads/` directory

**Features:**
- Multer-based file upload (JPEG, PNG, WebP; 10MB limit)
- UUID-based filename generation
- Category management

**Endpoints:**
- `GET /api/photos/` — Get all photos
- `GET /api/photos/category/:category` — Get photos by category
- `GET /api/photos/categories` — Get all categories
- `POST /api/photos/` — Upload new photo (protected)
- `PUT /api/photos/:id` — Update photo (protected)
- `DELETE /api/photos/:id` — Delete photo (protected)
- `PUT /api/photos/reorder/batch` — Reorder photos (protected)
- `POST /api/photos/categories` — Add category (protected)
- `DELETE /api/photos/categories/:id` — Delete category (protected)

---

### 2.7 Data Files (server/data/)

| File | Purpose | Editable via CMS |
|------|---------|------------------|
| `content.json` | Main site content (studio info, services, testimonials, etc.) | ✅ Yes - via ContentDashboard |
| `photos.json` | Photo gallery data | ✅ Yes - via photo upload/management |
| `admin.json` | Admin credentials | ❌ No - direct file edit only |
| `contacts.json` | Contact form submissions | ❌ No - direct file edit only |
| `comments.json` | Photo comments | ❌ No - via API only |


### Commit: `c792878` — "proper site"
**Date:** 2026-09-17  
**Files Changed:** 8 files  
**Purpose:** Site-wide content and CMS integration updates

**Changes:**
- `src/components/Membership/Membership.css` — 2 line change
- `src/components/Membership/Membership.jsx` — 13 line changes
- `src/components/Services/Services.jsx` — 2 line change
- `src/data/animations.js` — 2 line change
- `src/jsons/animeduc2.json` — 2 line change
- `src/jsons/final5.json` — 2 line change
- `src/lib/useSiteContent.js` — 35 line changes (major CMS data fetching updates)

---

### Commit: `c7772ec` — "proper news section"
**Date:** 2026-09-17  
**Files Changed:** 7 files  
**Purpose:** News section and backdrop component additions

**Changes:**
- `admin.html` — 2 line change
- `src/App.jsx` — 12 line changes
- `src/admin/AdminApp.jsx` — 2 line change

**New Files:**
- `src/components/Backdrop/BlurredBackdrop.css` — 53 lines (new component styles)
- `src/components/Backdrop/BlurredBackdrop.jsx` — 31 lines (new backdrop component)
- `src/components/Backdrop/index.js` — 1 line (export file)

---

### Commit: `0ce14f7` — "funding"
**Date:** 2026-09-17  
**Files Changed:** 1 file  
**Purpose:** Funding-related dashboard update

**Changes:**
- `src/dashboards/ContentDashboard.jsx` — 2 line change

---

### Commit: `895ec35` — "chnages"
**Date:** 2026-09-17  
**Files Changed:** 7 files  
**Purpose:** Major CMS functionality and version history implementation

**Changes:**
- `src/dashboards/ContentDashboard.jsx` — 83 line changes (major dashboard updates)
- `src/data/animations.js` — 15 line changes
- `src/jsons/collective.json` — 1 line change
- `src/jsons/showcase.json` — 1 line change
- `src/jsons/sxs.json` — 1 line change
- `src/lib/VersionHistory.jsx` — 480 lines added (NEW: version history component)
- `src/lib/publishService.js` — 97 line changes (publish service updates)

---

### Commit: `0f9cc60` — "dsfa" (HEAD)
**Date:** 2026-09-17  
**Files Changed:** 3 files  
**Purpose:** Final adjustments to membership and dashboard

**Changes:**
- `src/components/Membership/Membership.jsx` — 8 line changes
- `src/dashboards/ContentDashboard.jsx` — 8 line changes
- `src/lib/useSiteContent.js` — 9 line changes

// src/lib/publishService.js
//
// Two shapes of data in this app:
//
// 1. "Document" dashboards (ContentDashboard) — one Firestore doc holds the
//    whole site content object (studioInfo, stats, timeline, services).
//
// 2. "Collection" dashboards (NewsEventsDashboard, LeadershipDashboard) —
//    each entry is its own Firestore doc inside a collection, so adding /
//    removing an entry doesn't touch the others.
//
// Both expose the same three actions: publish, restore, and (for collections)
// a diff-based sync so deletes actually remove docs instead of leaving orphans.
//
// Documents additionally keep a capped version history, so a previous publish
// can be reviewed and restored. See the bottom of this file.

import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, getDocs, writeBatch, query, orderBy, limit,
  addDoc
} from 'firebase/firestore'
import { db } from './firebase'

// ---------- Single document (siteContent/main) ----------

// Publishes a document, archiving whatever was live first so the previous
// version can be reviewed and restored later (see the Version history
// helpers at the bottom of this file).
//
// Pass `{ archive: false }` to skip history — only useful for migrations.
export async function publishDocument(path, data, { archive = true } = {}) {
  if (archive) {
    try {
      await archiveCurrentDocument(path)
    } catch (e) {
      // History is best-effort: a missing/denied `versions` subcollection
      // must never stop the actual publish from going through.
      console.error('publishDocument: could not archive previous version', e)
    }
  }

  const ref = doc(db, path)
  await setDoc(ref, { ...data, publishedAt: serverTimestamp() })

  if (archive) {
    pruneDocumentVersions(path).catch(e => {
      console.error('publishDocument: could not prune old versions', e)
    })
  }

  return true
}

export async function restoreDocument(path) {
  const ref = doc(db, path)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data()
}

// ---------- Collections (newsEvents, leadership) ----------
// Each item must have a stable string `id`. `orderField` (default "order")
// is used to keep dashboard ordering stable when re-fetched.

export async function publishCollection(collectionPath, items, orderField = 'order') {
  const colRef = collection(db, collectionPath)
  const existingSnap = await getDocs(colRef)
  const existingIds = new Set(existingSnap.docs.map(d => d.id))
  const incomingIds = new Set(items.map(i => String(i.id)))

  const batch = writeBatch(db)

  items.forEach((item, index) => {
    const { id, ...rest } = item
    const ref = doc(db, collectionPath, String(id))
    batch.set(ref, { ...rest, [orderField]: index, publishedAt: serverTimestamp() })
  })

  existingIds.forEach(id => {
    if (!incomingIds.has(id)) {
      batch.delete(doc(db, collectionPath, id))
    }
  })

  await batch.commit()
  return true
}

export async function restoreCollection(collectionPath, orderField = 'order') {
  const colRef = collection(db, collectionPath)
  const q = query(colRef, orderBy(orderField, 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
// ---------- Version history (single documents) ----------
//
// Every publish snapshots the copy that was live *before* the overwrite into
// a `versions` subcollection, so the layout is:
//
//   siteContent/main                 <- the live document
//   siteContent/main/versions/{id}   <- one archived copy per publish
//
// Each archived entry keeps the document's own `publishedAt` (when that
// version actually went live) plus an `archivedAt` marker (when it was
// pushed into history). History is capped at VERSION_HISTORY_LIMIT entries
// and the oldest are pruned after each successful publish.
//
// NOTE: writes to the subcollection need Firestore rules that allow
// `create`/`delete` on it, e.g.
//
//   match /siteContent/{docId}/versions/{versionId} {
//     allow read, create, delete: if <your existing admin condition>;
//   }
//
// If those rules are missing, archiving fails silently (logged to console)
// and publishing keeps working exactly as before.

export const VERSION_HISTORY_LIMIT = 20

export async function archiveCurrentDocument(path) {
  const snap = await getDoc(doc(db, path))
  if (!snap.exists()) return null

  const data = snap.data()
  if (!data) return null

  const entry = await addDoc(collection(db, path, 'versions'), {
    ...data,
    archivedAt: serverTimestamp()
  })

  return entry.id
}

export async function listDocumentVersions(path, max = VERSION_HISTORY_LIMIT) {
  const q = query(
    collection(db, path, 'versions'),
    orderBy('archivedAt', 'desc'),
    limit(max)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getDocumentVersion(path, versionId) {
  const snap = await getDoc(doc(db, path, 'versions', String(versionId)))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

async function pruneDocumentVersions(path, keep = VERSION_HISTORY_LIMIT) {
  const q = query(collection(db, path, 'versions'), orderBy('archivedAt', 'desc'))
  const snap = await getDocs(q)
  const stale = snap.docs.slice(keep)
  if (!stale.length) return 0

  const batch = writeBatch(db)
  stale.forEach(entry => batch.delete(entry.ref))
  await batch.commit()
  return stale.length
}
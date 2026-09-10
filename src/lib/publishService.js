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

import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, getDocs, writeBatch, query, orderBy
} from 'firebase/firestore'
import { db } from './firebase'

// ---------- Single document (siteContent/main) ----------

export async function publishDocument(path, data) {
  const ref = doc(db, path)
  await setDoc(ref, { ...data, publishedAt: serverTimestamp() })
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

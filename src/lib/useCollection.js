// src/hooks/useCollection.js
//
// Used by NewsEvents.jsx and the new Leadership page to read a published
// Firestore collection live. Sorted by `order` (set automatically on publish
// — see publishService.js).

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useCollection(collectionPath, orderField = 'order') {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, collectionPath), orderBy(orderField, 'asc'))
    const unsub = onSnapshot(
      q,
      snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      err => {
        console.error(`useCollection(${collectionPath}) failed`, err)
        setLoading(false)
      }
    )
    return unsub
  }, [collectionPath, orderField])

  return { items, loading }
}

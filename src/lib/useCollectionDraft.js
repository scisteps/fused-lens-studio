// src/hooks/useCollectionDraft.js
//
// Powers NewsEventsDashboard and LeadershipDashboard. Same idea as
// useDocumentDraft but for a list of entries, each with its own id.
// Publish does a full diff/sync (adds, edits, and deletes) against Firestore.
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useRef, useState, useCallback } from 'react'
import { loadDraft, saveDraft, draftSavedAt } from '../lib/localDraft'
import { publishCollection, restoreCollection } from '../lib/publishService'

export function useCollectionDraft(collectionPath, storageKey, defaultItems) {
  const [items, setItems] = useState(() => loadDraft(storageKey, defaultItems))
  const [publishedSnapshot, setPublishedSnapshot] = useState(null)
  const [status, setStatus] = useState('idle')
  const [lastLocalSave, setLastLocalSave] = useState(draftSavedAt(storageKey))
  const debounceRef = useRef(null)

useEffect(() => {
  const auth = getAuth()

  const unsubscribe = onAuthStateChanged(auth, user => {
    if (!user) return

    restoreCollection(collectionPath)
      .then(remote => {
        if (remote && remote.length) {
          setPublishedSnapshot(remote)
        }
      })
      .catch(e => {
        console.error('Could not load published snapshot', e)
      })
  })

  return unsubscribe
}, [collectionPath])
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveDraft(storageKey, items)
      setLastLocalSave(draftSavedAt(storageKey))
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [items, storageKey])

  const isDirty = publishedSnapshot
    ? JSON.stringify(items) !== JSON.stringify(publishedSnapshot.map(stripMeta))
    : true

  const publish = useCallback(async () => {
    setStatus('publishing')
    try {
      await publishCollection(collectionPath, items)
      const fresh = await restoreCollection(collectionPath)
      setPublishedSnapshot(fresh)
      setStatus('idle')
      return true
    } catch (e) {
      console.error('Publish failed', e)
      setStatus('error')
      return false
    }
  }, [collectionPath, items])

  const restoreLastPublished = useCallback(async () => {
    setStatus('restoring')
    try {
      const remote = await restoreCollection(collectionPath)
      const clean = remote.map(stripMeta)
      setItems(clean)
      setPublishedSnapshot(remote)
      saveDraft(storageKey, clean)
      setStatus('idle')
      return true
    } catch (e) {
      console.error('Restore failed', e)
      setStatus('error')
      return false
    }
  }, [collectionPath, storageKey])

  return { items, setItems, isDirty, status, lastLocalSave, publish, restoreLastPublished }
}

function stripMeta(obj) {
  const { publishedAt, order, ...rest } = obj || {}
  return rest
}

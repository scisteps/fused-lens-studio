// src/hooks/useDocumentDraft.js
//
// Powers ContentDashboard. Keeps a local draft in localStorage that updates
// on every edit (autosave to the browser, not the database), tracks whether
// the draft differs from what's actually published, and exposes publish /
// restore actions.

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadDraft, saveDraft, draftSavedAt } from '../lib/localDraft'
import { publishDocument, restoreDocument } from '../lib/publishService'

export function useDocumentDraft(docPath, storageKey, defaultValue) {
  const [data, setData] = useState(() => loadDraft(storageKey, defaultValue))
  const [publishedSnapshot, setPublishedSnapshot] = useState(null)
  const [status, setStatus] = useState('idle') // idle | saving | publishing | restoring | error
  const [lastLocalSave, setLastLocalSave] = useState(draftSavedAt(storageKey))
  const debounceRef = useRef(null)

  // On mount: fetch the currently published version, just to compare against
  useEffect(() => {
    restoreDocument(docPath)
      .then(remote => { if (remote) setPublishedSnapshot(remote) })
      .catch(e => console.error('Could not load published snapshot', e))
  }, [docPath])

  // Autosave every edit to localStorage (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveDraft(storageKey, data)
      setLastLocalSave(draftSavedAt(storageKey))
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [data, storageKey])

  const isDirty = publishedSnapshot
    ? JSON.stringify(data) !== JSON.stringify({ ...data, ...stripMeta(publishedSnapshot) })
    : true

  const publish = useCallback(async () => {
    setStatus('publishing')
    try {
      await publishDocument(docPath, data)
      setPublishedSnapshot(data)
      setStatus('idle')
      return true
    } catch (e) {
      console.error('Publish failed', e)
      setStatus('error')
      return false
    }
  }, [docPath, data])

  const restoreLastPublished = useCallback(async () => {
    setStatus('restoring')
    try {
      const remote = await restoreDocument(docPath)
      if (remote) {
        setData(stripMeta(remote))
        setPublishedSnapshot(remote)
        saveDraft(storageKey, stripMeta(remote))
      }
      setStatus('idle')
      return true
    } catch (e) {
      console.error('Restore failed', e)
      setStatus('error')
      return false
    }
  }, [docPath, storageKey])

  return { data, setData, isDirty, status, lastLocalSave, publish, restoreLastPublished }
}

function stripMeta(obj) {
  const { publishedAt, ...rest } = obj || {}
  return rest
}

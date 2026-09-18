// src/lib/useDocumentDraft.js
//
// Powers ContentDashboard. Keeps a local draft in localStorage that updates
// on every edit (autosave to the browser, not the database), tracks whether
// the draft differs from what's actually published, and exposes publish /
// restore actions.
//
// It also exposes the document's version history: every publish archives the
// version that was live beforehand, and `revertToVersion` can load one of
// those back into the working draft.

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadDraft, saveDraft, draftSavedAt } from '../lib/localDraft'
import {
  publishDocument,
  restoreDocument,
  listDocumentVersions,
  getDocumentVersion
} from '../lib/publishService'

export function useDocumentDraft(docPath, storageKey, defaultValue) {
  const [data, setData] = useState(() => loadDraft(storageKey, defaultValue))
  const [publishedSnapshot, setPublishedSnapshot] = useState(null)
  const [status, setStatus] = useState('idle') // idle | saving | publishing | restoring | error
  const [lastLocalSave, setLastLocalSave] = useState(draftSavedAt(storageKey))

  // Version history. `versions` stays null until the history panel is opened,
  // so visiting the dashboard never costs an extra query.
  const [versions, setVersions] = useState(null)
  const [historyStatus, setHistoryStatus] = useState('idle') // idle | loading | reverting | error

  const debounceRef = useRef(null)
  const historyLoadedRef = useRef(false)

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
    ? JSON.stringify(stripMeta(data)) !== JSON.stringify(stripMeta(publishedSnapshot))
    : true

  const loadVersions = useCallback(async () => {
    setHistoryStatus('loading')
    try {
      const list = await listDocumentVersions(docPath)
      setVersions(list)
      historyLoadedRef.current = true
      setHistoryStatus('idle')
      return list
    } catch (e) {
      console.error('Could not load version history', e)
      setHistoryStatus('error')
      return []
    }
  }, [docPath])

  const previewVersion = useCallback(
    versionId => getDocumentVersion(docPath, versionId),
    [docPath]
  )

  // Loads an archived version back into the *working draft*. It deliberately
  // does not publish: the admin reviews it and presses Publish, which in turn
  // archives whatever is currently live, so nothing is ever lost.
  //
  // `normalize` lets a dashboard merge an old snapshot over its current
  // defaults (a version written before a schema bump may be missing fields).
  const revertToVersion = useCallback(
    async (versionId, normalize) => {
      setHistoryStatus('reverting')
      try {
        const version = await getDocumentVersion(docPath, versionId)
        if (!version) {
          setHistoryStatus('error')
          return false
        }

        const { id: _id, archivedAt: _archivedAt, ...rest } = version
        const restored = normalize ? normalize(rest) : stripMeta(rest)

        setData(restored)
        saveDraft(storageKey, restored)
        setLastLocalSave(draftSavedAt(storageKey))
        setHistoryStatus('idle')
        return true
      } catch (e) {
        console.error('Revert failed', e)
        setHistoryStatus('error')
        return false
      }
    },
    [docPath, storageKey]
  )

  const publish = useCallback(async () => {
    setStatus('publishing')
    try {
      await publishDocument(docPath, data)
      setPublishedSnapshot(data)
      setStatus('idle')

      // The publish just archived the previous version, so refresh the history
      // list if the panel has been opened at least once.
      if (historyLoadedRef.current) {
        listDocumentVersions(docPath).then(setVersions).catch(() => {})
      }

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

  return {
    data,
    setData,
    isDirty,
    status,
    lastLocalSave,
    publish,
    restoreLastPublished,
    publishedSnapshot,
    versions,
    historyStatus,
    loadVersions,
    previewVersion,
    revertToVersion
  }
}

function stripMeta(obj) {
  const { publishedAt, ...rest } = obj || {}
  return rest
}
// src/lib/localDraft.js
//
// Every dashboard keeps its working copy in localStorage under its own key.
// This is the "unsaved changes" layer — it's what makes edits survive a
// refresh before the user hits Publish. It never talks to Firebase.

const PREFIX = 'agu-draft:'

export function loadDraft(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch (e) {
    console.error('loadDraft failed for', key, e)
    return fallback
  }
}

export function saveDraft(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    localStorage.setItem(PREFIX + key + ':savedAt', new Date().toISOString())
    return true
  } catch (e) {
    console.error('saveDraft failed for', key, e)
    return false
  }
}

export function draftSavedAt(key) {
  return localStorage.getItem(PREFIX + key + ':savedAt')
}

export function clearDraft(key) {
  localStorage.removeItem(PREFIX + key)
  localStorage.removeItem(PREFIX + key + ':savedAt')
}

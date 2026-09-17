// src/lib/newsFormat.js
// Shared formatting helpers for the News & Events page and its article view.

import { resolveImage } from '../data/images'

export const CATEGORY_LABELS = {
  event: 'Event',
  workshop: 'Workshop',
  news: 'News',
  showcase: 'Showcase'
}

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'event', label: 'Events' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'news', label: 'News' },
  { id: 'showcase', label: 'Showcases' }
]

export const SOCIAL_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'X',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok'
}

// An entry image stores either a stable library id (resolved locally, so a
// deploy that re-hashes assets cannot break it) or an uploaded Storage URL.
export const imageSource = image => resolveImage(image?.imageId) || image?.url || image?.src

export const categoryLabel = id => CATEGORY_LABELS[id] || id || 'Update'

export const formatDate = date => {
  if (!date) return ''
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// A blank line starts a new paragraph. If the writer used single line breaks
// only, fall back to those so a pasted document still breaks sensibly.
export const toParagraphs = text => {
  const value = String(text || '').trim()
  if (!value) return []
  const blocks = value.split(/\n{2,}/).map(block => block.trim()).filter(Boolean)
  if (blocks.length > 1) return blocks
  return value.split(/\n+/).map(block => block.trim()).filter(Boolean)
}

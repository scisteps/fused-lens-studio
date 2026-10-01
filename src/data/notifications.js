// src/data/notifications.js
//
// The shape of a notification and the choices the dashboard offers.
//
// A notification is a short, public message shown in the bell menu. It always
// carries a title, a subtitle and a square image, and it points somewhere
// useful. Everything here is data, so the secretariat can add a kind of
// notification without touching a component.

// ── Image dimensions ────────────────────────────────────────────────────────
// One source of truth for the thumbnail size, shared by the bell list, the
// dashboard preview and the CSS, so the three can never drift apart.
//
// The box is a true SQUARE: the image is forced to a 1:1 aspect ratio and
// centre-cropped with object-fit, so an admin can upload any photo and it will
// still sit in a tidy 100x100 tile instead of stretching.
export const NOTIFICATION_IMAGE_SIZE = 100

// A good size to EXPORT at. Larger than the tile so it stays sharp on
// high-density screens and can be zoomed; square, so nothing is cropped away.
export const NOTIFICATION_IMAGE_UPLOAD_SIZE = 400

// ── Where a notification can point ───────────────────────────────────────────
//   article — one specific news story (members only)
//   news    — the news index page
//   login   — straight to the sign-in page
export const NOTIFICATION_TYPES = [
  {
    id: 'article',
    label: 'News article',
    hint: 'Links to one story. Members must sign in to read it.'
  },
  {
    id: 'news',
    label: 'News page',
    hint: 'Links to the news index.'
  },
  {
    id: 'login',
    label: 'Log in',
    hint: 'Sends a visitor to the sign-in page.'
  }
]

export const NOTIFICATION_TYPE_IDS = NOTIFICATION_TYPES.map((type) => type.id)

/** Types whose destination is member-only and needs the auth gate. */
export const MEMBER_ONLY_TYPES = ['article']

export function isValidNotificationType(value) {
  return NOTIFICATION_TYPE_IDS.includes(value)
}

/**
 * Resolve a notification to the route it should open.
 *
 * Returns '' for a notification that cannot be resolved yet (an article type
 * with no story chosen), so the caller can render it inert rather than
 * sending a visitor somewhere meaningless.
 */
export function notificationHref(notification) {
  const type = notification?.type

  if (type === 'article') {
    return notification.articleId
      ? `/news-events?article=${encodeURIComponent(notification.articleId)}`
      : ''
  }

  if (type === 'news') return '/news-events'
  if (type === 'login') return '/login'

  return ''
}

/** True when following this notification needs a signed-in member. */
export function notificationNeedsAuth(notification) {
  return MEMBER_ONLY_TYPES.includes(notification?.type)
}

// ── Seed content ────────────────────────────────────────────────────────────
// Shown only when the collection has never been published, so the bell is not
// empty on a fresh install. Edit or delete freely in the dashboard.
export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'grand-launch',
    title: 'The Grand Launch is here',
    subtitle: 'Join the Guild, our sponsors and partners in Kampala on 15 September.',
    imageId: 'agu4',
    type: 'article',
    articleId: 'grand-launch'
  },
  {
    id: 'uff-recap',
    title: 'We represented the industry at UFF',
    subtitle: 'Guild members took the stage to present the national animation awards.',
    imageId: 'uff',
    type: 'article',
    articleId: 'uff-2026'
  },
  {
    id: 'latest-news',
    title: 'Missed a story?',
    subtitle: 'Every workshop, screening and showcase from the Guild, in one place.',
    imageId: 'agu3',
    type: 'news'
  }
]

import animeduc from '../jsons/animeduc.json';
import prodevt from '../jsons/prodevt2.json';
import final from '../jsons/final.json';

// CMS-selectable icons (Lottie animations). `id` is what gets stored on
// service.icon in Firestore via the Content Dashboard.
export const serviceAnimationChoices = [
  { id: 'prodevt', label: 'Professional growth (orange swirl)', data: prodevt },
  { id: 'animeduc', label: 'Education (classroom)', data: animeduc },
  { id: 'final', label: 'Showcase (finale reel)', data: final },
];

// Lookup by CMS icon id. Numeric keys kept for backwards compat with the
// old hard-coded service.id -> animation mapping.
export const serviceAnimations = {
  prodevt,
  animeduc,
  final,
  1: prodevt,
  2: animeduc,
};

export function resolveServiceAnimation(icon) {
  if (!icon) return null;
  return serviceAnimations[icon] || serviceAnimations[String(icon)] || null;
}

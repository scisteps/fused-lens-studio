import animeduc from '../jsons/animeduc2.json';
import prodevt from '../jsons/prodevt2.json';
import showcase from '../jsons/showcase.json';
import collective from '../jsons/collective.json';

import final from '../jsons/final.json';

// CMS-selectable icons (Lottie animations). `id` is what gets stored on
// service.icon in Firestore via the Content Dashboard.
export const serviceAnimationChoices = [
  { id: 'prodevt', label: 'Professional growth (orange swirl)', data: prodevt },
  { id: 'animeduc', label: 'Education (services)', data: animeduc },
    { id: 'showcase', label: 'Showcase (services)', data: showcase },
    { id: 'collective', label: 'collective (services)', data: collective },

  { id: 'final', label: 'Logo animation', data: final },
];

// Lookup by CMS icon id. Numeric keys kept for backwards compat with the
// old hard-coded service.id -> animation mapping.
export const serviceAnimations = {
  prodevt,
  animeduc,
  final,
  showcase,
  collective,
  1: prodevt,
  2: animeduc,
    3: showcase,
  4: collective,

};

export function resolveServiceAnimation(icon) {
  if (!icon) return null;
  return serviceAnimations[icon] || serviceAnimations[String(icon)] || null;
}

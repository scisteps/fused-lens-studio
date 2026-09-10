// Using high-quality Unsplash images for the photography studio
// These are curated professional photography images
import uff from '../Images/uff.jpg';
import agu1 from '../Images/agu2.jpg';
import agu3 from '../Images/agu3.jpg';
import agu4 from '../Images/agu4.jpg';
import native from '../Images/native.jpg';
import richard from '../Images/richard.jpg';
import denis1 from '../Images/denis1.jpg';
import denis2 from '../Images/denis2.jpg';
import denis3 from '../Images/denis3.jpg';
import retro from '../Images/retro.jpg';
import native2 from '../Images/native2.jpg';
import native3 from '../Images/native3.jpg';
import native4 from '../Images/native4.jpg';
import logotxt from '../Images/logot.png';

import jagwe from '../Images/jagwe.jpg';
import jagwe2 from '../Images/jagwe2.jpg';

export const heroSlides = [
  {
    id: 1,
    imageId: 'uff',
    image: uff,
    title: 'Unity in',
    subtitle: 'Animation'
  },
  {
    id: 2,
    imageId: 'agu4',
    image: agu4,
    title: 'The Uganda animators',
    subtitle: 'Coming together'
  },
  {
    id: 3,
    imageId: 'native',
    image: native,
    title: 'Every Frame',
    subtitle: 'A Masterpiece'
  },
  {
    id: 4,
    imageId: 'agu4',
    image: agu4,
    title: 'Motion',
    subtitle: 'Captured Forever'
  }
]

export const portfolioImages = [
  {
    id: 1,
    src: native,
    srcLarge: native2,
    title: 'Eternal Vows',
    category: 'events',
    aspect: 'landscape'
  },
  {
    id: 2,
    src: denis1,
    srcLarge: denis2,
    title: 'Editorial Portrait',
    category: 'portrait',
    aspect: 'portrait'
  },
  {
    id: 3,
    src:agu3,
    srcLarge: agu3,
    title: 'Product Showcase',
    category: 'parties',
    aspect: 'square'
  },
  {
    id: 4,
    src: agu1,
    srcLarge: agu1,
    title: 'Corporate Gala',
    category: 'event',
    aspect: 'landscape'
  },
  {
    id: 5,
    src: agu1,
    srcLarge: agu1,
    title: 'First Dance',
    category: 'meetings',
    aspect: 'portrait'
  },
  {
    id: 6,
    src: agu1,
    srcLarge: agu1,
    title: 'Character Study',
    category: 'portrait',
    aspect: 'portrait'
  },
  {
    id: 7,
    src: agu3,
    srcLarge: agu1,
    title: 'Audio Excellence',
    category: 'events',
    aspect: 'square'
  },
  {
    id: 8,
    src:native2,
    srcLarge: native3,
    title: 'meetings',
    category: 'event',
    aspect: 'landscape'
  },
  {
    id: 9,
    src:native4,
    srcLarge: richard,
    title: 'Rendering',
    category: 'meetings',
    aspect: 'landscape'
  },
  {
    id: 10,
    src: denis2,
    srcLarge: denis1,
    title: 'Meetings',
    category: 'portrait',
    aspect: 'portrait'
  },
  {
    id: 11,
    src: retro,
    srcLarge:denis3,
    title: 'Retail Space',
    category: 'Parties',
    aspect: 'landscape'
  },
  {
    id: 12,
    src: jagwe,
    srcLarge: jagwe2,
    title: 'Birthday Bash',
    category: 'event',
    aspect: 'landscape'
  }
]

export const categories = [
  { id: 'events', label: 'Events' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'portrait', label: 'Vibes' },
  { id: 'Vibes', label: 'Parties' },
  { id: 'event', label: 'Events' }
]

export const aboutImage = agu1

// Stable IDs are stored in Firestore; the source URLs are resolved locally so
// a production asset hash changing after a deployment cannot break content.
export const imageOptions = [
  { id: 'uff', label: 'Uganda Film Festival', src: uff },
  { id: 'agu1', label: 'Guild gathering', src: agu1 },
  { id: 'agu3', label: 'Animation Guild group', src: agu3 },
  { id: 'agu4', label: 'Guild event', src: agu4 },
  { id: 'native', label: 'Animation artwork', src: native },
  { id: 'richard', label: 'Richard', src: richard },
  { id: 'denis1', label: 'Denis portrait', src: denis1 },
  { id: 'denis2', label: 'Denis at work', src: denis2 },
  { id: 'denis3', label: 'Denis group', src: denis3 },
  { id: 'retro', label: 'Retro artwork', src: retro },
  { id: 'native2', label: 'Animation artwork detail', src: native2 },
  { id: 'native3', label: 'Animation artwork close-up', src: native3 },
  { id: 'native4', label: 'Animation artwork scene', src: native4 },
  { id: 'jagwe', label: 'Jagwe', src: jagwe },
  { id: 'jagwe2', label: 'Jagwe group', src: jagwe2 }
]

export function resolveImage(imageId) {
  return imageOptions.find(image => image.id === imageId)?.src
}

export const heroVideo = null // Can be set to a video URL if needed

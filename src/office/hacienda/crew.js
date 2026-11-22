// The Hacienda's crew: Krafted Lab's bot team. Everyone wears the lime Krafted Lab hoodie with black pants; hair,
// skin and accessories tell them apart (the same characters as the 2D hub's pixel crew).

export const LIME = '#C9EF36';
export const INK = '#1C1F18';
export const ORANGE = '#F26522';

// The Labs: each is a team, so its bots share a pod or a department room (net/live.js groups by project).
export const LABS = {
  founder: "Founder's Lab",
  money: 'Money Lab',
  brand: 'Brand Lab',
  flow: 'Flow Lab',
  content: 'Content Lab',
  learn: 'Learning Lab',
};
export const labOf = (dept) => LABS[dept] || LABS.learn;

// skin tones, light to deep
const SKIN = { a: '#F7D4B2', b: '#EAB58B', c: '#CF9465', d: '#A36B45', e: '#7A4A2C' };
// styles the rig knows: bob, spiky, ponytail, bun, plain, curly; accessories: headphones, glasses, beanie, cap
const CREW = {
  bez: { hair: '#1E1A17', style: 'plain', acc: 'glasses', skin: 'c' },
  loidie: { hair: '#B9A6FF', style: 'bob', acc: 'glasses', skin: 'a' },
  scoutie: { hair: '#F26522', style: 'plain', acc: 'cap', skin: 'b' },
  pitchie: { hair: '#F3EEDB', style: 'plain', acc: 'headphones', skin: 'd' },
  proofie: { hair: '#0D3B2A', style: 'bun', acc: 'glasses', skin: 'b' },
  brandie: { hair: '#FF7A59', style: 'ponytail', acc: null, skin: 'a' },
  storie: { hair: '#8A4B22', style: 'curly', acc: null, skin: 'e' },
  kraftie: { hair: '#D4F53C', style: 'spiky', acc: null, skin: 'c' },
  replie: { hair: '#5EE0C0', style: 'ponytail', acc: 'headphones', skin: 'b' },
  sopie: { hair: '#1E1A17', style: 'bun', acc: 'glasses', skin: 'a' },
  contentie: { hair: '#FF5D8F', style: 'curly', acc: null, skin: 'd' },
  selfie: { hair: '#F26522', style: 'spiky', acc: 'glasses', skin: 'c' },
  tubie: { hair: '#C0392B', style: 'plain', acc: 'headphones', skin: 'b' },
  teachie: { hair: '#C9CCD2', style: 'bob', acc: 'glasses', skin: 'c' },
  nextie: { hair: '#7CC7FF', style: 'spiky', acc: null, skin: 'a' },
  talkie: { hair: '#0D3B2A', style: 'ponytail', acc: 'headphones', skin: 'e' },
};
const HAIRS = ['#F26522', '#D4F53C', '#F3EEDB', '#0D3B2A', '#FF7A59', '#5EE0C0', '#B9A6FF', '#5A3420', '#1E1A17'];
const STYLES = ['bob', 'spiky', 'ponytail', 'bun', 'plain', 'curly'];
const hashOf = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** the rig's look for a bot, by its name (a bot added later gets a look of its own from its name) */
export function crewLook(name) {
  const key = String(name || '').toLowerCase(), h = hashOf(key);
  const c = CREW[key] || { hair: HAIRS[h % HAIRS.length], style: STYLES[(h >>> 4) % STYLES.length], acc: (h >>> 8) % 3 ? null : 'glasses', skin: 'abcde'[(h >>> 10) % 5] };
  return { shirt: LIME, outfit: 'hoodie', pants: '#1F1F22', shoes: '#F4F3EE', hair: c.hair, style: c.style, acc: c.acc, skin: SKIN[c.skin] };
}

// Vee, the director: curly brown hair, round glasses, the same hoodie
export const VEE = { shirt: LIME, outfit: 'hoodie', pants: '#1F1F22', shoes: '#F4F3EE', hair: '#5A3420', style: 'curly', acc: 'glasses', skin: SKIN.b };

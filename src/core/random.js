// Generador pseudoaleatori determinista (mulberry32). Mateixa seed → mateixa seqüència.
export function createRng(seed = 1) {
  let a = hashSeed(seed) >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed | 0;
  const s = String(seed);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// Exigència d'un exercici (no només dificultat tècnica) i capacitat estimada amb pes corporal. JS pur.
import { getRequirements, COMPOUND_PATTERNS } from './requirements.js';

const HARD = /pistol|nordic|glute[- ]?ham|single[- ]leg|one[- ]leg|archer|weighted|deficit|decline push|feet elevated|handstand|muscle up|clap|plyo|bulgarian|sissy|pull-?ups?|pullups|chin-?up|\bdips?\b|jump|bound|sprint|tire flip|sled|carry|farmer|thruster|burpee|1½/i;
const EASY = /wall push|incline push-up|knee push|kneeling (push|squat)|bodyweight squat|chair squat|sit squats|crunch|butt lift|(?<!single leg )glute bridge|bridge\)|glute kickback|leg lift|side leg raise|flutter|air bike|band assisted|assisted|toe touch|heel touch|mountain climbers|cocoons|step-up with knee raise|leg pull-in|scissor|dead bug|superman|isometric|hug|wipers|pelvic tilt|frog sit|3\/4 sit-up|plank$/i;

export const LEVEL_DEMAND_WEIGHT = { novice: 0, beginner: 0.6, intermediate: 1, advanced: 1.4 };

/** Puntuació d'exigència (≈ −4 … +8). Positiu = exigent. */
export function demandScore(ex) {
  const name = ex.nameEn || ex.name;
  const r = getRequirements(ex);
  let s = 0;
  if (ex.mechanic === 'compound' || COMPOUND_PATTERNS.includes(r.pattern)) s += 2;
  if (r.load) s += 2;
  if (r.unilateral) s += 1;
  if (ex.level === 'intermediate') s += 1;
  if (ex.level === 'expert') s += 2;
  if (HARD.test(name)) s += 2;
  if (EASY.test(name) && !r.load) s -= 6;
  return s;
}

// Reps màximes típiques amb pes corporal per patró i nivell (orientatiu)
const BW_REPS = {
  horizontal_push: { novice: 5, beginner: 12, intermediate: 25, advanced: 40 },
  vertical_pull: { novice: 1, beginner: 3, intermediate: 8, advanced: 15 },
  horizontal_pull: { novice: 6, beginner: 10, intermediate: 15, advanced: 22 },
  vertical_push: { novice: 3, beginner: 6, intermediate: 12, advanced: 20 },
  squat: { novice: 20, beginner: 35, intermediate: 50, advanced: 70 },
  lunge: { novice: 10, beginner: 15, intermediate: 22, advanced: 30 },
  hinge: { novice: 15, beginner: 25, intermediate: 35, advanced: 45 },
  bridge: { novice: 20, beginner: 30, intermediate: 40, advanced: 50 },
  dips: { novice: 3, beginner: 8, intermediate: 15, advanced: 25 },
};

function variantFactor(name) {
  let f = 1;
  if (/pistol/i.test(name)) f *= 0.15;
  if (/nordic|glute[- ]?ham/i.test(name)) f *= 0.1;
  if (/one[- ]arm|single[- ]arm/i.test(name)) f *= 0.12;
  if (/archer/i.test(name)) f *= 0.35;
  if (/decline|feet elevated|feet on/i.test(name)) f *= 0.7;
  if (/close|triceps position|diamond/i.test(name)) f *= 0.8;
  if (/incline push|wall/i.test(name)) f *= 1.6;
  if (/knee|kneeling/i.test(name)) f *= 2;
  if (/single[- ]leg|one[- ]leg/i.test(name) && !/pistol/i.test(name)) f *= 0.45;
  if (/bulgarian|split squat/i.test(name)) f *= 0.6;
  if (/handstand/i.test(name)) f *= 0.35;
  if (/muscle up/i.test(name)) f *= 0.3;
  if (/pike/i.test(name)) f *= 0.8;
  if (/\bdips?\b/i.test(name) && /bench|chair/i.test(name)) f *= 2.2;
  return f;
}

/**
 * Reps màximes estimades d'un exercici sense càrrega externa (null si no té sentit: core, isomètrics, salts).
 * Fa servir les referències del perfil (flexions i dominades màximes) si n'hi ha.
 */
export function bodyweightCapacity(ex, profile = {}) {
  const r = getRequirements(ex);
  if (r.load || r.jump || ex.seconds) return null;
  const table = /\bdips?\b/i.test(ex.nameEn || ex.name) ? BW_REPS.dips : BW_REPS[r.pattern];
  if (!table) return null;
  const level = profile.level || 'intermediate';
  let base = table[level] ?? table.intermediate;
  const refs = profile.referenceLifts || {};
  if (r.pattern === 'horizontal_push' && refs.pushups > 0) base = refs.pushups;
  if (r.pattern === 'vertical_pull' && refs.pullups > 0) base = refs.pullups;
  if (profile.sex === 'female' && ['horizontal_push', 'vertical_pull', 'vertical_push'].includes(r.pattern) && !(refs.pushups || refs.pullups)) base *= 0.6;
  return Math.max(1, Math.round(base * variantFactor(ex.nameEn || ex.name)));
}

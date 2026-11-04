// Estimació de l'1RM per exercici a partir del perfil (secció 8.2). JS pur.
// Valors conservadors i orientatius: es mostren sempre com "estimació — ajusta-ho amb el RIR".
import { getRequirements } from './requirements.js';

// Aixecaments de referència × pes corporal per nivell (secció 6, valors orientatius)
const STANDARDS = {
  bench: { novice: 0.5, beginner: 0.7, intermediate: 1.0, advanced: 1.25 },
  squat: { novice: 0.75, beginner: 1.0, intermediate: 1.25, advanced: 1.75 },
  deadlift: { novice: 1.0, beginner: 1.25, intermediate: 1.5, advanced: 2.0 },
  ohp: { novice: 0.35, beginner: 0.45, intermediate: 0.65, advanced: 0.8 },
  row: { novice: 0.45, beginner: 0.6, intermediate: 0.8, advanced: 1.0 },
};
const FEMALE = { bench: 0.6, squat: 0.7, deadlift: 0.75, ohp: 0.6, row: 0.65 };

/** 1RM estimat amb Epley (només fins a 10 reps). */
export function epley1RM(kg, reps) {
  if (!(kg > 0) || !(reps > 0)) return null;
  if (reps === 1) return kg;
  if (reps > 10) return null;
  return kg * (1 + reps / 30);
}

/** Pes que permet fer `reps` amb `rir` a la recambra, segons l'1RM. */
export function loadForReps(oneRM, reps, rir = 0) {
  return oneRM / (1 + (reps + rir) / 30);
}

/** Reps a fallada possibles amb una càrrega. */
export function repsToFailure(oneRM, kg) {
  if (!(kg > 0)) return Infinity;
  return Math.max(0, 30 * (oneRM / kg - 1));
}

/** 1RM d'un aixecament base: primer les referències del perfil, si no, els estàndards per nivell. */
export function baseLift1RM(lift, profile = {}) {
  const ref = profile.referenceLifts?.[lift];
  if (ref?.kg && ref?.reps) {
    const v = epley1RM(ref.kg, ref.reps);
    if (v) return { kg: v, fromReference: true };
  }
  const bw = profile.bodyWeightKg || 75;
  const level = profile.level || 'beginner';
  let r = STANDARDS[lift]?.[level] ?? 0.5;
  if (profile.sex === 'female') r *= FEMALE[lift] ?? 0.7;
  return { kg: bw * r, fromReference: false };
}

const PATTERN_LIFT = {
  horizontal_push: 'bench', vertical_push: 'ohp', squat: 'squat', lunge: 'squat', hinge: 'deadlift',
  horizontal_pull: 'row', vertical_pull: 'row', carry: 'deadlift',
  'iso:biceps': 'row', 'iso:triceps': 'bench', 'iso:chest': 'bench', 'iso:side-delts': 'ohp',
  'iso:front-delts': 'ohp', 'iso:rear-delts': 'ohp', 'iso:quads': 'squat', 'iso:hamstrings': 'deadlift',
  'iso:calves': 'squat', 'iso:glutes': 'deadlift', 'iso:traps': 'deadlift', 'iso:lats': 'row',
  'iso:middle-back': 'row', 'iso:forearms': 'row', 'iso:lower-back': 'deadlift', 'iso:adductors': 'squat', 'iso:abductors': 'squat',
};

// Factor (fracció de l'1RM de l'aixecament base) per patró i classe d'implement.
// dumbbell = per mancuerna quan es fan servir dues; single = un sol implement.
const FACTORS = {
  horizontal_push: { barbell: 1, dumbbell: 0.37, single: 0.45, stack: 0.9, vest: 0.25 },
  vertical_push: { barbell: 1, dumbbell: 0.38, single: 0.42, stack: 0.9, vest: 0.2 },
  squat: { barbell: 1, dumbbell: 0.28, single: 0.4, stack: 1.6, vest: 0.35 },
  lunge: { barbell: 0.45, dumbbell: 0.2, single: 0.3, stack: 0.8, vest: 0.3 },
  hinge: { barbell: 0.75, dumbbell: 0.3, single: 0.4, stack: 0.8, vest: 0.4 },
  horizontal_pull: { barbell: 1, dumbbell: 0.4, single: 0.45, stack: 1, vest: 0.25 },
  vertical_pull: { barbell: 0.9, dumbbell: 0.4, single: 0.4, stack: 1.0, vest: 0.15 },
  carry: { barbell: 0.6, dumbbell: 0.45, single: 0.6, stack: 0.6, vest: 0.5 },
  iso: { barbell: 0.35, dumbbell: 0.15, single: 0.2, stack: 0.45, vest: 0.2 },
  'iso:quads': { stack: 0.5, dumbbell: 0.15, single: 0.2, barbell: 0.35, vest: 0.3 },
  'iso:hamstrings': { stack: 0.35, dumbbell: 0.12, single: 0.15, barbell: 0.3, vest: 0.2 },
  'iso:calves': { stack: 0.9, dumbbell: 0.25, single: 0.35, barbell: 0.8, vest: 0.4 },
  'iso:side-delts': { stack: 0.2, dumbbell: 0.12, single: 0.15, barbell: 0.3, vest: 0.1 },
  'iso:rear-delts': { stack: 0.2, dumbbell: 0.1, single: 0.12, barbell: 0.3, vest: 0.1 },
  'iso:traps': { barbell: 0.6, dumbbell: 0.3, single: 0.35, stack: 0.6, vest: 0.3 },
};

export function implementClass(implement, pair) {
  if (!implement) return null;
  if (['barbell', 'ez_bar', 'trap_bar'].includes(implement)) return 'barbell';
  if (implement === 'cable' || implement.startsWith('machine:')) return 'stack';
  if (['weight_vest', 'backpack'].includes(implement)) return 'vest';
  return pair ? 'dumbbell' : 'single';
}

function nameModifier(name) {
  let m = 1;
  if (/incline/i.test(name)) m *= 0.85;
  if (/close-grip|close grip/i.test(name)) m *= 0.9;
  if (/front (barbell )?squat|zercher/i.test(name)) m *= 0.8;
  if (/^(barbell )?deadlift$|sumo deadlift|trap bar deadlift/i.test(name)) m *= 1.33;
  if (/hip thrust|glute bridge/i.test(name)) m *= 1.4;
  if (/good morning/i.test(name)) m *= 0.55;
  if (/swing/i.test(name)) m *= 0.7;
  if (/fly|flye|crossover|pec deck|butterfly/i.test(name)) m *= 0.45;
  if (/pullover/i.test(name)) m *= 0.5;
  if (/kickback/i.test(name)) m *= 0.6;
  if (/one[- ]arm|single[- ]arm/i.test(name) && /row/i.test(name)) m *= 1.1;
  return m;
}

/**
 * 1RM estimat d'un exercici concret amb un implement concret.
 * @returns {{ kg, estimated: true, fromReference }} | null si l'exercici no porta càrrega externa
 */
export function estimateExercise1RM(ex, profile, implement) {
  const r = getRequirements(ex);
  if (!r.load || !implement) return null;
  const pattern = r.pattern;
  const lift = PATTERN_LIFT[pattern] || 'row';
  const base = baseLift1RM(lift, profile);
  const cls = implementClass(implement, r.load.pair);
  const table = FACTORS[pattern] || FACTORS.iso;
  const f = table[cls] ?? FACTORS.iso[cls] ?? 0.3;
  const kg = base.kg * f * nameModifier(ex.nameEn || ex.name);
  return { kg, estimated: true, fromReference: base.fromReference };
}

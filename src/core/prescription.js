// Sèries, reps, descans i RIR per objectiu i nivell (secció 8.1). JS pur.

export const GOALS = ['muscle', 'strength', 'fatloss', 'endurance', 'power', 'agentRural'];
export const LEVELS = ['novice', 'beginner', 'intermediate', 'advanced'];

export const GOAL_LABELS = {
  muscle: 'Guanyar múscul',
  strength: 'Guanyar força',
  fatloss: 'Perdre greix',
  endurance: 'Resistència muscular',
  power: 'Potència i explosivitat',
  agentRural: 'Proves Agent Rural',
};

export const LEVEL_LABELS = { novice: 'Novell', beginner: 'Principiant', intermediate: 'Intermedi', advanced: 'Avançat' };

// Esquemes base: [sèries, repsMin, repsMax, RIR, descans (s)]
const SCHEMES = {
  muscle: { compound: [4, 6, 10, 2, 120], isolation: [3, 10, 15, 1, 75] },
  strength: { compound: [4, 3, 6, 2, 180], isolation: [3, 6, 10, 2, 120] },
  fatloss: { compound: [3, 10, 15, 2, 45], isolation: [3, 10, 15, 2, 45] },
  endurance: { compound: [3, 15, 25, 2, 45], isolation: [2, 15, 25, 2, 40] },
  power: { compound: [4, 3, 5, 3, 150], isolation: [3, 6, 10, 2, 90], explosive: [4, 3, 5, 3, 150] },
  agentRural: { compound: [4, 5, 6, 2, 180], isolation: [3, 8, 12, 2, 90], explosive: [4, 4, 6, 3, 150] },
};

// Duració → nombre d'exercicis (secció 7.2)
const COUNT_BY_DURATION = { 20: 3, 30: 4, 45: 5, 60: 6, 75: 7, 90: 8 };
export const DURATIONS = [20, 30, 45, 60, 75, 90];

export function exerciseCount(durationMin, goal) {
  const d = DURATIONS.reduce((best, x) => (Math.abs(x - durationMin) < Math.abs(best - durationMin) ? x : best), 45);
  let n = COUNT_BY_DURATION[d];
  if (goal === 'strength' || goal === 'power') n = Math.max(3, n - 1); // descansos llargs
  return n;
}

export function isTimed(ex) {
  const n = ex.nameEn || ex.name;
  return !!ex.seconds || /plank|hold|wall sit|hang\b|vacuum|isometric|side bridge|farmer|walk|carry|battling ropes|rope jumping/i.test(n);
}

/**
 * Prescripció per a un exercici dins d'una franja.
 * @param slotKind 'a' | 'b' | 'c' | 'd'
 */
export function prescribe({ goal = 'muscle', level = 'intermediate', ex, slotKind = 'c', compound = false, explosive = false }) {
  const g = SCHEMES[goal] || SCHEMES.muscle;
  let scheme = explosive && g.explosive ? g.explosive : compound ? g.compound : g.isolation;
  let [sets, lo, hi, rir, rest] = scheme;

  // Nivell: novells i principiants fan menys sèries; avançats, una més als compostos
  if (level === 'novice') sets = Math.max(2, sets - 2);
  else if (level === 'beginner') sets = Math.max(2, sets - 1);
  else if (level === 'advanced' && compound) sets += 1;
  if (slotKind === 'd') sets = Math.min(sets, 3);

  // Agent Rural: blocs específics
  if (goal === 'agentRural' && ex?.agentRural) {
    if (ex.emom) return { sets: 10, repsLow: 8, repsHigh: 10, rir: 3, restSec: 0, emom: true, note: 'EMOM 10′: cada minut, 8–10 reps a 40 kg' };
    if (ex.isTest) return { sets: 1, seconds: 45, rir: 0, restSec: 0, note: 'Test: màximes reps en 45 s (cada 3–4 setmanes)' };
    if (ex.fixedLoadKg) return { sets: 3, repsLow: 15, repsHigh: 20, rir: 2, restSec: 150, note: 'Ritme de prova: 1 rep cada ~1,6 s (metrònom)' };
  }

  if (ex && isTimed(ex)) {
    const s = ex.seconds || (goal === 'endurance' || goal === 'fatloss' ? 45 : 30);
    return { sets: Math.min(sets, 3), seconds: s, rir: 2, restSec: Math.min(rest, 75) };
  }
  if (explosive) rir = 3;
  return { sets, repsLow: lo, repsHigh: hi, rir, restSec: rest };
}

/** Durada estimada d'un exercici en minuts: Σ sèries × (reps × 3 s + descans). */
export function exerciseMinutes(p) {
  const work = p.seconds ? p.seconds : ((p.repsLow + p.repsHigh) / 2) * 3;
  const per = p.emom ? 60 : work + (p.restSec || 0);
  return (p.sets * per) / 60;
}

// Sessió en directe: la seqüència de passos a seguir i el resum final. JS pur.
import { setWorkSec, BLOCK_CHANGE_SEC } from './blocks.js';

export const SESSION_SCHEMA_VERSION = 1;

/**
 * Passos de la sessió, en ordre:
 *  escalfament → per cada bloc i ronda: A, canvi, B, canvi, C, descans de ronda (o canvi de bloc) → estiraments.
 * Cada pas porta `estSec` (durada aproximada) per al mode automàtic.
 */
export function buildTimeline(workout) {
  const steps = [];
  const push = (s) => steps.push({ id: steps.length, ...s });
  for (const w of workout.warmup || []) {
    push({ phase: 'warmup', kind: w.kind, title: w.name || null, exerciseId: w.exerciseId || null, seconds: w.seconds || null, reps: w.reps ? { low: w.reps, high: w.reps } : null, loadKg: w.loadKg ?? null, estSec: w.seconds || 45 });
  }
  const blocks = workout.blocks || [];
  blocks.forEach((b, bi) => {
    const members = b.entries.map((i) => ({ e: workout.exercises[i], i }));
    for (let r = 1; r <= b.rounds; r++) {
      members.forEach(({ e, i }, k) => {
        const set = e.sets[Math.min(r - 1, e.sets.length - 1)] || e.sets[0];
        push({
          phase: 'main', kind: 'exercise', exerciseId: e.exerciseId, entryIndex: i, block: bi, blockLabel: b.label, round: r, rounds: b.rounds, pos: e.pos,
          seconds: set.seconds || null, reps: set.seconds ? null : { low: set.repsLow, high: set.repsHigh },
          perSide: !!e.unilateral, loadKg: set.loadKg ?? null, setup: set.loadSetup || null, tempo: e.tempo || null, rir: set.rir,
          estSec: setWorkSec(set, e.unilateral),
        });
        const last = k === members.length - 1;
        if (!last && b.transitionSec > 0) push({ phase: 'rest', kind: 'transition', block: bi, round: r, seconds: b.transitionSec, estSec: b.transitionSec });
        if (last && r < b.rounds) push({ phase: 'rest', kind: 'round', block: bi, round: r, seconds: b.restAfterRoundSec, estSec: b.restAfterRoundSec });
        if (last && r === b.rounds && bi < blocks.length - 1) push({ phase: 'rest', kind: 'block', block: bi, seconds: BLOCK_CHANGE_SEC, estSec: BLOCK_CHANGE_SEC });
      });
    }
  });
  for (const c of workout.cooldown || []) {
    const sec = (c.seconds || 30) * (c.perSide ? 2 : 1);
    push({ phase: 'cooldown', kind: c.kind, title: c.name || null, exerciseId: c.exerciseId || null, seconds: sec, perSide: !!c.perSide, estSec: sec });
  }
  return steps;
}

export function timelineSeconds(steps) {
  return steps.reduce((s, x) => s + (x.estSec || 0), 0);
}

/** Següent pas d'exercici (per mostrar "Després: …"). */
export function nextExerciseStep(steps, index) {
  for (let i = index + 1; i < steps.length; i++) if (steps[i].phase !== 'rest') return steps[i];
  return null;
}

/**
 * Resum que es desa a l'historial.
 * @param log { [stepId]: { reps, kg, done } } — el que s'ha registrat a cada pas d'exercici
 */
export function summarizeSession({ workout, steps, log = {}, startedAt, endedAt, id }) {
  const sets = [];
  for (const s of steps) {
    if (s.phase !== 'main') continue;
    const l = log[s.id];
    if (!l?.done) continue;
    const e = workout.exercises[s.entryIndex];
    sets.push({
      exerciseId: s.exerciseId, block: s.block, round: s.round, pos: s.pos,
      reps: l.reps ?? null, seconds: s.seconds ?? null, loadKg: l.kg ?? null, pair: !!e?.weight?.pair,
      primary: e?.primary || [], secondary: e?.secondary || [],
    });
  }
  const mainTotal = steps.filter((s) => s.phase === 'main').length;
  const volumeKg = Math.round(sets.reduce((v, x) => v + (x.loadKg && x.reps ? x.loadKg * x.reps * (x.pair ? 2 : 1) : 0), 0));
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    id,
    workoutId: workout.id,
    title: workout.title,
    locationName: workout.locationName,
    goal: workout.goal,
    goalLabel: workout.goalLabel,
    startedAt,
    endedAt,
    durationSec: Math.max(0, Math.round((endedAt - startedAt) / 1000)),
    setsDone: sets.length,
    setsPlanned: mainTotal,
    volumeKg,
    sets,
  };
}

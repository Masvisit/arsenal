// Generador d'entrenaments determinista (secció 7). JS pur, sense IA.
import { exerciseTargets, TARGET_SIZE, TARGET_LABELS, workoutTitle } from './muscles.js';
import { getRequirements, feasibility, limitationConflicts, COMPOUND_PATTERNS } from './requirements.js';
import { locationCapabilities, newId } from './inventory.js';
import { CATALOG_BY_ID } from './catalog.js';
import { itemLoadOptions, nearestAchievable, optionsInRange, sortUnique } from './loads.js';
import { estimateExercise1RM, loadForReps } from './ratios.js';
import { prescribe, exerciseCount, exerciseMinutes, GOAL_LABELS } from './prescription.js';
import { adaptForLoad } from './adaptations.js';
import { createRng, newSeed } from './random.js';

export const WORKOUT_SCHEMA_VERSION = 1;

const LEVEL_ALLOWED = {
  novice: ['beginner'],
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'expert'],
};

const UPPER = new Set(['chest', 'front-delts', 'side-delts', 'rear-delts', 'biceps', 'triceps', 'forearms', 'lats', 'middle-back', 'traps', 'neck']);
const LOWER = new Set(['quads', 'glutes', 'hamstrings', 'calves', 'adductors', 'abductors']);
const CORE = new Set(['abs', 'obliques', 'lower-back']);
const region = (t) => (UPPER.has(t) ? 'upper' : LOWER.has(t) ? 'lower' : 'core');

export function categoryAllowed(category, goal, level) {
  if (category === 'strength') return true;
  if (category === 'plyometrics') return goal === 'power' || goal === 'agentRural';
  if (['powerlifting', 'olympic weightlifting', 'strongman'].includes(category)) return level === 'advanced';
  return false; // stretching i cardio només a l'escalfament
}

const isCompound = (c) => c.ex.mechanic === 'compound' || COMPOUND_PATTERNS.includes(c.req.pattern);

/** Pool d'exercicis realitzables (secció 7.1). */
export function buildPool({ exercises, profile = {}, location, caps }) {
  const level = profile.level || 'intermediate';
  const goal = profile.goal || 'muscle';
  const allowedLevels = LEVEL_ALLOWED[level] || LEVEL_ALLOWED.intermediate;
  const constraints = location?.constraints || {};
  const capsMap = caps || locationCapabilities(location);
  const pool = [];
  for (const ex of exercises) {
    if (!categoryAllowed(ex.category, goal, level)) continue;
    if (!allowedLevels.includes(ex.level || 'beginner')) continue;
    if (ex.agentRural && goal !== 'agentRural') continue;
    // Salts etiquetats com a "strength" al dataset: es tracten com a pliometria
    if (ex.category === 'strength' && getRequirements(ex).jump && !categoryAllowed('plyometrics', goal, level)) continue;
    if (limitationConflicts(ex, profile.limitations || []).length) continue;
    const feas = feasibility(ex, capsMap, constraints);
    if (!feas.ok) continue;
    pool.push({ ex, feas, req: getRequirements(ex), targets: exerciseTargets(ex) });
  }
  // Si un exercici propi es pot fer amb material natiu, substitueix la versió adaptada equivalent del dataset
  const replaced = new Set(pool.filter((c) => c.ex.substituteFor && !c.feas.adapted).map((c) => c.ex.substituteFor));
  const out = pool.filter((c) => !(replaced.has(c.ex.id) && c.feas.adapted));
  // Marca els adaptats que tenen una alternativa nativa amb càrrega del mateix patró i múscul principal
  const key = (c) => `${c.req.pattern}|${c.targets.primary[0]}`;
  const native = new Set(out.filter((c) => !c.feas.adapted && c.req.load).map(key));
  for (const c of out) c.nativeAlt = c.feas.adapted && native.has(key(c));
  return out;
}

/** Franges (secció 7.3): compost principal, segon compost, accessoris, core. */
export function planSlots(targets, count) {
  const order = [...targets].sort((a, b) => (TARGET_SIZE[b] - TARGET_SIZE[a]) || targets.indexOf(a) - targets.indexOf(b));
  const nonCore = order.filter((t) => !CORE.has(t));
  const core = order.filter((t) => CORE.has(t));
  const main = nonCore.length ? nonCore : core;
  const coreForD = nonCore.length ? core : [];
  const slots = [];
  if (!main.length || count < 1) return slots;
  slots.push({ kind: 'a', target: main[0] });
  if (count > 1) {
    const b = main.find((t) => t !== main[0] && region(t) !== region(main[0])) || main.find((t) => t !== main[0]) || main[0];
    slots.push({ kind: 'b', target: b });
  }
  const remaining = count - slots.length;
  const dCount = coreForD.length && remaining > 0 ? Math.min(coreForD.length, Math.max(1, Math.floor(remaining / 3))) : 0;
  const cCount = remaining - dCount;
  const covered = new Set(slots.map((s) => s.target));
  const queue = main.filter((t) => !covered.has(t));
  const extraCore = coreForD.slice(dCount); // core sense franja d: va a les franges c si n'hi ha de lliures
  let cycle = 0;
  for (let i = 0; i < cCount; i++) {
    if (queue.length) slots.push({ kind: 'c', target: queue.shift() });
    else if (extraCore.length) slots.push({ kind: 'c', target: extraCore.shift() });
    else { slots.push({ kind: 'c', target: main[cycle % main.length] }); cycle++; }
  }
  for (let i = 0; i < dCount; i++) slots.push({ kind: 'd', target: coreForD[i] });
  return slots;
}

function recentTargets(history = [], now = Date.now()) {
  const s = new Set();
  for (const w of history) {
    if (!w?.createdAt || now - w.createdAt > 48 * 3600 * 1000) continue;
    for (const e of w.exercises || []) for (const t of e.primary || []) s.add(t);
  }
  return s;
}

// ---------- Càrrega ----------
function loadOptionsFor(c, location) {
  if (!c.req.load) return [];
  const items = c.feas.loadItems?.length ? c.feas.loadItems : c.feas.loadItem ? [c.feas.loadItem] : [];
  return sortUnique(items.flatMap((i) => itemLoadOptions(i, location, { pair: !!c.req.load.pair })));
}

function implementOf(c) {
  const item = c.feas.loadItem || c.feas.loadItems?.[0];
  return item ? CATALOG_BY_ID[item.catalogId]?.load?.implement || null : null;
}

function loadShort(c, ctx) {
  if (c._short !== undefined) return c._short;
  let short = false;
  if (c.req.load && !c.ex.fixedLoadKg) {
    const opts = loadOptionsFor(c, ctx.location);
    const est = estimateExercise1RM(c.ex, ctx.profile, implementOf(c));
    if (est && opts.length) {
      const maxKg = opts[opts.length - 1].kg;
      short = loadForReps(est.kg, 10, 2) > maxKg * 1.05;
    }
  }
  c._short = short;
  return short;
}

function computeLoad(c, p, ctx) {
  if (!c.req.load) return null;
  const options = loadOptionsFor(c, ctx.location);
  if (!options.length) return null;
  const maxKg = options[options.length - 1].kg;
  if (c.ex.fixedLoadKg) {
    const pick = nearestAchievable(c.ex.fixedLoadKg, options);
    return {
      targetKg: c.ex.fixedLoadKg, pick, chips: [pick], estimated: false, oneRM: null, maxKg, options,
      hint: pick.kg === c.ex.fixedLoadKg ? 'Càrrega fixa de la prova.' : `No pots muntar ${c.ex.fixedLoadKg} kg exactes: el més proper és ${pick.kg} kg.`,
    };
  }
  const est = estimateExercise1RM(c.ex, ctx.profile, implementOf(c));
  if (!est) return { targetKg: null, pick: null, chips: options.slice(0, 5), estimated: true, oneRM: null, maxKg, options, hint: `Tria el pes que et deixi ${p.rir ?? 2} reps a la recambra.` };
  const reps = p.seconds ? 12 : Math.round((p.repsLow + p.repsHigh) / 2);
  const target = p.explosive ? est.kg * 0.55 : loadForReps(est.kg, reps, p.rir ?? 2);
  const pick = nearestAchievable(target, options);
  let chips = optionsInRange(options, target * 0.8, target * 1.15, 5);
  if (!chips.some((o) => o.kg === pick.kg)) chips = sortUnique([...chips, pick]).slice(-5);
  return {
    targetKg: Math.round(target * 10) / 10, pick, chips, estimated: true, fromReference: est.fromReference, oneRM: est.kg, maxKg, options,
    hint: est.fromReference
      ? 'Calculat a partir dels teus aixecaments de referència. Ajusta-ho amb el RIR.'
      : `Estimació — ajusta-ho amb el RIR: tria el pes que et deixi ${p.rir ?? 2} reps a la recambra.`,
  };
}

// ---------- Puntuació (secció 7.4) ----------
function scoreCandidate(c, slot, st) {
  const { primary, secondary } = c.targets;
  let s = 0;
  if (primary.includes(slot.target)) s += 5;
  s += 2 * secondary.filter((t) => st.selected.has(t)).length;
  if (!primary.some((t) => st.selected.has(t))) s -= 3;
  const compound = isCompound(c);
  if ((slot.kind === 'a' || slot.kind === 'b') && compound) s += 3;
  if ((slot.kind === 'a' || slot.kind === 'b') && !compound) s -= 2;
  if (c.req.load && (st.goal === 'strength' || st.goal === 'muscle')) s += 2;
  if (primary.some((t) => st.recent.has(t))) s -= 4;
  if (st.patterns.has(c.req.pattern)) s -= 2;
  if (st.coreIds.has(c.ex.id) || c.ex.core) s += 2;
  if (c.feas.adapted) s -= 1;
  if (c.nativeAlt) s -= 4; // hi ha la mateixa feina amb material natiu
  // Material curt (secció 8.3, estratègia 2): millor unilateral
  if (loadShort(c, st.ctx)) s += c.req.unilateral ? 2 : -1;
  // Objectius específics
  if (st.goal === 'power' && (slot.kind === 'a' || slot.kind === 'b') && (c.ex.category === 'plyometrics' || c.req.ballistic)) s += 3;
  if (st.goal === 'agentRural') {
    if (slot.kind === 'a' && slot.target === 'chest' && c.req.pattern === 'horizontal_push' && implementOf(c) === 'barbell' && !c.ex.agentRural) s += 4;
    if (slot.kind === 'b' && slot.target === 'chest' && c.ex.agentRural && c.ex.fixedLoadKg && !c.ex.isTest) s += 8;
    if (LOWER.has(slot.target) && (c.ex.category === 'plyometrics' || c.req.jump)) s += 3;
  }
  if (slot.kind === 'd' && c.req.pattern.startsWith('iso:')) s += 1;
  s += st.rng() * 3 - 1.5;
  return s;
}

function candidatesForSlot(pool, slot, excludeIds) {
  const free = pool.filter((c) => !excludeIds.has(c.ex.id));
  const primary = free.filter((c) => c.targets.primary.includes(slot.target));
  if (primary.length) return primary;
  const secondary = free.filter((c) => c.targets.secondary.includes(slot.target));
  return secondary.length ? secondary : free;
}

function rankForSlot(pool, slot, excludeIds, st) {
  return candidatesForSlot(pool, slot, excludeIds)
    .map((c) => ({ c, score: scoreCandidate(c, slot, st) }))
    .sort((x, y) => y.score - x.score || x.c.ex.id.localeCompare(y.c.ex.id));
}

// ---------- Construcció d'una entrada ----------
function whyText(c, slot, goal) {
  const parts = [];
  const tl = (t) => TARGET_LABELS[t]?.toLowerCase() || t;
  if (c.targets.primary.includes(slot.target)) parts.push(`Treballa ${tl(slot.target)} com a múscul principal`);
  else parts.push(`Cobreix ${tl(slot.target)} de manera indirecta`);
  if (slot.kind === 'a') parts.push('és el compost principal de la sessió');
  else if (slot.kind === 'b') parts.push('segon compost, d\'un altre grup');
  else if (slot.kind === 'd') parts.push('tanca la sessió amb core');
  if (c.req.unilateral) parts.push('unilateral (corregeix desequilibris)');
  if (c.req.load && (goal === 'muscle' || goal === 'strength')) parts.push('admet càrrega externa per progressar');
  return parts.join('; ') + '.';
}

export function buildEntry(c, slot, ctx) {
  const goal = ctx.profile.goal || 'muscle';
  const level = ctx.profile.level || 'intermediate';
  const compound = isCompound(c);
  const explosive = c.ex.category === 'plyometrics' || (goal === 'power' && (slot.kind === 'a' || slot.kind === 'b') && c.req.ballistic);
  let p = { ...prescribe({ goal, level, ex: c.ex, slotKind: slot.kind, compound, explosive }), explosive };
  const load = computeLoad(c, p, ctx);
  let adaptation = null;
  if (load?.oneRM && load.maxKg && !c.ex.fixedLoadKg) {
    adaptation = adaptForLoad({ oneRM: load.oneRM, maxKg: load.maxKg, p, goal, unilateral: c.req.unilateral });
    if (adaptation) {
      p = { ...p, repsLow: adaptation.repsLow, repsHigh: adaptation.repsHigh, restSec: adaptation.restSec };
      const top = load.options[load.options.length - 1];
      load.pick = { kg: top.kg, setup: top.setup, diff: 0 };
      load.chips = load.options.slice(-3);
    }
  }
  // Sèries d'aproximació (per a l'escalfament si és el primer exercici amb càrrega)
  const approach = [];
  if (load?.pick && !p.emom) {
    const seen = new Set();
    for (const [f, reps] of [[0.4, 8], [0.6, 5], [0.8, 3]]) {
      const o = nearestAchievable(load.pick.kg * f, load.options);
      if (!o || o.kg >= load.pick.kg || seen.has(o.kg)) continue;
      seen.add(o.kg);
      approach.push({ reps, kg: o.kg, setup: o.setup });
    }
  }
  const sets = Array.from({ length: p.sets }, () => ({
    ...(p.seconds ? { seconds: p.seconds } : { repsLow: p.repsLow, repsHigh: p.repsHigh }),
    loadKg: load?.pick?.kg ?? null,
    loadSetup: load?.pick?.setup ?? null,
    rir: p.rir,
  }));
  const equipmentUsed = [...new Set([
    ...(c.feas.loadItems || []).slice(0, 1).map((i) => CATALOG_BY_ID[i.catalogId]?.name),
  ].filter(Boolean))];
  return {
    exerciseId: c.ex.id,
    slot,
    primary: c.targets.primary,
    secondary: c.targets.secondary,
    pattern: c.req.pattern,
    sets,
    restSec: p.restSec,
    tempo: adaptation?.tempo || null,
    note: p.note || null,
    emom: !!p.emom,
    adapted: c.feas.adapted,
    substitutionNotes: c.feas.notes,
    safety: [...(c.feas.safety || []), ...(c.ex.safety ? [c.ex.safety] : [])],
    adaptations: adaptation ? adaptation.strategies : [],
    adaptationText: adaptation?.text || null,
    load: load ? {
      targetKg: load.targetKg, maxKg: load.maxKg, estimated: load.estimated, hint: load.hint,
      chips: load.chips.map((o) => ({ kg: o.kg, setup: o.setup })),
    } : null,
    equipmentUsed,
    approach,
    why: whyText(c, slot, goal),
    locked: false,
    seen: [c.ex.id],
    minutes: exerciseMinutes(p),
  };
}

function warmupFor(entries) {
  const warm = [{ text: '5 min de cardio suau (caminar ràpid, bici, corda) i mobilitat d\'espatlles, maluc i turmells', minutes: 5 }];
  const first = entries.find((e) => e.approach?.length);
  if (first) {
    for (const a of first.approach) {
      warm.push({ text: `Aproximació: ${a.reps} reps amb ${a.setup}`, minutes: 1, exerciseId: first.exerciseId, reps: a.reps, loadKg: a.kg });
    }
  }
  return warm;
}

function finalize(workout, ctx) {
  const entries = workout.exercises;
  const covered = new Set(entries.flatMap((e) => e.primary));
  workout.uncovered = workout.targetMuscles.filter((t) => !covered.has(t));
  workout.warmup = warmupFor(entries);
  const warmMin = workout.warmup.reduce((s, w) => s + w.minutes, 0);
  workout.estimatedMin = Math.round(warmMin + entries.reduce((s, e) => s + e.minutes, 0));
  workout.title = workoutTitle(workout.targetMuscles);
  workout.notes = [];
  if (workout.uncovered.length) workout.notes.push(`No hi ha prou franges o material per a: ${workout.uncovered.map((t) => TARGET_LABELS[t]).join(', ')}.`);
  if (ctx.profile.goal === 'fatloss') workout.notes.push('Fes-ho en circuit o superseries per mantenir el ritme.');
  return workout;
}

function makeState(ctx, workout, seedOffset = 0) {
  const selected = new Set(workout.targetMuscles);
  return {
    ctx,
    selected,
    goal: ctx.profile.goal || 'muscle',
    recent: recentTargets(ctx.history, ctx.now),
    patterns: new Set(),
    coreIds: new Set(ctx.coreIds || []),
    rng: createRng(`${workout.seed}:${seedOffset}`),
  };
}

/**
 * Genera un entrenament.
 * @param ctx { exercises, profile, location, history?, coreIds?, now? }
 * @param opts { targets, durationMin, seed? }
 */
export function generateWorkout(ctx, { targets, durationMin = 45, seed = newSeed() } = {}) {
  const profile = ctx.profile || {};
  const pool = buildPool({ exercises: ctx.exercises, profile, location: ctx.location });
  const count = exerciseCount(durationMin, profile.goal);
  const slots = planSlots(targets, count);
  const workout = {
    schemaVersion: WORKOUT_SCHEMA_VERSION,
    id: newId('w'),
    createdAt: ctx.now || Date.now(),
    locationId: ctx.location?.id || null,
    locationName: ctx.location?.name || '',
    goal: profile.goal || 'muscle',
    goalLabel: GOAL_LABELS[profile.goal || 'muscle'],
    level: profile.level || 'intermediate',
    targetMuscles: [...targets],
    durationMin,
    seed,
    exercises: [],
    saved: false,
  };
  fillSlots(workout, slots.map((slot) => ({ slot })), pool, { ...ctx, profile });
  return finalize(workout, { ...ctx, profile });
}

function fillSlots(workout, plan, pool, ctx) {
  const st = makeState(ctx, workout);
  const used = new Set(plan.filter((p) => p.entry).map((p) => p.entry.exerciseId));
  for (const p of plan) if (p.entry) st.patterns.add(p.entry.pattern);
  const out = [];
  for (const p of plan) {
    if (p.entry) { out.push(p.entry); continue; }
    const ranked = rankForSlot(pool, p.slot, used, st);
    if (!ranked.length) continue;
    const best = ranked[0].c;
    used.add(best.ex.id);
    st.patterns.add(best.req.pattern);
    out.push(buildEntry(best, p.slot, ctx));
  }
  workout.exercises = out;
  return workout;
}

/** 🔄 Canviar exercici: el següent millor candidat de la mateixa franja amb el mateix múscul principal. */
export function swapExercise(workout, index, ctx) {
  const entry = workout.exercises[index];
  if (!entry) return workout;
  const profile = { ...ctx.profile, goal: workout.goal, level: workout.level };
  const pool = buildPool({ exercises: ctx.exercises, profile, location: ctx.location });
  const mainTarget = entry.primary.includes(entry.slot.target) ? entry.slot.target : entry.primary[0];
  const inWorkout = new Set(workout.exercises.map((e) => e.exerciseId));
  const st = makeState({ ...ctx, profile }, workout, `swap${index}:${entry.seen.length}`);
  workout.exercises.forEach((e, i) => { if (i !== index) st.patterns.add(e.pattern); });
  const eligible = (exclude) => pool
    .filter((c) => !exclude.has(c.ex.id) && c.targets.primary.includes(mainTarget))
    .map((c) => ({ c, score: scoreCandidate(c, { ...entry.slot, target: mainTarget }, st) }))
    .sort((x, y) => y.score - x.score || x.c.ex.id.localeCompare(y.c.ex.id));
  let ranked = eligible(new Set([...inWorkout, ...entry.seen]));
  let seen = entry.seen;
  if (!ranked.length) { ranked = eligible(inWorkout); seen = []; } // s'han vist tots: tornem a començar
  if (!ranked.length) return workout;
  const next = buildEntry(ranked[0].c, entry.slot, { ...ctx, profile });
  next.seen = [...seen, entry.exerciseId, next.exerciseId].filter((v, i, a) => a.indexOf(v) === i);
  const exercises = [...workout.exercises];
  exercises[index] = next;
  return finalize({ ...workout, exercises }, { ...ctx, profile });
}

/** 🔄 Regenerar tot amb una seed nova, respectant els exercicis bloquejats. */
export function regenerateWorkout(workout, ctx, seed = newSeed()) {
  const profile = { ...ctx.profile, goal: workout.goal, level: workout.level };
  const pool = buildPool({ exercises: ctx.exercises, profile, location: ctx.location });
  const count = exerciseCount(workout.durationMin, workout.goal);
  const slots = planSlots(workout.targetMuscles, count);
  const plan = slots.map((slot, i) => {
    const prev = workout.exercises[i];
    return prev?.locked ? { slot: prev.slot, entry: prev } : { slot };
  });
  // bloquejats que han quedat fora del nou pla (no hauria de passar): es conserven al final
  workout.exercises.forEach((e, i) => { if (e.locked && i >= plan.length) plan.push({ slot: e.slot, entry: e }); });
  const next = { ...workout, seed, exercises: [] };
  fillSlots(next, plan, pool, { ...ctx, profile });
  return finalize(next, { ...ctx, profile });
}

export function toggleLock(workout, index) {
  const exercises = workout.exercises.map((e, i) => (i === index ? { ...e, locked: !e.locked } : e));
  return { ...workout, exercises };
}

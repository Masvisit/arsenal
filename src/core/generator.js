// Generador de sessions determinista (secció 7), en blocs A-B-C fets en circuit. JS pur, sense IA.
import { exerciseTargets, TARGET_LABELS, workoutTitle } from './muscles.js';
import { getRequirements, feasibility, limitationConflicts, COMPOUND_PATTERNS } from './requirements.js';
import { locationCapabilities, newId } from './inventory.js';
import { CATALOG_BY_ID } from './catalog.js';
import { itemLoadOptions, nearestAchievable, optionsInRange, sortUnique } from './loads.js';
import { estimateExercise1RM, loadForReps, repsToFailure } from './ratios.js';
import { prescribe, GOAL_LABELS, blockParams } from './prescription.js';
import { adaptForLoad } from './adaptations.js';
import { createRng, newSeed } from './random.js';
import { demandScore, bodyweightCapacity, LEVEL_DEMAND_WEIGHT } from './demand.js';
import { planBlocks, fitSession, maxBlocksFor, weightConflict, setWorkSec, blockSeconds, BLOCK_CHANGE_SEC } from './blocks.js';
import { buildWarmup, buildCooldown, itemsMinutes } from './warmup.js';
import { fatigueScores } from './fatigue.js';

export const WORKOUT_SCHEMA_VERSION = 2;

const LEVEL_ALLOWED = {
  novice: ['beginner'],
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate', 'expert'],
  advanced: ['beginner', 'intermediate', 'expert'],
};

const LOWER = new Set(['quads', 'glutes', 'hamstrings', 'calves', 'adductors', 'abductors']);

export function categoryAllowed(category, goal, level) {
  if (category === 'strength') return true;
  if (category === 'plyometrics') return goal === 'power' || goal === 'agentRural';
  if (['powerlifting', 'olympic weightlifting', 'strongman'].includes(category)) return level === 'advanced';
  return false; // estiraments i cardio van a l'escalfament i la tornada a la calma
}

const isCompound = (c) => c.ex.mechanic === 'compound' || COMPOUND_PATTERNS.includes(c.req.pattern);

/** Pool d'exercicis realitzables (secció 7.1): només el que es pot fer amb el material del lloc. */
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
    if (ex.isTest) continue; // el test de 45 s es fa a part, no dins un circuit
    const feas = feasibility(ex, capsMap, constraints);
    if (!feas.ok) continue;
    const c = { ex, feas, req: getRequirements(ex), targets: exerciseTargets(ex), demand: demandScore(ex) };
    // Material estricte: si la càrrega surt d'un element amb pesos (p. ex. dues kettlebells iguals) i no n'hi ha cap opció, fora
    if (c.req.load) {
      const weighted = (feas.loadItems || []).filter((i) => CATALOG_BY_ID[i.catalogId]?.load);
      c.hasLoad = loadOptionsFor(c, location).length > 0;
      if (weighted.length && !c.hasLoad) continue;
      if (!c.hasLoad) c.demand -= 2; // p. ex. politja feta amb goma: sense càrrega de veritat
    }
    pool.push(c);
  }
  const replaced = new Set(pool.filter((c) => c.ex.substituteFor && !c.feas.adapted).map((c) => c.ex.substituteFor));
  const out = pool.filter((c) => !(replaced.has(c.ex.id) && c.feas.adapted));
  const key = (c) => `${c.req.pattern}|${c.targets.primary[0]}`;
  const nativeLoaded = new Set(out.filter((c) => !c.feas.adapted && c.hasLoad).map(key));
  const nativeAny = new Set(out.filter((c) => !c.feas.adapted).map(key));
  // Adaptat amb alternativa nativa: amb càrrega si l'adaptat en té; qualsevol si l'adaptat no en té (p. ex. goma vs dominades)
  for (const c of out) c.nativeAlt = c.feas.adapted && (c.hasLoad ? nativeLoaded.has(key(c)) : nativeAny.has(key(c)));
  return out;
}

function recentTargets(history = [], now = Date.now()) {
  const s = new Set();
  for (const w of history) {
    const t = w?.endedAt || w?.createdAt;
    if (!t || now - t > 48 * 3600 * 1000) continue;
    for (const e of w.exercises || w.sets || []) for (const x of e.primary || []) s.add(x);
  }
  return s;
}

// ---------- Càrrega ----------
const ITEM_KIND = { list: 'list', adjustable: 'adjustable', range: 'list', bar: 'bar', fillable: 'fillable', vest: 'fillable', stack: 'stack' };
function itemKindOf(item) {
  if (!item) return null;
  if (['smith', 'lever_machines'].includes(item.catalogId)) return 'bar';
  return ITEM_KIND[CATALOG_BY_ID[item.catalogId]?.load?.kind] || 'list';
}

function loadOptionsFor(c, location) {
  if (!c.req.load) return [];
  const items = c.feas.loadItems?.length ? c.feas.loadItems : c.feas.loadItem ? [c.feas.loadItem] : [];
  const all = items.flatMap((i) => itemLoadOptions(i, location, { pair: !!c.req.load.pair }).map((o) => ({ ...o, itemUid: i.uid, itemKind: itemKindOf(i) })));
  return sortUnique(all);
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
    if (est && opts.length) short = loadForReps(est.kg, 10, 1) > opts[opts.length - 1].kg * 1.05;
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
    const full = options.find((o) => o.kg === pick.kg);
    return {
      targetKg: c.ex.fixedLoadKg, pick: { ...full, ...pick }, chips: [full], estimated: false, oneRM: null, maxKg, options,
      hint: pick.kg === c.ex.fixedLoadKg ? 'Càrrega fixa de la prova.' : `No pots muntar ${c.ex.fixedLoadKg} kg exactes: el més proper és ${pick.kg} kg.`,
    };
  }
  const est = estimateExercise1RM(c.ex, ctx.profile, implementOf(c));
  if (!est) return { targetKg: null, pick: null, chips: options.slice(0, 5), estimated: true, oneRM: null, maxKg, options, hint: `Tria el pes que et deixi ${p.rir ?? 1} reps a la recambra.` };
  const reps = p.seconds ? 12 : Math.round((p.repsLow + p.repsHigh) / 2);
  const target = p.explosive ? est.kg * 0.55 : loadForReps(est.kg, reps, p.rir ?? 1);
  const near = nearestAchievable(target, options);
  const pick = { ...options.find((o) => o.kg === near.kg), diff: near.diff };
  let chips = optionsInRange(options, target * 0.7, target * 1.2, 5);
  if (!chips.some((o) => o.kg === pick.kg)) chips = sortUnique([...chips, pick]).slice(-5);
  return {
    targetKg: Math.round(target * 10) / 10, pick, chips, estimated: true, fromReference: est.fromReference, oneRM: est.kg, maxKg, options,
    hint: est.fromReference
      ? 'Calculat a partir dels teus aixecaments de referència. Ajusta-ho amb el RIR.'
      : `Estimació — ajusta-ho amb el RIR: tria el pes que et deixi ${p.rir ?? 1} reps a la recambra.`,
  };
}

// ---------- Puntuació (secció 7.4 + exigència) ----------
function scoreCandidate(c, slot, st) {
  const { primary, secondary } = c.targets;
  let s = 0;
  if (primary.includes(slot.target)) s += 5;
  s += 2 * secondary.filter((t) => st.selected.has(t)).length;
  if (!primary.some((t) => st.selected.has(t))) s -= 3;
  const compound = isCompound(c);
  if ((slot.kind === 'a' || slot.kind === 'b') && compound) s += 3;
  if ((slot.kind === 'a' || slot.kind === 'b') && !compound) s -= 2;
  if (c.hasLoad && (st.goal === 'strength' || st.goal === 'muscle')) s += 2;
  if (primary.some((t) => st.recent.has(t))) s -= 4;
  if (st.patterns.has(c.req.pattern)) s -= 2;
  if (st.coreIds.has(c.ex.id) || c.ex.core) s += slot.kind === 'a' || slot.kind === 'b' ? 4 : 3;
  if (c.feas.adapted) s -= 1;
  if (c.nativeAlt) s -= 4;
  if (loadShort(c, st.ctx) && c.req.unilateral) s += 1; // material curt: millor a una cama / un braç
  // Exigència: com més nivell, més pes té; i penalitza el que resulta massa fàcil amb el material que hi ha
  s += c.demand * (LEVEL_DEMAND_WEIGHT[st.level] ?? 1) * 0.35;
  s -= easePenalty(c, st);
  s -= hardPenalty(c, st);
  if (c.req.ballistic && st.goal !== 'power' && st.goal !== 'agentRural' && !c.ex.custom) s -= 3;
  // Dins el bloc: no repetir múscul principal ni patró
  if (st.blockTargets && primary.some((t) => st.blockTargets.has(t))) s -= 3;
  if (st.blockPatterns && st.blockPatterns.has(c.req.pattern)) s -= 2;
  if (st.goal === 'power' && (slot.kind === 'a' || slot.kind === 'b') && (c.ex.category === 'plyometrics' || c.req.ballistic)) s += 3;
  if (st.goal === 'agentRural') {
    if (slot.pos === 'A' && slot.target === 'chest' && c.req.pattern === 'horizontal_push' && implementOf(c) === 'barbell' && !c.ex.agentRural) s += 4;
    if (slot.target === 'chest' && c.ex.agentRural && c.ex.fixedLoadKg) s += 6;
    if (LOWER.has(slot.target) && (c.ex.category === 'plyometrics' || c.req.jump)) s += 3;
  }
  if (slot.kind === 'd' && c.req.pattern.startsWith('iso:')) s += 1;
  // Força: el compost principal amb barra
  if (st.goal === 'strength' && slot.pos === 'A' && ['barbell', 'trap_bar'].includes(implementOf(c)) && c.hasLoad) s += 3;
  // Menys soroll a la posició A (el compost principal ha de ser estable)
  s += slot.pos === 'A' ? st.rng() * 1.5 - 0.75 : st.rng() * 3 - 1.5;
  return s;
}

/** Massa difícil per fer el rang amb bona tècnica (p. ex. muscle-up a 1–2 reps per a un intermedi). */
function hardPenalty(c, st) {
  if (c.req.load) return 0;
  const cap = bodyweightCapacity(c.ex, st.ctx.profile);
  if (cap == null) return 0;
  const low = st.goal === 'strength' ? 3 : 6;
  return cap - 1 < low - 1 ? 4 : 0;
}

/** Com de fàcil és l'exercici per a l'usuari amb el material del lloc (0 = prou exigent, fins a 5). */
function easePenalty(c, st) {
  if (c._ease !== undefined) return c._ease;
  const ctx = st.ctx;
  const top = st.goal === 'strength' ? 6 : 12;
  let cap = null;
  if (c.req.load && !c.ex.fixedLoadKg) {
    const opts = loadOptionsFor(c, ctx.location);
    const est = estimateExercise1RM(c.ex, ctx.profile, implementOf(c));
    if (est && opts.length) cap = repsToFailure(est.kg, opts[opts.length - 1].kg) * (c.req.unilateral ? 1 : 1);
  } else if (!c.req.load) {
    cap = bodyweightCapacity(c.ex, ctx.profile);
  }
  const ratio = cap == null ? 0 : cap / top;
  c._ease = Math.max(0, Math.min(5, (ratio - 2) * 1.2));
  if (cap == null && !c.hasLoad && c.demand < 0) c._ease = 3; // aïllament fàcil sense càrrega
  return c._ease;
}

function candidatesForSlot(pool, slot, excludeIds) {
  const free = pool.filter((c) => !excludeIds.has(c.ex.id));
  let primary = free.filter((c) => c.targets.primary.includes(slot.target));
  // Posició A: sempre un compost si n'hi ha
  if (slot.pos === 'A') {
    const comp = primary.filter(isCompound);
    if (comp.length) primary = comp;
  }
  if (primary.length) return primary;
  const secondary = free.filter((c) => c.targets.secondary.includes(slot.target));
  return secondary.length ? secondary : free;
}

// ---------- Construcció d'una entrada ----------
function whyText(c, slot, goal) {
  const parts = [];
  const tl = (t) => TARGET_LABELS[t]?.toLowerCase() || t;
  if (c.targets.primary.includes(slot.target)) parts.push(`Treballa ${tl(slot.target)} com a múscul principal`);
  else parts.push(`Cobreix ${tl(slot.target)} de manera indirecta`);
  if (slot.pos === 'A') parts.push('és el compost principal del bloc');
  else if (slot.pos === 'B') parts.push('alterna amb un altre grup perquè l\'A descansi');
  else parts.push('accessori o core per tancar la ronda');
  if (c.req.unilateral) parts.push('unilateral (més exigent i corregeix desequilibris)');
  if (c.req.load && (goal === 'muscle' || goal === 'strength')) parts.push('admet càrrega externa per progressar');
  return parts.join('; ') + '.';
}

export function buildEntry(c, slot, ctx, rounds) {
  const goal = ctx.profile.goal || 'muscle';
  const level = ctx.profile.level || 'intermediate';
  const compound = isCompound(c);
  const explosive = c.ex.category === 'plyometrics' || (goal === 'power' && (slot.kind === 'a' || slot.kind === 'b') && c.req.ballistic);
  let p = { ...prescribe({ goal, level, ex: c.ex, slotKind: slot.kind, compound, explosive }), explosive };
  if (rounds) p.sets = p.emom ? p.sets : rounds;
  const load = computeLoad(c, p, ctx);
  const limb = LOWER.has(c.targets.primary[0]) ? 'leg' : 'arm';
  let adaptation = null;
  let capacityNote = null;
  if (load?.oneRM && load.maxKg && !c.ex.fixedLoadKg) {
    adaptation = adaptForLoad({ oneRM: load.oneRM, maxKg: load.maxKg, p, goal, unilateral: c.req.unilateral, limb });
    if (adaptation) {
      const top = load.options[load.options.length - 1];
      load.pick = { ...top, diff: 0 };
      load.chips = load.options.slice(-3);
    }
  } else if (!c.req.load && !p.seconds && !explosive) {
    const cap = bodyweightCapacity(c.ex, ctx.profile);
    if (cap != null) {
      adaptation = adaptForLoad({ capacity: cap, p, goal, unilateral: c.req.unilateral, limb });
      if (!adaptation && cap - (p.rir ?? 1) < p.repsHigh) {
        // Massa dur per al rang: ajustem a les reps que pots fer amb bona tècnica
        const hi = Math.max(2, cap - (p.rir ?? 1));
        p = { ...p, repsHigh: hi, repsLow: Math.max(1, Math.min(p.repsLow, hi - 2)) };
        capacityNote = `Estimem que en pots fer ~${cap}: rang ${p.repsLow}–${p.repsHigh} amb bona tècnica.`;
      }
    }
  }
  if (adaptation) p = { ...p, repsLow: adaptation.repsLow, repsHigh: adaptation.repsHigh };

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
  const entry = {
    exerciseId: c.ex.id,
    slot,
    pos: slot.pos,
    block: slot.block,
    primary: c.targets.primary,
    secondary: c.targets.secondary,
    pattern: c.req.pattern,
    unilateral: c.req.unilateral,
    sets,
    tempo: adaptation?.tempo || null,
    note: p.note || capacityNote || null,
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
    weight: load?.pick ? { kg: load.pick.kg, pair: !!c.req.load.pair, itemUid: load.pick.itemUid, itemKind: load.pick.itemKind, implement: implementOf(c) } : null,
    equipmentUsed: [...new Set((c.feas.loadItems || []).slice(0, 1).map((i) => CATALOG_BY_ID[i.catalogId]?.name).filter(Boolean))],
    approach,
    why: whyText(c, slot, goal),
    locked: false,
    seen: [c.ex.id],
  };
  Object.defineProperty(entry, '_options', { value: load?.options || [], enumerable: false });
  Object.defineProperty(entry, '_target', { value: load?.targetKg ?? null, enumerable: false });
  return entry;
}

/** Posa a l'entrada el mateix pes que una altra del bloc (si és raonable per a l'exercici). */
function harmonize(entry, others) {
  if (!entry.weight) return false;
  for (const o of others) {
    if (!o.weight || o.weight.implement !== entry.weight.implement) continue;
    const opt = entry._options.find((x) => Math.abs(x.kg - o.weight.kg) < 0.01);
    if (!opt) continue;
    const t = entry._target ?? entry.weight.kg;
    const short = !!entry.adaptationText;
    const reasonable = short ? opt.kg <= entry.load.maxKg : opt.kg >= t * 0.7 && opt.kg <= t * 1.3;
    if (!reasonable) continue;
    entry.sets = entry.sets.map((s) => ({ ...s, loadKg: opt.kg, loadSetup: opt.setup }));
    entry.weight = { ...entry.weight, kg: opt.kg, itemUid: opt.itemUid, itemKind: opt.itemKind };
    entry.sameWeightNote = `Mateix pes que l'exercici ${o.pos} per no canviar de pes a mitja ronda.`;
    if (!weightConflict([...others, entry])) return true;
  }
  return false;
}

/** Tria el millor candidat per a una posició que compleixi la regla de pesos del bloc. */
function pickForSlot(pool, slot, used, st, blockMembers, ctx, rounds) {
  st.blockTargets = new Set(blockMembers.flatMap((m) => m.primary));
  st.blockPatterns = new Set(blockMembers.map((m) => m.pattern));
  const ranked = candidatesForSlot(pool, slot, used)
    .map((c) => ({ c, score: scoreCandidate(c, slot, st) }))
    .sort((x, y) => y.score - x.score || x.c.ex.id.localeCompare(y.c.ex.id));
  for (const { c } of ranked.slice(0, 40)) {
    const entry = buildEntry(c, slot, ctx, rounds);
    if (!weightConflict([...blockMembers, entry])) return { c, entry };
    if (harmonize(entry, blockMembers)) return { c, entry };
  }
  return null;
}

// ---------- Escalfament, tornada a la calma i durada ----------
function finalize(workout, ctx) {
  const entries = workout.exercises;
  const covered = new Set(entries.flatMap((e) => e.primary));
  workout.uncovered = workout.targetMuscles.filter((t) => !covered.has(t));
  const caps = locationCapabilities(ctx.location);
  // blocs a partir de les entrades
  workout.blocks = workout.blocks.map((b, bi) => ({ ...b, entries: entries.map((e, i) => (e.block === bi ? i : -1)).filter((i) => i >= 0) }));
  const firstBlock = workout.blocks[0]?.entries.map((i) => entries[i]) || [];
  const short = workout.durationMin <= 30;
  workout.warmup = buildWarmup({ targets: workout.targetMuscles, caps, constraints: ctx.location?.constraints, firstBlock, short });
  const fatigue = fatigueScores(entries.map((e) => ({ sets: e.sets.length, primary: e.primary, secondary: e.secondary })));
  workout.cooldown = buildCooldown({ fatigue, caps, short });
  const blocksSec = workout.blocks.reduce((s, b) => s + blockSeconds(b, b.entries.map((i) => setWorkSec(entries[i].sets[0], entries[i].unilateral))), 0);
  workout.estimatedMin = Math.round(itemsMinutes(workout.warmup) + blocksSec / 60 + (Math.max(0, workout.blocks.length - 1) * BLOCK_CHANGE_SEC) / 60 + itemsMinutes(workout.cooldown));
  workout.title = workoutTitle(workout.targetMuscles);
  workout.notes = [];
  if (workout.uncovered.length) workout.notes.push(`Amb aquest material i temps no han entrat: ${workout.uncovered.map((t) => TARGET_LABELS[t]).join(', ')}.`);
  return workout;
}

function makeState(ctx, workout, seedOffset = 0) {
  return {
    ctx,
    selected: new Set(workout.targetMuscles),
    goal: ctx.profile.goal || 'muscle',
    level: ctx.profile.level || 'intermediate',
    recent: recentTargets(ctx.history, ctx.now),
    patterns: new Set(),
    coreIds: new Set(ctx.coreIds || []),
    rng: createRng(`${workout.seed}:${seedOffset}`),
  };
}

function fillPlan(workout, plan, pool, ctx) {
  const st = makeState(ctx, workout);
  const used = new Set(plan.filter((p) => p.entry).map((p) => p.entry.exerciseId));
  for (const p of plan) if (p.entry) st.patterns.add(p.entry.pattern);
  const out = [];
  for (const p of plan) {
    const rounds = workout.blocks[p.slot.block]?.rounds;
    if (p.entry) { out.push(p.entry); continue; }
    const members = [...out, ...plan.filter((q) => q.entry).map((q) => q.entry)].filter((e) => e.block === p.slot.block);
    const res = pickForSlot(pool, p.slot, used, st, members, ctx, rounds);
    if (!res) continue;
    used.add(res.c.ex.id);
    st.patterns.add(res.c.req.pattern);
    out.push(res.entry);
  }
  // ordre: bloc i posició
  const order = { A: 0, B: 1, C: 2 };
  workout.exercises = out.sort((a, b) => a.block - b.block || order[a.pos] - order[b.pos]);
  return workout;
}

function layout(targets, durationMin, goal, level, override) {
  const params = blockParams(goal, level);
  const fit = override || fitSession(durationMin, params, maxBlocksFor(targets, durationMin));
  const bl = planBlocks(targets, fit.blocks);
  const blocks = bl.map((_, i) => ({ index: i, label: `Bloc ${i + 1}`, rounds: fit.rounds, transitionSec: params.transitionSec, restAfterRoundSec: params.restAfterRoundSec, entries: [] }));
  const slots = bl.flatMap((b, bi) => b.map((s) => ({ ...s, block: bi })));
  return { blocks, slots };
}

/**
 * Genera una sessió: escalfament + blocs A-B-C en circuit + estiraments.
 * @param ctx { exercises, profile, location, history?, coreIds?, now? }
 * @param opts { targets, durationMin, seed? }
 */
export function generateWorkout(ctx, { targets, durationMin = 45, seed = newSeed() } = {}) {
  const profile = ctx.profile || {};
  const goal = profile.goal || 'muscle';
  const level = profile.level || 'intermediate';
  const pool = buildPool({ exercises: ctx.exercises, profile, location: ctx.location });
  let fit = null;
  let workout;
  // Si la durada real (reps altes, unilaterals…) passa del temps, una ronda menys o un bloc menys
  for (let attempt = 0; attempt < 6; attempt++) {
    workout = buildOnce(ctx, profile, pool, { targets, durationMin, seed, goal, level }, fit);
    if (workout.estimatedMin <= durationMin * 1.2) break;
    const b = workout.blocks.length;
    const r = workout.blocks[0]?.rounds || 3;
    if (r > 3) fit = { blocks: b, rounds: r - 1 };
    else if (b > 1) fit = { blocks: b - 1, rounds: r };
    else if (r > 2) fit = { blocks: 1, rounds: r - 1 };
    else break;
  }
  return workout;
}

function buildOnce(ctx, profile, pool, { targets, durationMin, seed, goal, level }, fit) {
  const { blocks, slots } = layout(targets, durationMin, goal, level, fit);
  const workout = {
    schemaVersion: WORKOUT_SCHEMA_VERSION,
    id: newId('w'),
    createdAt: ctx.now || Date.now(),
    locationId: ctx.location?.id || null,
    locationName: ctx.location?.name || '',
    goal,
    goalLabel: GOAL_LABELS[goal],
    level,
    targetMuscles: [...targets],
    durationMin,
    seed,
    blocks,
    exercises: [],
    saved: false,
  };
  fillPlan(workout, slots.map((slot) => ({ slot })), pool, { ...ctx, profile });
  return finalize(workout, { ...ctx, profile });
}

/** 🔄 Canviar exercici: el següent millor del mateix múscul principal que respecti la regla de pesos del bloc. */
export function swapExercise(workout, index, ctx) {
  const entry = workout.exercises[index];
  if (!entry) return workout;
  const profile = { ...ctx.profile, goal: workout.goal, level: workout.level };
  const pool = buildPool({ exercises: ctx.exercises, profile, location: ctx.location });
  const mainTarget = entry.primary.includes(entry.slot.target) ? entry.slot.target : entry.primary[0];
  const inWorkout = new Set(workout.exercises.map((e) => e.exerciseId));
  const st = makeState({ ...ctx, profile }, workout, `swap${index}:${entry.seen.length}`);
  workout.exercises.forEach((e, i) => { if (i !== index) st.patterns.add(e.pattern); });
  const members = workout.exercises.filter((e, i) => i !== index && e.block === entry.block);
  const rounds = workout.blocks[entry.block]?.rounds || entry.sets.length;
  const samePrimaryPool = pool.filter((c) => c.targets.primary.includes(mainTarget));
  const slot = { ...entry.slot, target: mainTarget };
  let res = pickForSlot(samePrimaryPool, slot, new Set([...inWorkout, ...entry.seen]), st, members, { ...ctx, profile }, rounds);
  let seen = entry.seen;
  if (!res) { res = pickForSlot(samePrimaryPool, slot, inWorkout, st, members, { ...ctx, profile }, rounds); seen = []; }
  if (!res) return workout;
  const next = res.entry;
  next.slot = entry.slot;
  next.seen = [...seen, entry.exerciseId, next.exerciseId].filter((v, i, a) => a.indexOf(v) === i);
  const exercises = [...workout.exercises];
  exercises[index] = next;
  return finalize({ ...workout, exercises }, { ...ctx, profile });
}

/** 🔄 Regenerar tot amb una seed nova, respectant els exercicis bloquejats. */
export function regenerateWorkout(workout, ctx, seed = newSeed()) {
  const profile = { ...ctx.profile, goal: workout.goal, level: workout.level };
  const pool = buildPool({ exercises: ctx.exercises, profile, location: ctx.location });
  const { blocks, slots } = layout(workout.targetMuscles, workout.durationMin, workout.goal, workout.level, { blocks: workout.blocks.length, rounds: workout.blocks[0]?.rounds || 3 });
  const locked = workout.exercises.filter((e) => e.locked);
  const plan = slots.map((slot) => {
    const prev = locked.find((e) => e.block === slot.block && e.pos === slot.pos);
    return prev ? { slot: prev.slot, entry: prev } : { slot };
  });
  const next = { ...workout, seed, blocks, exercises: [] };
  fillPlan(next, plan, pool, { ...ctx, profile });
  return finalize(next, { ...ctx, profile });
}

export function toggleLock(workout, index) {
  const exercises = workout.exercises.map((e, i) => (i === index ? { ...e, locked: !e.locked } : e));
  return { ...workout, exercises };
}

/** Converteix una sessió desada amb l'esquema 1 (llista plana) a blocs de 3. */
export function migrateWorkout(w) {
  if (!w || w.schemaVersion >= 2) return w;
  const exercises = (w.exercises || []).map((e, i) => ({ ...e, block: Math.floor(i / 3), pos: ['A', 'B', 'C'][i % 3], slot: { ...e.slot, block: Math.floor(i / 3), pos: ['A', 'B', 'C'][i % 3] } }));
  const nBlocks = Math.ceil(exercises.length / 3);
  const blocks = Array.from({ length: nBlocks }, (_, i) => ({
    index: i, label: `Bloc ${i + 1}`, rounds: exercises[i * 3]?.sets.length || 3, transitionSec: 20, restAfterRoundSec: 90,
    entries: exercises.map((e, k) => (e.block === i ? k : -1)).filter((k) => k >= 0),
  }));
  const warmup = (w.warmup || []).map((x) => ({ kind: 'cardio', name: x.text, seconds: (x.minutes || 1) * 60 }));
  return { ...w, schemaVersion: 2, exercises, blocks, warmup, cooldown: [] };
}

export const __debug = { scoreCandidate, easePenalty, hardPenalty, makeState, layout };

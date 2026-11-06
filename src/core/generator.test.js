import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import custom from '../data/custom-exercises.json';
import coreIds from '../data/core-exercises.json';
import templates from '../data/templates.json';
import { createLocation, locationCapabilities, locationFromTemplate, resolveCap } from './inventory.js';
import { generateWorkout, swapExercise, regenerateWorkout, toggleLock, buildPool, migrateWorkout } from './generator.js';
import { getRequirements, feasibility } from './requirements.js';
import { fatigueScores, fatigueLevels, levelsToBodyData } from './fatigue.js';
import { adaptForLoad } from './adaptations.js';
import { prescribe, blockParams } from './prescription.js';
import { epley1RM, baseLift1RM } from './ratios.js';
import { weightConflict, planBlocks, fitSession } from './blocks.js';
import { demandScore, bodyweightCapacity } from './demand.js';

const dataset = JSON.parse(readFileSync(new URL('../../public/data/exercises.json', import.meta.url), 'utf8'));
const exercises = [...dataset, ...custom];
const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));
const profile = { sex: 'male', age: 26, bodyWeightKg: 85, heightCm: 186, goal: 'muscle', level: 'intermediate', limitations: [] };

const myGym = () => createLocation({
  name: 'Gimnàs',
  kind: 'gym',
  items: [
    { catalogId: 'barbell_olympic', attrs: { weightKg: 20 } },
    { catalogId: 'plates', attrs: { plates: [5, 10, 15, 20, 25].map((kg) => ({ kg, qty: 2 })) } },
    { catalogId: 'bench_flat' },
    { catalogId: 'rack' },
  ],
});
const casa = () => createLocation({ name: 'Casa', kind: 'home', items: [{ catalogId: 'jug', attrs: { volumeL: 8, qty: 2, content: 'sand' } }, { catalogId: 'chair' }] });
const blockEntries = (w, b) => w.blocks[b].entries.map((i) => w.exercises[i]);

describe('prescripció, ràtios i adaptacions', () => {
  it('esquemes exigents (RIR 1) i blocs per objectiu', () => {
    expect(prescribe({ goal: 'muscle', compound: true, level: 'intermediate' })).toMatchObject({ repsLow: 6, repsHigh: 10, rir: 1 });
    expect(prescribe({ goal: 'strength', compound: true, level: 'intermediate' })).toMatchObject({ repsLow: 3, repsHigh: 6 });
    expect(blockParams('muscle', 'intermediate')).toMatchObject({ rounds: 4, restAfterRoundSec: 90 });
    expect(blockParams('muscle', 'advanced').rounds).toBe(5);
    expect(blockParams('muscle', 'novice').rounds).toBe(3);
  });
  it('Epley i referències del perfil', () => {
    expect(epley1RM(100, 5)).toBeCloseTo(116.67, 1);
    expect(epley1RM(100, 12)).toBeNull();
    expect(baseLift1RM('bench', { ...profile, referenceLifts: { bench: { kg: 80, reps: 5 } } })).toMatchObject({ fromReference: true });
  });
  it('material curt: puja reps i ho explica', () => {
    const a = adaptForLoad({ oneRM: 25, maxKg: 15, p: { repsLow: 6, repsHigh: 10, rir: 2, restSec: 120 } });
    expect(a.strategies).toContain('moreReps');
    expect(a.text).toMatch(/Amb 15 kg no arribes a 6–10 reps al RIR 2/);
  });
  it('si en sobra molt: tempo + 1½ i mai més de 15 reps', () => {
    const a = adaptForLoad({ oneRM: 100, maxKg: 12, p: { repsLow: 6, repsHigh: 10, rir: 1, restSec: 120 }, unilateral: true });
    expect(a.strategies).toEqual(expect.arrayContaining(['unilateral', 'tempo', 'oneAndHalf']));
    expect(a.repsHigh).toBeLessThanOrEqual(15);
  });
  it('també amb pes corporal', () => {
    const a = adaptForLoad({ capacity: 40, p: { repsLow: 6, repsHigh: 10, rir: 1 } });
    expect(a.text).toMatch(/^Amb el teu pes corporal no arribes/);
  });
});

describe('exigència', () => {
  const by = (n) => dataset.find((e) => e.name === n);
  it('les variants fàcils puntuen per sota de les exigents', () => {
    expect(demandScore(by('Glute Kickback'))).toBeLessThan(0);
    expect(demandScore(by('Crunches'))).toBeLessThan(0);
    expect(demandScore(by('Pullups'))).toBeGreaterThan(demandScore(by('Band Assisted Pull-Up')));
    expect(demandScore(byId.custom_pistol_squat)).toBeGreaterThan(demandScore(by('Bodyweight Squat')));
  });
  it('capacitat amb pes corporal segons nivell, variant i referències', () => {
    expect(bodyweightCapacity(by('Pushups'), profile)).toBe(25);
    expect(bodyweightCapacity(by('Pushups'), { ...profile, referenceLifts: { pushups: 40 } })).toBe(40);
    expect(bodyweightCapacity(byId.custom_pistol_squat, profile)).toBeLessThan(6);
    expect(bodyweightCapacity(by('Barbell Squat'), profile)).toBeNull();
  });
});

describe('blocs A-B-C', () => {
  it('regla de pesos: només un exercici amb dues peses, tret que sigui el mateix pes', () => {
    const w = (kg, pair, implement = 'dumbbell', itemUid = 'd1', itemKind = 'list') => ({ weight: { kg, pair, implement, itemUid, itemKind } });
    expect(weightConflict([w(16, true), w(20, true)])).toBeTruthy();
    expect(weightConflict([w(16, true), w(16, true)])).toBeNull();
    expect(weightConflict([w(16, true), w(24, false)])).toBeTruthy();
    expect(weightConflict([w(12, false), w(24, false)])).toBeNull(); // una pesa cada un
    expect(weightConflict([w(40, false, 'barbell', 'bar', 'bar'), w(60, false, 'barbell', 'bar', 'bar')])).toBeTruthy(); // canviar discs
    expect(weightConflict([w(8, false, 'jug', 'j', 'fillable'), w(12, false, 'jug', 'j', 'fillable')])).toBeTruthy(); // omplir la garrafa
    expect(weightConflict([w(50, false, 'machine:x', 'm', 'stack'), w(16, true)])).toBeNull(); // màquina: canviar el pin és ràpid
    expect(weightConflict([{ weight: null }, w(16, true)])).toBeNull();
  });
  it('repartiment: A compost gran, sense músculs repetits dins el bloc quan es pot', () => {
    const b = planBlocks(['chest', 'lats', 'quads', 'hamstrings', 'abs', 'triceps'], 2);
    expect(b).toHaveLength(2);
    b.forEach((bl) => {
      expect(bl.map((s) => s.pos)).toEqual(['A', 'B', 'C']);
      expect(new Set(bl.map((s) => s.target)).size).toBe(3);
    });
    expect(b[0][0].target).toBe('quads');
  });
  it('blocs i rondes segons la durada', () => {
    const p = blockParams('muscle', 'intermediate');
    expect(fitSession(60, p)).toEqual({ blocks: 3, rounds: 4 });
    expect(fitSession(45, p)).toEqual({ blocks: 2, rounds: 4 });
    expect(fitSession(90, p).blocks).toBe(4);
    expect(fitSession(20, p).rounds).toBeLessThan(4);
  });
});

describe('sessions generades (molts llocs, objectius i seeds)', () => {
  const locs = [...templates.map((t) => locationFromTemplate(t)), casa(), myGym()];
  const targetsSets = [['chest', 'front-delts', 'triceps'], ['quads', 'glutes', 'hamstrings', 'calves'], ['chest', 'lats', 'middle-back', 'quads', 'glutes', 'abs']];
  const cases = [];
  for (const loc of locs) for (const goal of ['muscle', 'strength', 'fatloss']) for (const targets of targetsSets) for (const seed of [1, 2]) cases.push({ loc, goal, targets, seed });

  it(`regla de pesos, material estricte i durada (${cases.length} sessions)`, () => {
    for (const { loc, goal, targets, seed } of cases) {
      const w = generateWorkout({ exercises, profile: { ...profile, goal }, location: loc, coreIds }, { targets, durationMin: 60, seed });
      const caps = locationCapabilities(loc);
      expect(w.blocks.length).toBeGreaterThan(0);
      for (let b = 0; b < w.blocks.length; b++) {
        expect(weightConflict(blockEntries(w, b)), `${loc.name} ${goal} bloc ${b}`).toBeNull();
        expect(blockEntries(w, b).map((e) => e.pos)).toEqual(['A', 'B', 'C'].slice(0, blockEntries(w, b).length));
      }
      for (const e of w.exercises) {
        expect(feasibility(byId[e.exerciseId], caps, loc.constraints).ok, `${loc.name}: ${e.exerciseId}`).toBe(true);
        expect(e.sets.length).toBe(w.blocks[e.block].rounds);
      }
      // escalfament i estiraments: només amb material del lloc
      for (const it of [...w.warmup, ...w.cooldown]) {
        if (!it.exerciseId) continue;
        expect(byId[it.exerciseId], it.exerciseId).toBeTruthy();
      }
      expect(w.estimatedMin).toBeLessThanOrEqual(60 * 1.2 + 1);
    }
  });

  it('una sessió de gimnàs per a un intermedi no té exercicis "fàcils"', () => {
    const gym = locationFromTemplate(templates[0]);
    for (const seed of [1, 2, 3, 4, 5]) {
      const w = generateWorkout({ exercises, profile, location: gym, coreIds }, { targets: ['chest', 'lats', 'quads', 'hamstrings', 'abs'], durationMin: 60, seed });
      for (const e of w.exercises) expect(demandScore(byId[e.exerciseId]), e.exerciseId).toBeGreaterThan(-1);
    }
  });

  it('estiraments sense company i amb el material que hi ha (paret per als bessons)', () => {
    const noWall = createLocation({ items: [{ catalogId: 'dumbbells_fixed' }] });
    const w = generateWorkout({ exercises, profile, location: noWall, coreIds }, { targets: ['calves', 'quads'], durationMin: 45, seed: 1 });
    expect(w.cooldown.some((c) => c.exerciseId === 'Calf_Stretch_Hands_Against_Wall')).toBe(false);
    const withWall = createLocation({ items: [{ catalogId: 'dumbbells_fixed' }, { catalogId: 'wall' }] });
    const w2 = generateWorkout({ exercises, profile, location: withWall, coreIds }, { targets: ['calves', 'quads'], durationMin: 45, seed: 1 });
    expect(w2.cooldown.some((c) => c.exerciseId === 'Calf_Stretch_Hands_Against_Wall')).toBe(true);
    expect(w.warmup[0].kind).toBe('cardio');
    expect(w.cooldown.at(-1).kind).toBe('breath');
  });

  it('escalfament amb cardio del lloc si n\'hi ha', () => {
    const w = generateWorkout({ exercises, profile, location: locationFromTemplate(templates[0]), coreIds }, { targets: ['quads'], durationMin: 45, seed: 1 });
    expect(w.warmup[0].name).toMatch(/Remadora|Cinta/);
    const noJ = createLocation({ items: [{ catalogId: 'dumbbells_fixed' }], constraints: { noJumps: true } });
    const w2 = generateWorkout({ exercises, profile, location: noJ, coreIds }, { targets: ['quads'], durationMin: 45, seed: 1 });
    expect(w2.warmup[0].name).toMatch(/Marxa/);
  });

  it('kettlebells sense parell → cap exercici de dues kettlebells', () => {
    const loc = createLocation({ items: [{ catalogId: 'kettlebells', attrs: { weights: [8, 12, 16, 20, 24] } }] });
    const pool = buildPool({ exercises, profile, location: loc });
    pool.forEach((c) => expect(c.req.load?.pair && c.req.load.cap === 'kettlebell' ? c.hasLoad : true, c.ex.name).toBe(true));
  });
});

describe('fatiga', () => {
  it('principal ×1, secundari ×0,5 i 5 nivells', () => {
    const scores = fatigueScores([{ sets: 4, primary: ['chest'], secondary: ['triceps'] }, { sets: 3, primary: ['triceps'], secondary: [] }]);
    expect(scores).toEqual({ chest: 4, triceps: 5 });
    expect(fatigueLevels(scores)).toEqual({ chest: 4, triceps: 5 });
    expect(levelsToBodyData({ lats: 2, 'middle-back': 4 })).toEqual([{ name: 'upper-back', muscles: ['upper-back'], frequency: 4 }]);
  });
});

describe('criteri 1: press de banca al Gimnàs amb discs de 5 a 25 kg', () => {
  it('proposa càrregues en salts de 10 kg i mostra el muntatge', () => {
    const w = generateWorkout({ exercises, profile: { ...profile, goal: 'strength' }, location: myGym(), coreIds }, { targets: ['chest'], durationMin: 45, seed: 1 });
    const bench = w.exercises.find((e) => /bench press/i.test(byId[e.exerciseId].name) && getRequirements(byId[e.exerciseId]).load?.cap === 'barbell');
    expect(bench, w.exercises.map((e) => e.exerciseId).join(',')).toBeTruthy();
    bench.load.chips.map((c) => c.kg).forEach((k) => expect((k - 20) % 10).toBe(0));
    expect(bench.sets[0].loadSetup).toMatch(/^Barra 20( \+ 2×\d+)* = \d+ kg$|^Barra 20 kg$/);
  });
});

describe('criteri 2: Casa amb 2 garrafes de sorra i una cadira, cames', () => {
  const legs = ['quads', 'glutes', 'hamstrings', 'calves'];
  it('sense barra ni màquina, amb garrafa i adaptació explicada (20 seeds)', () => {
    let hits = 0;
    for (let s = 1; s <= 20; s++) {
      const w = generateWorkout({ exercises, profile, location: casa(), coreIds }, { targets: legs, durationMin: 45, seed: s });
      for (const e of w.exercises) {
        const req = getRequirements(byId[e.exerciseId]).requires.flat();
        expect(req.some((c) => c === 'barbell' || c.startsWith('machine:') || c.startsWith('cable'))).toBe(false);
      }
      if (w.exercises.some((e) => /goblet|búlgar/i.test(byId[e.exerciseId].name))) hits++;
      expect(w.exercises.some((e) => e.adaptationText)).toBe(true);
    }
    expect(hits).toBeGreaterThanOrEqual(18);
  });
  it('és determinista per seed', () => {
    const a = generateWorkout({ exercises, profile, location: casa(), coreIds }, { targets: legs, durationMin: 45, seed: 7 });
    const b = generateWorkout({ exercises, profile, location: casa(), coreIds }, { targets: legs, durationMin: 45, seed: 7 });
    expect(b.exercises.map((e) => e.exerciseId)).toEqual(a.exercises.map((e) => e.exerciseId));
  });
});

describe('criteri 3: sense salts al generador', () => {
  it('objectiu potència en un lloc "Sense salts" → cap pliometria', () => {
    const loc = createLocation({ items: [{ catalogId: 'plyo_box' }, { catalogId: 'hurdles' }, { catalogId: 'dumbbells_fixed' }], constraints: { noJumps: true } });
    const p = { ...profile, goal: 'power' };
    buildPool({ exercises, profile: p, location: loc }).forEach((c) => {
      expect(c.ex.category).not.toBe('plyometrics');
      expect(c.req.jump).toBe(false);
    });
    expect(buildPool({ exercises, profile: p, location: { ...loc, constraints: { noJumps: false } } }).some((c) => c.ex.category === 'plyometrics')).toBe(true);
  });
});

describe('criteri 4: canviar i regenerar', () => {
  const gym = locationFromTemplate(templates[0]);
  const ctx = { exercises, profile, location: gym, coreIds };
  const w = generateWorkout(ctx, { targets: ['chest', 'triceps', 'front-delts'], durationMin: 60, seed: 11 });
  const caps = locationCapabilities(gym);

  it('canviar → realitzable, mateix múscul principal, sense repetir i respectant la regla de pesos', () => {
    let cur = w;
    for (let k = 0; k < 6; k++) {
      const before = cur.exercises[0];
      const after = swapExercise(cur, 0, ctx);
      const ne = after.exercises[0];
      expect(ne.exerciseId).not.toBe(before.exerciseId);
      const target = before.primary.includes(before.slot.target) ? before.slot.target : before.primary[0];
      expect(ne.primary).toContain(target);
      expect(feasibility(byId[ne.exerciseId], caps, gym.constraints).ok).toBe(true);
      expect(weightConflict(blockEntries(after, 0))).toBeNull();
      const ids = after.exercises.map((e) => e.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
      cur = after;
    }
  });

  it('regenerar respecta els bloquejats i manté els blocs', () => {
    const locked = toggleLock(w, 1);
    const r = regenerateWorkout(locked, ctx, 999);
    expect(r.exercises[1].exerciseId).toBe(w.exercises[1].exerciseId);
    expect(r.exercises[1].locked).toBe(true);
    expect(r.blocks.length).toBe(w.blocks.length);
    expect(r.exercises.filter((e, i) => i !== 1 && e.exerciseId !== w.exercises[i]?.exerciseId).length).toBeGreaterThan(0);
  });

  it('sessió completa: escalfament, blocs, estiraments, títol i durada', () => {
    expect(w.title).toBe('Pit, espatlles i tríceps');
    expect(w.warmup.length).toBeGreaterThanOrEqual(5);
    expect(w.cooldown.length).toBeGreaterThanOrEqual(4);
    expect(w.exercises.length).toBeGreaterThanOrEqual(6);
    expect(w.estimatedMin).toBeGreaterThan(40);
  });
});

describe('migració de sessions desades (esquema 1 → 2)', () => {
  it('agrupa en blocs de 3', () => {
    const old = { schemaVersion: 1, exercises: Array.from({ length: 5 }, (_, i) => ({ exerciseId: `e${i}`, slot: { kind: 'c', target: 'chest' }, sets: [{}, {}, {}] })), warmup: [{ text: 'x', minutes: 5 }] };
    const m = migrateWorkout(old);
    expect(m.schemaVersion).toBe(2);
    expect(m.blocks.map((b) => b.entries)).toEqual([[0, 1, 2], [3, 4]]);
    expect(m.exercises[4].pos).toBe('B');
    expect(m.warmup[0]).toMatchObject({ kind: 'cardio', seconds: 300 });
  });
});

// resolveCap s'importa per assegurar que l'API pública existeix
expect(typeof resolveCap).toBe('function');

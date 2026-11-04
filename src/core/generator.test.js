import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import custom from '../data/custom-exercises.json';
import coreIds from '../data/core-exercises.json';
import { createLocation, locationCapabilities } from './inventory.js';
import { generateWorkout, swapExercise, regenerateWorkout, toggleLock, planSlots, buildPool } from './generator.js';
import { getRequirements, feasibility } from './requirements.js';
import { fatigueScores, fatigueLevels, levelsToBodyData } from './fatigue.js';
import { adaptForLoad } from './adaptations.js';
import { prescribe, exerciseCount } from './prescription.js';
import { epley1RM, baseLift1RM } from './ratios.js';

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

const casa = () => createLocation({
  name: 'Casa',
  kind: 'home',
  items: [
    { catalogId: 'jug', attrs: { volumeL: 8, qty: 2, content: 'sand' } },
    { catalogId: 'chair' },
  ],
});

describe('prescripció i ràtios', () => {
  it('nombre d\'exercicis per durada', () => {
    expect(exerciseCount(20, 'muscle')).toBe(3);
    expect(exerciseCount(60, 'muscle')).toBe(6);
    expect(exerciseCount(60, 'strength')).toBe(5);
  });
  it('esquemes per objectiu', () => {
    expect(prescribe({ goal: 'strength', compound: true, level: 'intermediate' })).toMatchObject({ repsLow: 3, repsHigh: 6, restSec: 180 });
    expect(prescribe({ goal: 'muscle', compound: false, level: 'intermediate' })).toMatchObject({ repsLow: 10, repsHigh: 15 });
    expect(prescribe({ goal: 'muscle', compound: true, level: 'novice' }).sets).toBe(2);
  });
  it('Epley només fins a 10 reps i referències del perfil', () => {
    expect(epley1RM(100, 5)).toBeCloseTo(116.67, 1);
    expect(epley1RM(100, 12)).toBeNull();
    expect(baseLift1RM('bench', { ...profile, referenceLifts: { bench: { kg: 80, reps: 5 } } })).toMatchObject({ fromReference: true });
    expect(baseLift1RM('bench', profile).kg).toBe(85);
  });
});

describe('adaptacions', () => {
  it('si la càrrega es queda curta, puja reps i ho explica', () => {
    const a = adaptForLoad({ oneRM: 30, maxKg: 15, p: { repsLow: 6, repsHigh: 10, rir: 2, restSec: 120 }, goal: 'muscle' });
    expect(a.strategies).toContain('moreReps');
    expect(a.text).toMatch(/Amb 15 kg no arribes a 6–10 reps al RIR 2/);
  });
  it('si cal molt més, tempo i 1½', () => {
    const a = adaptForLoad({ oneRM: 100, maxKg: 12, p: { repsLow: 6, repsHigh: 10, rir: 2, restSec: 120 }, goal: 'muscle', unilateral: true });
    expect(a.strategies).toEqual(expect.arrayContaining(['unilateral', 'tempo']));
    expect(a.tempo).toBe('3-1-1');
  });
  it('si n\'hi ha prou, no adapta', () => {
    expect(adaptForLoad({ oneRM: 100, maxKg: 100, p: { repsLow: 6, repsHigh: 10, rir: 2, restSec: 120 } })).toBeNull();
  });
});

describe('fatiga', () => {
  it('principal ×1, secundari ×0,5 i 5 nivells', () => {
    const scores = fatigueScores([{ sets: 4, primary: ['chest'], secondary: ['triceps'] }, { sets: 3, primary: ['triceps'], secondary: [] }]);
    expect(scores).toEqual({ chest: 4, triceps: 5 });
    const lv = fatigueLevels(scores);
    expect(lv.triceps).toBe(5);
    expect(lv.chest).toBe(4);
    const data = levelsToBodyData({ lats: 2, 'middle-back': 4 });
    expect(data).toEqual([{ name: 'upper-back', muscles: ['upper-back'], frequency: 4 }]);
  });
});

describe('franges', () => {
  it('compost principal del grup més gran, segon d\'una altra regió, core al final', () => {
    const s = planSlots(['chest', 'triceps', 'quads', 'abs'], 5);
    expect(s[0]).toEqual({ kind: 'a', target: 'quads' });
    expect(s[1]).toEqual({ kind: 'b', target: 'chest' });
    expect(s.at(-1)).toEqual({ kind: 'd', target: 'abs' });
    expect(s).toHaveLength(5);
  });
});

describe('criteri 1: press de banca al Gimnàs amb discs de 5 a 25 kg', () => {
  it('proposa càrregues en salts de 10 kg i mostra el muntatge', () => {
    const w = generateWorkout({ exercises, profile: { ...profile, goal: 'strength' }, location: myGym(), coreIds }, { targets: ['chest'], durationMin: 45, seed: 1 });
    const bench = w.exercises.find((e) => /bench press/i.test(byId[e.exerciseId].name) && getRequirements(byId[e.exerciseId]).load?.cap === 'barbell');
    expect(bench, w.exercises.map((e) => e.exerciseId).join(',')).toBeTruthy();
    const kgs = bench.load.chips.map((c) => c.kg);
    expect(kgs.length).toBeGreaterThan(1);
    kgs.forEach((k) => expect((k - 20) % 10).toBe(0));
    expect(bench.sets[0].loadSetup).toMatch(/^Barra 20 \+ 2×\d+.* = \d+ kg$/);
    // 85 kg intermedi → 1RM ≈ 85 → 4–5 reps al RIR 2 ≈ 66 kg → 60 o 70
    expect([60, 70]).toContain(bench.sets[0].loadKg);
  });
});

describe('criteri 2: Casa amb 2 garrafes de 8 L de sorra i una cadira, cames', () => {
  const legs = ['quads', 'glutes', 'hamstrings', 'calves'];
  const w = generateWorkout({ exercises, profile, location: casa(), coreIds }, { targets: legs, durationMin: 45, seed: 7 });
  const names = w.exercises.map((e) => byId[e.exerciseId].name);

  it('cap exercici demana barra ni màquina', () => {
    for (const e of w.exercises) {
      const req = getRequirements(byId[e.exerciseId]).requires.flat();
      expect(req.some((c) => c === 'barbell' || c.startsWith('machine:') || c.startsWith('cable'))).toBe(false);
    }
  });
  it('surten goblet o búlgara amb garrafa', () => {
    expect(names.some((n) => /goblet|búlgar/i.test(n)), names.join(' | ')).toBe(true);
    expect(w.exercises.some((e) => /Garrafa/.test(e.sets[0].loadSetup || ''))).toBe(true);
  });
  it('la càrrega es queda curta → adaptació explicada', () => {
    const adapted = w.exercises.filter((e) => e.adaptationText);
    expect(adapted.length).toBeGreaterThan(0);
    expect(adapted[0].adaptationText).toMatch(/Amb \d+(,\d+)? kg no arribes/);
  });
  it('passa amb la majoria de seeds (no és casualitat)', () => {
    let hits = 0;
    for (let s = 1; s <= 20; s++) {
      const wx = generateWorkout({ exercises, profile, location: casa(), coreIds }, { targets: legs, durationMin: 45, seed: s });
      if (wx.exercises.some((e) => /goblet|búlgar/i.test(byId[e.exerciseId].name))) hits++;
    }
    expect(hits).toBeGreaterThanOrEqual(18);
  });
  it('és determinista per seed', () => {
    const w2 = generateWorkout({ exercises, profile, location: casa(), coreIds }, { targets: legs, durationMin: 45, seed: 7 });
    expect(w2.exercises.map((e) => e.exerciseId)).toEqual(w.exercises.map((e) => e.exerciseId));
  });
});

describe('criteri 3: sense salts al generador', () => {
  it('objectiu potència en un lloc "Sense salts" → cap pliometria', () => {
    const loc = createLocation({ items: [{ catalogId: 'plyo_box' }, { catalogId: 'hurdles' }, { catalogId: 'dumbbells_fixed' }], constraints: { noJumps: true } });
    const p = { ...profile, goal: 'power' };
    const pool = buildPool({ exercises, profile: p, location: loc });
    pool.forEach((c) => {
      expect(c.ex.category).not.toBe('plyometrics');
      expect(c.req.jump).toBe(false);
    });
    const w = generateWorkout({ exercises, profile: p, location: loc }, { targets: ['quads', 'glutes', 'calves'], durationMin: 60, seed: 3 });
    w.exercises.forEach((e) => expect(byId[e.exerciseId].category).not.toBe('plyometrics'));
    // i sense la restricció, sí que n'hi ha
    const loc2 = { ...loc, constraints: { noJumps: false } };
    const pool2 = buildPool({ exercises, profile: p, location: loc2 });
    expect(pool2.some((c) => c.ex.category === 'plyometrics')).toBe(true);
  });
});

describe('criteri 4: canviar i regenerar', () => {
  const gym = myGym();
  gym.items.push({ uid: 'x1', catalogId: 'dumbbells_fixed', attrs: {} }, { uid: 'x2', catalogId: 'bench_adjustable', attrs: {} }, { uid: 'x3', catalogId: 'cable_station', attrs: {} });
  const ctx = { exercises, profile, location: gym, coreIds };
  const w = generateWorkout(ctx, { targets: ['chest', 'triceps', 'front-delts'], durationMin: 45, seed: 11 });
  const caps = locationCapabilities(gym);

  it('canviar → realitzable, mateix múscul principal i no repetit', () => {
    let cur = w;
    for (let k = 0; k < 6; k++) {
      const before = cur.exercises[0];
      const after = swapExercise(cur, 0, ctx);
      const ne = after.exercises[0];
      expect(ne.exerciseId).not.toBe(before.exerciseId);
      const target = before.primary.includes(before.slot.target) ? before.slot.target : before.primary[0];
      expect(ne.primary).toContain(target);
      expect(feasibility(byId[ne.exerciseId], caps, gym.constraints).ok).toBe(true);
      const ids = after.exercises.map((e) => e.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
      cur = after;
    }
  });

  it('regenerar respecta els bloquejats', () => {
    const locked = toggleLock(w, 1);
    const r = regenerateWorkout(locked, ctx, 999);
    expect(r.exercises[1].exerciseId).toBe(w.exercises[1].exerciseId);
    expect(r.exercises[1].locked).toBe(true);
    expect(r.seed).toBe(999);
    const changed = r.exercises.filter((e, i) => i !== 1 && e.exerciseId !== w.exercises[i]?.exerciseId);
    expect(changed.length).toBeGreaterThan(0);
  });

  it('resultat complet: títol, escalfament, durada, nota de cobertura', () => {
    expect(w.title).toBe('Pit, espatlles i tríceps');
    expect(w.warmup[0].minutes).toBe(5);
    expect(w.estimatedMin).toBeGreaterThan(20);
    expect(w.uncovered).toEqual([]);
  });
});

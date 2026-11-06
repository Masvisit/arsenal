import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import custom from '../data/custom-exercises.json';
import templates from '../data/templates.json';
import { locationFromTemplate } from './inventory.js';
import { generateWorkout } from './generator.js';
import { buildTimeline, timelineSeconds, nextExerciseStep, summarizeSession } from './session.js';
import { weekStart, weekSummary, weeklySeries, setsByTarget, weekStreak, bestSets } from './history.js';

const dataset = JSON.parse(readFileSync(new URL('../../public/data/exercises.json', import.meta.url), 'utf8'));
const exercises = [...dataset, ...custom];
const profile = { sex: 'male', bodyWeightKg: 85, goal: 'muscle', level: 'intermediate', limitations: [] };
const w = generateWorkout({ exercises, profile, location: locationFromTemplate(templates[0]) }, { targets: ['chest', 'lats', 'quads'], durationMin: 60, seed: 4 });
const steps = buildTimeline(w);

describe('timeline de la sessió', () => {
  it('escalfament → blocs en circuit A-B-C → estiraments', () => {
    expect(steps[0].phase).toBe('warmup');
    expect(steps.at(-1).phase).toBe('cooldown');
    const main = steps.filter((s) => s.phase === 'main' && s.block === 0);
    const b = w.blocks[0];
    expect(main).toHaveLength(b.rounds * b.entries.length);
    // ordre A, B, C, A, B, C…
    expect(main.slice(0, 6).map((s) => s.pos)).toEqual(['A', 'B', 'C', 'A', 'B', 'C']);
    expect(main.map((s) => s.round)).toEqual(Array.from({ length: b.rounds }, (_, r) => [r + 1, r + 1, r + 1]).flat());
  });
  it('descansos: canvi entre exercicis, descans de ronda i canvi de bloc', () => {
    const rests = steps.filter((s) => s.phase === 'rest');
    expect(rests.filter((s) => s.kind === 'transition').length).toBeGreaterThan(0);
    expect(rests.filter((s) => s.kind === 'round').length).toBe(w.blocks.reduce((n, b) => n + b.rounds - 1, 0));
    expect(rests.filter((s) => s.kind === 'block').length).toBe(w.blocks.length - 1);
    expect(steps.every((s) => s.estSec > 0)).toBe(true);
  });
  it('durada total coherent amb l\'estimació', () => {
    expect(Math.abs(timelineSeconds(steps) / 60 - w.estimatedMin)).toBeLessThan(6);
  });
  it('mostra el següent exercici saltant descansos', () => {
    const i = steps.findIndex((s) => s.phase === 'main');
    expect(nextExerciseStep(steps, i).phase).not.toBe('rest');
  });
  it('resum per a l\'historial', () => {
    const log = {};
    steps.filter((s) => s.phase === 'main').slice(0, 5).forEach((s) => { log[s.id] = { done: true, reps: 10, kg: s.loadKg }; });
    const sum = summarizeSession({ workout: w, steps, log, startedAt: 0, endedAt: 3600_000, id: 's1' });
    expect(sum.setsDone).toBe(5);
    expect(sum.setsPlanned).toBe(steps.filter((s) => s.phase === 'main').length);
    expect(sum.durationSec).toBe(3600);
    expect(sum.sets[0].primary.length).toBeGreaterThan(0);
  });
});

describe('historial', () => {
  const now = new Date(2026, 10, 6, 18, 0).getTime(); // dijous
  const day = 24 * 3600 * 1000;
  const log = (daysAgo, sets = 10, primary = ['chest']) => ({ endedAt: now - daysAgo * day, durationSec: 3000, setsDone: sets, volumeKg: 1000, sets: Array.from({ length: sets }, () => ({ exerciseId: 'x', primary, secondary: ['triceps'], loadKg: 50, reps: 8 })) });
  const logs = [log(0), log(2), log(8), log(15), log(30)];
  it('setmana comença en dilluns', () => {
    expect(new Date(weekStart(now)).getDay()).toBe(1);
  });
  it('resum setmanal i sèrie', () => {
    expect(weekSummary(logs, now)).toEqual({ sessions: 2, minutes: 100, sets: 20, volumeKg: 2000 });
    const s = weeklySeries(logs, 8, now);
    expect(s).toHaveLength(8);
    expect(s.at(-1).sessions).toBe(2);
  });
  it('sèries per múscul (principal ×1, secundari ×0,5)', () => {
    expect(setsByTarget(logs, 7, now)).toEqual({ chest: 20, triceps: 10 });
  });
  it('ratxa de setmanes i millors marques', () => {
    expect(weekStreak(logs, now)).toBe(3);
    expect(bestSets(logs).x).toMatchObject({ loadKg: 50, reps: 8 });
  });
});

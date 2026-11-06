// Sessió en blocs de 3 exercicis (A, B, C) fets en circuit: A-B-C, A-B-C, A-B-C… JS pur.
import { TARGET_SIZE } from './muscles.js';

export const BLOCK_LETTERS = ['A', 'B', 'C'];

const UPPER = new Set(['chest', 'front-delts', 'side-delts', 'rear-delts', 'biceps', 'triceps', 'forearms', 'lats', 'middle-back', 'traps', 'neck']);
const LOWER = new Set(['quads', 'glutes', 'hamstrings', 'calves', 'adductors', 'abductors']);
const CORE = new Set(['abs', 'obliques', 'lower-back']);
export const regionOf = (t) => (UPPER.has(t) ? 'upper' : LOWER.has(t) ? 'lower' : 'core');

// Elements on canviar de pes és una feinada (cal moure discs, omplir o buidar)
const SLOW_CHANGE = new Set(['adjustable', 'fillable', 'bar']);

/**
 * Regla de pesos dins un bloc (feedback de l'usuari):
 *  - només un exercici pot fer servir dues peses (parell)…
 *  - …tret que tots dos facin servir el mateix pes;
 *  - si dos exercicis fan servir peses, o és el mateix pes o cadascun en fa servir una de sola;
 *  - i mai dos pesos diferents al mateix element lent de canviar (barra, mancuerna de discs, garrafa).
 * @param members entrades amb { load: { kg, pair, itemUid, itemKind, implement } | null }
 * @returns null si és vàlid; si no, el motiu
 */
export function weightConflict(members) {
  const w = members.filter((m) => m?.weight && m.weight.kg != null && m.weight.itemKind !== 'stack');
  for (let i = 0; i < w.length; i++) {
    for (let j = i + 1; j < w.length; j++) {
      const x = w[i].weight;
      const y = w[j].weight;
      const same = Math.abs(x.kg - y.kg) < 0.01 && x.implement === y.implement;
      if (same) continue;
      if (x.pair || y.pair) return 'Dos exercicis amb pes diferent i un d\'ells amb dues peses';
      if (x.itemUid && x.itemUid === y.itemUid && SLOW_CHANGE.has(x.itemKind)) return 'Caldria canviar el pes del mateix element a mitja ronda';
    }
  }
  return null;
}

/**
 * Reparteix els músculs en `n` blocs de 3 posicions.
 * A = compost del grup gran, B = compost d'un altre grup/patró, C = accessori o core.
 * Dins un bloc s'eviten músculs repetits sempre que es pugui.
 */
export function planBlocks(targets, n) {
  const order = [...targets].sort((a, b) => (TARGET_SIZE[b] - TARGET_SIZE[a]) || targets.indexOf(a) - targets.indexOf(b));
  const main = order.filter((t) => !CORE.has(t));
  const core = order.filter((t) => CORE.has(t));
  const pool = main.length ? main : core;
  if (!pool.length || n < 1) return [];
  const blocks = Array.from({ length: n }, () => []);

  // Posició A: els músculs grans (amb compostos de veritat), un per bloc (cíclic)
  const big = pool.filter((t) => TARGET_SIZE[t] >= 5);
  const aPool = big.length ? big : pool;
  for (let b = 0; b < n; b++) blocks[b].push({ pos: 'A', target: aPool[b % aPool.length], kind: 'a' });

  // Posició B: preferim una altra regió (o un altre múscul) que la A del bloc
  const usedAsA = new Set(blocks.map((bl) => bl[0].target));
  const bQueue = [...pool.filter((t) => !usedAsA.has(t)), ...pool];
  for (let b = 0; b < n; b++) {
    const a = blocks[b][0].target;
    let idx = bQueue.findIndex((t) => t !== a && regionOf(t) !== regionOf(a));
    if (idx < 0) idx = bQueue.findIndex((t) => t !== a);
    const t = idx >= 0 ? bQueue.splice(idx, 1)[0] : a;
    blocks[b].push({ pos: 'B', target: t, kind: 'b' });
  }

  // Posició C: el que encara no s'ha cobert; després core; després el que quedi
  const covered = new Set(blocks.flat().map((s) => s.target));
  const cQueue = [...pool.filter((t) => !covered.has(t)), ...(main.length ? core : []), ...pool];
  for (let b = 0; b < n; b++) {
    const inBlock = new Set(blocks[b].map((s) => s.target));
    let idx = cQueue.findIndex((t) => !inBlock.has(t));
    if (idx < 0) idx = 0;
    const t = cQueue.splice(idx, 1)[0];
    blocks[b].push({ pos: 'C', target: t, kind: CORE.has(t) && main.length ? 'd' : 'c' });
  }
  return blocks;
}

/** Segons de feina d'una sèrie (≈3 s per rep, el doble si és a una cama/braç, + 10 s de preparació). */
export function setWorkSec(set, unilateral = false) {
  if (set.seconds) return set.seconds * (unilateral ? 2 : 1) + 10;
  const reps = ((set.repsLow ?? 10) + (set.repsHigh ?? 10)) / 2;
  return Math.round(reps * 3 * (unilateral ? 2 : 1) + 10);
}

/** Durada d'un bloc en segons. */
export function blockSeconds({ rounds, transitionSec, restAfterRoundSec }, workSecs) {
  const perRound = workSecs.reduce((s, x) => s + x, 0) + transitionSec * (workSecs.length - 1);
  return rounds * perRound + (rounds - 1) * restAfterRoundSec;
}

export const WARMUP_MIN = 8;
export const COOLDOWN_MIN = 5;
export const BLOCK_CHANGE_SEC = 120;

/**
 * Quants blocs i rondes caben en una durada (feina típica de 45 s per sèrie).
 * Manté les rondes de l'objectiu i posa tants blocs com hi càpiguen (fins a `maxBlocks`);
 * només si no hi cap ni un bloc es treuen rondes.
 */
export function fitSession(durationMin, params, maxBlocks = 4) {
  const budget = durationMin * 60 * 1.1;
  const total = (n, r) => WARMUP_MIN * 60 + COOLDOWN_MIN * 60 + n * blockSeconds({ ...params, rounds: r }, [45, 45, 45]) + (n - 1) * BLOCK_CHANGE_SEC;
  for (let n = Math.min(4, maxBlocks); n >= 1; n--) if (total(n, params.rounds) <= budget) return { blocks: n, rounds: params.rounds };
  for (let r = params.rounds - 1; r >= 2; r--) if (total(1, r) <= budget) return { blocks: 1, rounds: r };
  return { blocks: 1, rounds: 2 };
}

/** Màxim de blocs segons els músculs triats (perquè no es repeteixin massa). */
export function maxBlocksFor(targets, durationMin) {
  const n = Math.ceil(targets.length * 0.75);
  return Math.max(durationMin >= 45 ? 2 : 1, Math.min(4, n));
}

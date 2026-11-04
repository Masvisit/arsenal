// Estratègies quan el material es queda curt (secció 8.3). JS pur.
import { formatKg } from './loads.js';
import { repsToFailure } from './ratios.js';

export const STRATEGIES = {
  moreReps: 'Pujar reps dins del rang',
  unilateral: 'Variant unilateral',
  tempo: 'Tempo excèntric lent (3-1-1) i pausa de 2 s',
  oneAndHalf: 'Repeticions 1½',
  restPause: 'Rest-pause / myo-reps',
  preFatigue: 'Pre-fatiga',
  density: 'Menys descans (densitat)',
  harder: 'Variant mecànicament més difícil',
  strengthLimit: 'Límit de càrrega per a força',
};

// Màxim de reps acceptable per objectiu abans de canviar d'estratègia
const REP_CEILING = { muscle: 30, endurance: 30, fatloss: 25, strength: 8, power: 6, agentRural: 20 };

// Cada tècnica redueix les reps que pots fer amb la mateixa càrrega (aproximació)
const TEMPO_FACTOR = 0.6;
const ONE_AND_HALF_FACTOR = 0.65;

/**
 * Calcula si cal adaptar i com.
 * @param oneRM 1RM estimat per a l'exercici (kg)
 * @param maxKg càrrega màxima muntable
 * @param p prescripció { repsLow, repsHigh, rir, restSec }
 * @returns null si no cal adaptar; si no { strategies:[codi], repsLow, repsHigh, tempo?, restSec?, text }
 */
export function adaptForLoad({ oneRM, maxKg, p, goal = 'muscle', unilateral = false }) {
  if (!oneRM || !maxKg || p.seconds || p.emom) return null;
  const capacity = Math.floor(repsToFailure(oneRM, maxKg)) - (p.rir ?? 2);
  if (capacity <= p.repsHigh) return null;

  const strategies = [];
  const ceiling = REP_CEILING[goal] ?? 20;
  let repsLow = p.repsLow;
  let repsHigh = p.repsHigh;
  let tempo = null;
  let restSec = p.restSec;
  let effective = capacity;
  const bits = [];

  if (unilateral) { strategies.push('unilateral'); bits.push('treballem a una cama / un braç'); }

  if (goal === 'strength' || goal === 'power') {
    strategies.push('strengthLimit');
    tempo = '3-1-1';
    strategies.push('tempo');
    effective = Math.round(effective * TEMPO_FACTOR);
    repsLow = Math.min(Math.max(p.repsLow, 5), 8);
    repsHigh = Math.max(repsLow + 2, Math.min(effective, 10));
    bits.push(`tempo 3-1-1 amb pausa de 2 s i ${repsLow}–${repsHigh} reps`);
    const text = `Amb ${formatKg(maxKg)} kg no arribes a la intensitat de força (en faries ~${capacity} reps al RIR ${p.rir}) → ${bits.join(', ')}. Mira "Què em falta?" per carregar més.`;
    return { strategies, repsLow, repsHigh, tempo, restSec, text, capacity };
  }

  if (effective <= ceiling) {
    strategies.push('moreReps');
    repsHigh = effective;
    repsLow = Math.max(p.repsLow, effective - 4);
    bits.push(`pugem el rang a ${repsLow}–${repsHigh} reps`);
  } else {
    tempo = '3-1-1';
    strategies.push('tempo');
    effective = Math.round(effective * TEMPO_FACTOR);
    bits.push('tempo 3-1-1 amb pausa de 2 s');
    if (effective > ceiling) {
      strategies.push('oneAndHalf');
      effective = Math.round(effective * ONE_AND_HALF_FACTOR);
      bits.push('repeticions 1½');
    }
    if (effective > ceiling) {
      strategies.push('restPause');
      bits.push('última sèrie en rest-pause');
      effective = ceiling;
    }
    if (effective > ceiling * 0.8) {
      strategies.push('density');
      restSec = Math.max(30, Math.round((p.restSec * 0.6) / 5) * 5);
      bits.push(`descans de ${restSec} s`);
    }
    repsHigh = Math.max(p.repsHigh, Math.min(effective, ceiling));
    repsLow = Math.max(p.repsLow, repsHigh - 4);
    bits.push(`${repsLow}–${repsHigh} reps`);
  }
  const text = `Amb ${formatKg(maxKg)} kg no arribes a ${p.repsLow}–${p.repsHigh} reps al RIR ${p.rir} (en faries ~${capacity}) → ${bits.join(', ')}.`;
  return { strategies, repsLow, repsHigh, tempo, restSec, text, capacity };
}

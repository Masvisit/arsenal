// Estratègies quan el material (o el pes corporal) es queda curt (secció 8.3). JS pur.
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
const REP_CEILING = { muscle: 25, endurance: 30, fatloss: 25, strength: 8, power: 6, agentRural: 20 };

// Cada tècnica redueix les reps que pots fer amb la mateixa càrrega (aproximació)
const TEMPO_FACTOR = 0.6;
const ONE_AND_HALF_FACTOR = 0.65;

/**
 * Calcula si cal fer més dur l'exercici i com.
 * Entrada: o bé { oneRM, maxKg } (càrrega externa), o bé { capacity } (reps màximes amb pes corporal).
 * @param p prescripció { repsLow, repsHigh, rir, restSec }
 * @returns null si no cal; si no { strategies, repsLow, repsHigh, tempo, restSec, text, capacity }
 */
export function adaptForLoad({ oneRM, maxKg, capacity: capIn, p, goal = 'muscle', unilateral = false, limb = 'leg' }) {
  if (!p || p.seconds || p.emom) return null;
  let maxReps;
  let subject;
  if (capIn != null) {
    maxReps = capIn;
    subject = 'Amb el teu pes corporal';
  } else {
    if (!oneRM || !maxKg) return null;
    maxReps = Math.floor(repsToFailure(oneRM, maxKg));
    subject = `Amb ${formatKg(maxKg)} kg`;
  }
  const capacity = maxReps - (p.rir ?? 2);
  if (capacity <= p.repsHigh) return null;

  const strategies = [];
  const ceiling = REP_CEILING[goal] ?? 20;
  let repsLow = p.repsLow;
  let repsHigh = p.repsHigh;
  let tempo = null;
  let restSec = p.restSec;
  let effective = capacity;
  const bits = [];

  if (unilateral) { strategies.push('unilateral'); bits.push(limb === 'arm' ? 'treballem a un braç' : 'treballem a una cama'); }

  if (goal === 'strength' || goal === 'power') {
    strategies.push('strengthLimit', 'tempo');
    tempo = '3-1-1';
    effective = Math.round(effective * TEMPO_FACTOR);
    repsLow = Math.min(Math.max(p.repsLow, 5), 8);
    repsHigh = Math.max(repsLow + 2, Math.min(effective, 10));
    bits.push(`tempo 3-1-1 amb pausa de 2 s i ${repsLow}–${repsHigh} reps`);
    const text = `${subject} no arribes a la intensitat de força (en faries ~${capacity} reps al RIR ${p.rir}) → ${bits.join(', ')}.`;
    return { strategies, repsLow, repsHigh, tempo, restSec, text, capacity };
  }

  if (effective <= ceiling) {
    strategies.push('moreReps');
    repsHigh = effective;
    repsLow = Math.max(p.repsLow, effective - 4);
    bits.push(`pugem el rang a ${repsLow}–${repsHigh} reps`);
  } else {
    // Amb tècniques d'intensitat el rang no passa de 15 reps: si encara sobra, rest-pause
    const techCeiling = Math.min(ceiling, 15);
    tempo = '3-1-1';
    strategies.push('tempo');
    effective = Math.round(effective * TEMPO_FACTOR);
    bits.push('tempo 3-1-1 amb pausa de 2 s');
    if (effective > techCeiling) {
      strategies.push('oneAndHalf');
      effective = Math.round(effective * ONE_AND_HALF_FACTOR);
      bits.push('repeticions 1½');
    }
    if (effective > techCeiling) {
      strategies.push('restPause');
      bits.push('última ronda en rest-pause');
      effective = techCeiling;
    }
    repsHigh = Math.max(p.repsHigh, Math.min(effective, techCeiling));
    repsLow = Math.max(p.repsLow, repsHigh - 4);
    bits.push(`${repsLow}–${repsHigh} reps`);
  }
  const text = `${subject} no arribes a ${p.repsLow}–${p.repsHigh} reps al RIR ${p.rir} (en faries ~${capacity}) → ${bits.join(', ')}.`;
  return { strategies, repsLow, repsHigh, tempo, restSec, text, capacity };
}

// Mapa de fatiga d'un entrenament (secció 9). JS pur.
import { TARGET_TO_SLUGS } from './muscles.js';

export const FATIGUE_COLORS = ['#fde047', '#fdba74', '#fb923c', '#f87171', '#ef4444'];

/**
 * Puntuació per target: Σ sèries × 1 si és principal + Σ sèries × 0,5 si és secundari.
 * @param items [{ sets: number, primary: [target], secondary: [target] }]
 */
export function fatigueScores(items) {
  const scores = {};
  for (const it of items) {
    for (const t of it.primary || []) scores[t] = (scores[t] || 0) + it.sets;
    for (const t of it.secondary || []) scores[t] = (scores[t] || 0) + it.sets * 0.5;
  }
  return scores;
}

/** 5 nivells (1 = poc, 5 = molt) relatius al màxim de l'entrenament. */
export function fatigueLevels(scores) {
  const max = Math.max(0, ...Object.values(scores));
  const levels = {};
  if (max <= 0) return levels;
  for (const [t, s] of Object.entries(scores)) {
    if (s <= 0) continue;
    levels[t] = Math.max(1, Math.min(5, Math.ceil((s / max) * 5)));
  }
  return levels;
}

/** Dades per a react-body-highlighter: una entrada per slug amb frequency = nivell. */
export function levelsToBodyData(levels) {
  const bySlug = {};
  for (const [t, lvl] of Object.entries(levels)) {
    for (const slug of TARGET_TO_SLUGS[t] || []) bySlug[slug] = Math.max(bySlug[slug] || 0, lvl);
  }
  return Object.entries(bySlug).map(([slug, lvl]) => ({ name: slug, muscles: [slug], frequency: lvl }));
}

import { describe, it, expect } from 'vitest';
import {
  toggleSlug, applyGroup, selectionToSlugs, exerciseTargets, shoulderTarget, abdominalTarget,
  MUSCLE_GROUPS, TARGETS, TARGET_LABELS, DATASET_TO_SLUGS, workoutTitle,
} from './muscles.js';

describe('muscles', () => {
  it('cada target té etiqueta en català', () => {
    TARGETS.forEach((t) => expect(TARGET_LABELS[t]).toBeTruthy());
    expect(Object.keys(DATASET_TO_SLUGS)).toHaveLength(17);
  });

  it('tocar upper-back selecciona dorsals + esquena mitja; tornar-hi a tocar ho treu', () => {
    let sel = toggleSlug([], 'upper-back');
    expect(sel).toEqual(['lats', 'middle-back']);
    sel = toggleSlug(sel, 'upper-back');
    expect(sel).toEqual([]);
  });

  it('tocar deltoide posterior i oblics selecciona targets propis', () => {
    expect(toggleSlug([], 'back-deltoids')).toEqual(['rear-delts']);
    expect(toggleSlug([], 'obliques')).toEqual(['obliques']);
  });

  it('els soli i els bessons són el mateix target', () => {
    const sel = toggleSlug([], 'left-soleus');
    expect(sel).toEqual(['calves']);
    expect(selectionToSlugs(sel)).toEqual(['calves', 'left-soleus', 'right-soleus']);
  });

  it('presets de Grups', () => {
    expect(MUSCLE_GROUPS.map((g) => g.name)).toContain('Proves Agent Rural');
    expect(applyGroup('arms')).toEqual(['biceps', 'triceps']);
    expect(applyGroup('core')).toEqual(['lower-back', 'abs', 'obliques']);
  });

  it('deltoides per paraules clau', () => {
    expect(shoulderTarget('Face Pull')).toBe('rear-delts');
    expect(shoulderTarget('Reverse Flyes')).toBe('rear-delts');
    expect(shoulderTarget('Cable Rear Delt Fly')).toBe('rear-delts');
    expect(shoulderTarget('Side Lateral Raise')).toBe('side-delts');
    expect(shoulderTarget('Upright Barbell Row')).toBe('side-delts');
    expect(shoulderTarget('Dumbbell Shoulder Press')).toBe('front-delts');
    expect(shoulderTarget('Front Dumbbell Raise')).toBe('front-delts');
  });

  it('oblics per paraules clau', () => {
    expect(abdominalTarget('Russian Twist')).toBe('obliques');
    expect(abdominalTarget('Pallof Press')).toBe('obliques');
    expect(abdominalTarget('Standing Cable Wood Chop')).toBe('obliques');
    expect(abdominalTarget('Oblique Crunches')).toBe('obliques');
    expect(abdominalTarget('Crunches')).toBe('abs');
  });

  it('targets d\'un exercici del dataset', () => {
    const t = exerciseTargets({ name: 'Barbell Bench Press - Medium Grip', primaryMuscles: ['chest'], secondaryMuscles: ['shoulders', 'triceps'] });
    expect(t).toEqual({ primary: ['chest'], secondary: ['front-delts', 'triceps'] });
    const r = exerciseTargets({ name: 'Bent Over Barbell Row', primaryMuscles: ['middle back'], secondaryMuscles: ['biceps', 'lats', 'shoulders'] });
    expect(r.secondary).toContain('rear-delts');
  });

  it('títol automàtic', () => {
    expect(workoutTitle(['chest', 'front-delts', 'triceps'])).toBe('Pit, espatlles i tríceps');
    expect(workoutTitle(['quads'])).toBe('Cames');
  });
});

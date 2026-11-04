import { describe, it, expect } from 'vitest';
import templates from '../data/templates.json';
import { CATALOG } from './catalog.js';
import {
  createLocation, locationFromTemplate, locationCapabilities, resolveCap,
  toggleQuickTile, activeQuickTiles, selectAllQuickTiles, duplicateLocation, locationSummary,
} from './inventory.js';

describe('catalog', () => {
  it('ids únics i noms en català', () => {
    const ids = CATALOG.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    CATALOG.forEach((c) => expect(c.name).toBeTruthy());
  });
  it('les plantilles només fan servir elements del catàleg', () => {
    const ids = new Set(CATALOG.map((c) => c.id));
    templates.forEach((t) => t.items.forEach((i) => expect(ids.has(i.catalogId), `${t.id}: ${i.catalogId}`).toBe(true)));
    expect(templates.map((t) => t.id)).toEqual(['gym-full', 'home-basic', 'park', 'bodyweight', 'homemade']);
  });
});

describe('inventory', () => {
  it('capacitats directes i per substitució', () => {
    const loc = createLocation({ items: [{ catalogId: 'jug', attrs: { content: 'sand' } }, { catalogId: 'chair' }] });
    const caps = locationCapabilities(loc);
    expect(caps.get('jug').direct).toHaveLength(1);
    const goblet = { name: 'Goblet Squat', equipment: 'kettlebells' };
    const swing = { name: 'One-Arm Kettlebell Swings', equipment: 'kettlebells' };
    expect(resolveCap('kettlebell', caps, goblet)).toMatchObject({ ok: true, adapted: true });
    // mai swings amb una garrafa
    expect(resolveCap('kettlebell', caps, swing).ok).toBe(false);
    // cadira com a banc: només sense barra
    expect(resolveCap('bench_flat', caps, { name: 'Dumbbell Bench Press', equipment: 'dumbbell' }).ok).toBe(true);
    expect(resolveCap('bench_flat', caps, { name: 'Barbell Bench Press', equipment: 'barbell' }).ok).toBe(false);
  });

  it('garrafa d\'aigua no substitueix kettlebell', () => {
    const loc = createLocation({ items: [{ catalogId: 'jug', attrs: { content: 'water' } }] });
    const caps = locationCapabilities(loc);
    expect(resolveCap('kettlebell', caps, { name: 'Goblet Squat' }).ok).toBe(false);
    expect(resolveCap('dumbbells', caps, { name: 'Dumbbell Bicep Curl' }).ok).toBe(true);
  });

  it('atributs que activen capacitats (rack amb barra de dominades, banc declinat)', () => {
    const loc = createLocation({ items: [{ catalogId: 'rack', attrs: { pullupBar: true } }, { catalogId: 'bench_adjustable', attrs: { decline: false } }] });
    const caps = locationCapabilities(loc);
    expect(caps.has('pullup_bar')).toBe(true);
    expect(caps.has('bench_decline')).toBe(false);
  });

  it('metres per córrer → run_space', () => {
    expect(locationCapabilities(createLocation({ constraints: { runSpaceM: 20 } })).has('run_space')).toBe(true);
    expect(locationCapabilities(createLocation({ constraints: { runSpaceM: 5 } })).has('run_space')).toBe(false);
  });

  it('plantilla → lloc nou editable i duplicable', () => {
    const loc = locationFromTemplate(templates[0], { name: 'Gimnàs' });
    expect(loc.name).toBe('Gimnàs');
    expect(loc.items.length).toBe(templates[0].items.length);
    const copy = duplicateLocation(loc);
    expect(copy.id).not.toBe(loc.id);
    expect(copy.items[0].uid).not.toBe(loc.items[0].uid);
    expect(locationSummary(loc)).toMatch(/elements/);
  });

  it('caselles ràpides: activar i desactivar sense trencar les altres', () => {
    let loc = createLocation();
    loc = toggleQuickTile(loc, 'barbell');
    loc = toggleQuickTile(loc, 'dumbbells');
    expect(activeQuickTiles(loc)).toEqual(['barbell', 'dumbbells']);
    loc = toggleQuickTile(loc, 'barbell');
    expect(activeQuickTiles(loc)).toEqual(['dumbbells']);
    // el banc és de les dues caselles: es manté
    expect(loc.items.some((i) => i.catalogId === 'bench_adjustable')).toBe(true);
    expect(activeQuickTiles(selectAllQuickTiles(createLocation()))).toHaveLength(7);
  });
});

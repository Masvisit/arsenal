import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import custom from '../data/custom-exercises.json';
import templates from '../data/templates.json';
import { getRequirements, feasibility, violatesConstraints, limitationConflicts, movementPattern } from './requirements.js';
import { createLocation, locationCapabilities, locationFromTemplate } from './inventory.js';
import { CATALOG } from './catalog.js';
import { audit } from '../../scripts/audit-requirements.mjs';

const exercises = JSON.parse(readFileSync(new URL('../../public/data/exercises.json', import.meta.url), 'utf8'));
const byName = (n) => exercises.find((e) => e.name === n);
const can = (ex, loc) => feasibility(ex, locationCapabilities(loc), loc.constraints);

describe('requirements · regles base', () => {
  it('press de banca amb barra → barra + discs + banc + rack', () => {
    expect(getRequirements(byName('Barbell Bench Press - Medium Grip')).requires).toEqual(['barbell', 'plates', 'bench_flat', 'rack']);
  });
  it('inclinat i declinat demanen el banc corresponent', () => {
    expect(getRequirements(byName('Incline Dumbbell Press')).requires).toContain('bench_incline');
    expect(getRequirements(byName('Decline Barbell Bench Press')).requires).toContain('bench_decline');
  });
  it('pes corporal amb paraules clau', () => {
    expect(getRequirements(byName('Pullups')).requires).toEqual(['pullup_bar']);
    expect(getRequirements(byName('Inverted Row')).requires).toEqual(['low_bar']);
    expect(getRequirements(byName('Handstand Push-Ups')).requires).toEqual(['wall']);
    expect(getRequirements(byName('Pushups')).requires).toEqual([]);
  });
  it('politja alta / baixa', () => {
    expect(getRequirements(byName('Triceps Pushdown')).requires[0]).toBe('cable_high');
    expect(getRequirements(byName('Seated Cable Rows')).requires[0]).toBe('cable_low');
  });
  it('màquines per paraules clau', () => {
    expect(getRequirements(byName('Leg Press')).requires).toEqual(['machine:leg_press']);
    expect(getRequirements(byName('Leg Extensions')).requires).toEqual(['machine:leg_extension']);
    expect(getRequirements(byName('Butterfly')).requires).toEqual(['machine:pec_deck']);
  });
  it('totes les capacitats que demanen els exercicis existeixen al catàleg (o són run_space)', () => {
    const provided = new Set(['run_space']);
    CATALOG.forEach((c) => {
      c.provides.forEach((p) => provided.add(p));
      (c.subs || []).forEach((s) => provided.add(s.cap));
      if (c.extraProvides) c.extraProvides({ decline: true, pullupBar: true, doorAnchor: true, high: true, low: true }).forEach((p) => provided.add(p));
    });
    const missing = new Set();
    for (const e of [...exercises, ...custom]) {
      for (const r of getRequirements(e).requires) (Array.isArray(r) ? r : [r]).forEach((c) => { if (!provided.has(c)) missing.add(c); });
    }
    // capacitats sense element al catàleg (strongman/powerlifting): s'accepten
    [...missing].forEach((c) => expect(['dip_belt', 'stones', 'ssb']).toContain(c));
  });
  it('patrons de moviment', () => {
    expect(movementPattern(byName('Incline Dumbbell Press'))).toBe('horizontal_push');
    expect(movementPattern(byName('Dumbbell Shoulder Press'))).toBe('vertical_push');
    expect(movementPattern(byName('Romanian Deadlift'))).toBe('hinge');
  });
});

describe('requirements · criteri 7 (auditoria)', () => {
  it('≥ 90 % dels strength + plyometrics mapejats i cap sense motiu', () => {
    const r = audit();
    expect(r.pct).toBeGreaterThanOrEqual(0.9);
    expect(r.unmapped).toHaveLength(0);
    expect(r.customCount).toBeGreaterThanOrEqual(35);
  });
});

describe('requirements · exercicis propis', () => {
  it('ids únics, nom en català i requisits declarats', () => {
    const ids = custom.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    custom.forEach((c) => {
      expect(c.custom).toBe(true);
      expect(Array.isArray(c.requires)).toBe(true);
      expect(c.instructions.length).toBeGreaterThan(0);
      expect(getRequirements(c).mapped).toBe(true);
    });
  });
});

describe('requirements · realitzable en un lloc', () => {
  it('gimnàs amb barra + discs + banc + rack → press de banca sí; sense rack → no', () => {
    const gym = createLocation({ items: [{ catalogId: 'barbell_olympic' }, { catalogId: 'plates' }, { catalogId: 'bench_flat' }, { catalogId: 'rack' }] });
    expect(can(byName('Barbell Bench Press - Medium Grip'), gym).ok).toBe(true);
    const noRack = createLocation({ items: [{ catalogId: 'barbell_olympic' }, { catalogId: 'plates' }, { catalogId: 'bench_flat' }] });
    const r = can(byName('Barbell Bench Press - Medium Grip'), noRack);
    expect(r.ok).toBe(false);
    expect(r.missing).toContain('rack');
  });

  it('substitució → Adaptat amb motiu', () => {
    const home = createLocation({ items: [{ catalogId: 'jug', attrs: { content: 'sand' } }] });
    const r = can(byName('Goblet Squat'), home);
    expect(r).toMatchObject({ ok: true, adapted: true });
    expect(r.notes[0]).toMatch(/Garrafa/);
    expect(r.loadItem.catalogId).toBe('jug');
  });

  it('criteri 3: amb "Sense salts" cap pliometria ni salt és realitzable', () => {
    const t = templates.find((x) => x.id === 'gym-full');
    const loc = locationFromTemplate(t, { constraints: { noJumps: true } });
    const caps = locationCapabilities(loc);
    const ok = [...exercises, ...custom].filter((e) => feasibility(e, caps, loc.constraints).ok);
    expect(ok.length).toBeGreaterThan(300);
    ok.forEach((e) => {
      expect(e.category).not.toBe('plyometrics');
      expect(getRequirements(e).jump).toBe(false);
    });
  });

  it('sostre baix exclou el press per sobre del cap amb barra; terra delicat exclou els cops', () => {
    expect(violatesConstraints(byName('Standing Military Press'), { lowCeiling: true })).toEqual(['Sostre baix']);
    expect(violatesConstraints(byName('Dumbbell Shoulder Press'), { lowCeiling: true })).toEqual([]);
    expect(violatesConstraints(byName('Overhead Slam'), { fragileFloor: true })).toContain('Terra delicat');
  });

  it('limitacions', () => {
    expect(limitationConflicts(byName('Barbell Deadlift'), ['lowerBack'])).toEqual(['lowerBack']);
    expect(limitationConflicts(byName('Leg Extensions'), ['knee'])).toEqual(['knee']);
    expect(limitationConflicts(byName('Seated Cable Rows'), ['knee'])).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { barbellOptions, plateCombos, nearestAchievable, formatKg, implementLoadOptions, itemLoadOptions, adjustableDumbbellOptions } from './loads.js';
import { createLocation } from './inventory.js';

const myGymPlates = [5, 10, 15, 20, 25].map((kg) => ({ kg, qty: 2 }));

describe('loads · barra', () => {
  it('criteri 1: barra 20 + un parell de 5/10/15/20/25 → salts de 10 kg', () => {
    const opts = barbellOptions(20, myGymPlates);
    const kgs = opts.map((o) => o.kg);
    expect(kgs[0]).toBe(20);
    expect(kgs.at(-1)).toBe(170);
    // tots els salts són de 10 kg i no hi ha cap valor intermedi
    for (let i = 1; i < kgs.length; i++) expect(kgs[i] - kgs[i - 1]).toBe(10);
    expect(kgs).not.toContain(55);
    expect(kgs).not.toContain(37.5);
  });

  it('test obligatori: discs només de 5 kg en amunt → mai 17,5 kg per costat', () => {
    const opts = barbellOptions(20, [{ kg: 5, qty: 4 }, { kg: 10, qty: 4 }, { kg: 20, qty: 2 }]);
    opts.forEach((o) => expect((o.kg - 20) % 10).toBe(0));
    opts.forEach((o) => o.perSideKg.forEach((p) => expect(p).toBeGreaterThanOrEqual(5)));
  });

  it('mostra el muntatge amb el mínim de discs', () => {
    const o = barbellOptions(20, myGymPlates).find((x) => x.kg === 50);
    expect(o.setup).toBe('Barra 20 + 2×15 = 50 kg');
    const o2 = barbellOptions(20, [{ kg: 10, qty: 2 }, { kg: 5, qty: 2 }]).find((x) => x.kg === 50);
    expect(o2.setup).toBe('Barra 20 + 2×10 + 2×5 = 50 kg');
  });

  it('els discs senars no fan parell', () => {
    const combos = plateCombos([{ kg: 10, qty: 3 }]);
    expect([...combos.keys()].sort((a, b) => a - b)).toEqual([0, 1000]);
  });
});

describe('loads · nearestAchievable', () => {
  const opts = barbellOptions(20, myGymPlates);
  it('arrodoneix cap avall', () => {
    expect(nearestAchievable(57, opts).kg).toBe(50);
  });
  it('arrodoneix cap amunt si la diferència és ≤ 2,5 %', () => {
    expect(nearestAchievable(59, opts).kg).toBe(60); // +1,7 %
    expect(nearestAchievable(58, opts).kg).toBe(50); // +3,4 % → avall
  });
  it('retorna el muntatge i la diferència', () => {
    const r = nearestAchievable(57, opts);
    expect(r.setup).toContain('= 50 kg');
    expect(r.diff).toBe(-7);
  });
  it('si no hi ha res per sota, agafa el mínim', () => {
    expect(nearestAchievable(10, opts).kg).toBe(20);
  });
  it('sense opcions → null', () => {
    expect(nearestAchievable(10, [])).toBeNull();
  });
});

describe('loads · altres implements', () => {
  it('format català', () => {
    expect(formatKg(17.5)).toBe('17,5');
    expect(formatKg(20)).toBe('20');
  });

  it('mancuernes ajustables: en parell cada maneta rep la meitat dels discs', () => {
    const plates = [{ kg: 5, qty: 4 }];
    const single = adjustableDumbbellOptions(2, plates, { pair: false }).map((o) => o.kg);
    const pair = adjustableDumbbellOptions(2, plates, { pair: true }).map((o) => o.kg);
    expect(single).toEqual([2, 12, 22]);
    expect(pair).toEqual([2, 12]);
  });

  it('garrafa de 8 L de sorra arriba a 12 kg i ho explica', () => {
    const loc = createLocation({ items: [{ catalogId: 'jug', attrs: { volumeL: 8, qty: 2, content: 'sand' } }] });
    const opts = itemLoadOptions(loc.items[0], loc, { pair: true });
    expect(opts.at(-1).kg).toBe(12);
    expect(opts.at(-1).setup).toBe('Garrafa 8 L de sorra ≈ 12 kg (×2)');
    expect(opts.find((o) => o.kg === 7.5).setup).toContain('~5 L de sorra');
  });

  it('implementLoadOptions combina els discs del lloc amb la barra', () => {
    const loc = createLocation({
      items: [
        { catalogId: 'barbell_olympic' },
        { catalogId: 'plates', attrs: { plates: myGymPlates } },
      ],
    });
    const opts = implementLoadOptions(loc, 'barbell');
    expect(opts.map((o) => o.kg).slice(0, 4)).toEqual([20, 30, 40, 50]);
  });

  it('màquines de placa: de l\'increment al màxim', () => {
    const loc = createLocation({ items: [{ catalogId: 'leg_extension', attrs: { incrementKg: 5, maxKg: 20 } }] });
    expect(implementLoadOptions(loc, 'machine:leg_extension').map((o) => o.kg)).toEqual([5, 10, 15, 20]);
  });
});

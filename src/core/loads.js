// Càrregues que es poden muntar amb el material d'un lloc (secció 5.4). JS pur.
import { CATALOG_BY_ID, itemAttrs } from './catalog.js';

const C = 100; // treballem en centèsimes de kg per evitar errors de coma flotant
const toC = (kg) => Math.round(kg * C);
const fromC = (c) => c / C;

/** Format català: 17.5 → "17,5". */
export function formatKg(kg) {
  const r = Math.round(kg * 100) / 100;
  return String(r).replace('.', ',');
}

export const DENSITY = { water: 1, sand: 1.5 };

/**
 * Totes les combinacions de discs per costat a partir de parells.
 * Retorna Map(centèsimes per costat → llista de discs per costat, ordenats de gran a petit),
 * prioritzant el mínim nombre de discs.
 */
export function plateCombos(plates = [], { pairsDivisor = 2 } = {}) {
  const types = plates
    .filter((p) => p && p.kg > 0 && p.qty > 0)
    .map((p) => ({ c: toC(p.kg), n: Math.floor(p.qty / pairsDivisor) }))
    .filter((p) => p.n > 0)
    .sort((a, b) => b.c - a.c);
  let states = new Map([[0, []]]);
  for (const { c, n } of types) {
    const next = new Map(states);
    for (const [sum, list] of states) {
      for (let k = 1; k <= n; k++) {
        const s = sum + c * k;
        const l = [...list, ...Array(k).fill(c)];
        const prev = next.get(s);
        if (!prev || l.length < prev.length) next.set(s, l);
      }
    }
    states = next;
  }
  return states;
}

function sideText(listC) {
  // [1000, 500] → "2×10 + 2×5"
  return listC.map((c) => `2×${formatKg(fromC(c))}`).join(' + ');
}

/** Càrregues de barra: pesBarra + 2 × (subconjunt de parells de discs). */
export function barbellOptions(barKg, plates, label = 'Barra') {
  const out = [];
  for (const [sideC, list] of plateCombos(plates)) {
    const totalC = toC(barKg) + 2 * sideC;
    const kg = fromC(totalC);
    const setup = list.length
      ? `${label} ${formatKg(barKg)} + ${sideText(list)} = ${formatKg(kg)} kg`
      : `${label} ${formatKg(barKg)} kg`;
    out.push({ kg, setup, perSideKg: list.map(fromC) });
  }
  return sortUnique(out);
}

/** Màquines carregades amb discs sense barra (palanca). */
export function plateLoadedOptions(plates, label) {
  const out = [];
  for (const [sideC, list] of plateCombos(plates)) {
    if (sideC === 0) continue;
    const kg = fromC(2 * sideC);
    out.push({ kg, setup: `${label}: ${sideText(list)} = ${formatKg(kg)} kg`, perSideKg: list.map(fromC) });
  }
  return sortUnique(out);
}

/** Mancuernes ajustables: si es vol parell, cada maneta rep la meitat dels discs. */
export function adjustableDumbbellOptions(handleKg, plates, { pair = false, handles = 2 } = {}) {
  if (pair && handles < 2) return [];
  const combos = plateCombos(plates, { pairsDivisor: pair ? 4 : 2 });
  const out = [];
  for (const [sideC, list] of combos) {
    const kg = fromC(toC(handleKg) + 2 * sideC);
    const setup = list.length
      ? `Maneta ${formatKg(handleKg)} + ${sideText(list)} = ${formatKg(kg)} kg${pair ? ' (cada mancuerna)' : ''}`
      : `Maneta ${formatKg(handleKg)} kg`;
    out.push({ kg, setup });
  }
  return sortUnique(out);
}

export function rangeOptions(minKg, maxKg, stepKg, fmt) {
  const out = [];
  if (!(stepKg > 0) || maxKg < minKg) return out;
  for (let c = toC(minKg); c <= toC(maxKg) + 1; c += toC(stepKg)) {
    const kg = fromC(c);
    out.push({ kg, setup: fmt(kg) });
  }
  return out;
}

export function sortUnique(options) {
  const seen = new Map();
  for (const o of options) {
    const k = toC(o.kg);
    const prev = seen.get(k);
    // en cas d'empat ens quedem el muntatge més curt
    if (!prev || o.setup.length < prev.setup.length) seen.set(k, o);
  }
  return [...seen.values()].sort((a, b) => a.kg - b.kg);
}

const countOf = (weights, kg) => weights.filter((w) => w === kg).length;

/**
 * Opcions de càrrega que aporta un element concret.
 * @param item element d'inventari { catalogId, attrs }
 * @param location lloc complet (per trobar discs compatibles)
 * @param opts { pair: necessita dues unitats iguals (p. ex. press amb dues mancuernes) }
 */
export function itemLoadOptions(item, location, { pair = false } = {}) {
  const cat = CATALOG_BY_ID[item.catalogId];
  if (!cat) return [];
  const a = itemAttrs(item);
  const platesFor = (diameter) => (location?.items || [])
    .filter((i) => i.catalogId === 'plates')
    .filter((i) => !diameter || (itemAttrs(i).diameter || 'olympic') === diameter)
    .flatMap((i) => itemAttrs(i).plates || []);

  switch (item.catalogId) {
    case 'barbell_olympic':
    case 'barbell_standard':
      return barbellOptions(a.weightKg, platesFor(a.diameter || (item.catalogId === 'barbell_olympic' ? 'olympic' : 'standard')), 'Barra');
    case 'barbell_ez':
      return barbellOptions(a.weightKg, platesFor(a.diameter || 'olympic'), 'Barra EZ');
    case 'trap_bar':
      return barbellOptions(a.weightKg, platesFor('olympic'), 'Barra hexagonal');
    case 'dumbbells_fixed': {
      const ws = [...new Set(a.weights || [])].sort((x, y) => x - y);
      return ws
        .filter((w) => !pair || a.pairs !== false || countOf(a.weights, w) >= 2)
        .map((w) => ({ kg: w, setup: pair ? `Mancuernes ${formatKg(w)} kg` : `Mancuerna ${formatKg(w)} kg` }));
    }
    case 'dumbbells_adjustable':
      return adjustableDumbbellOptions(a.handleKg, a.plates, { pair, handles: a.handles ?? 2 });
    case 'dumbbells_selector':
      return rangeOptions(a.minKg, a.maxKg, a.stepKg, (kg) => `Mancuerna de selector a ${formatKg(kg)} kg`);
    case 'kettlebells': {
      const ws = [...new Set(a.weights || [])].sort((x, y) => x - y);
      return ws
        .filter((w) => !pair || countOf(a.weights, w) >= 2)
        .map((w) => ({ kg: w, setup: pair ? `Dues kettlebells de ${formatKg(w)} kg` : `Kettlebell ${formatKg(w)} kg` }));
    }
    case 'jug':
    case 'bottles':
    case 'buckets': {
      if (pair && (a.qty ?? 1) < 2) return [];
      const density = DENSITY[a.content] ?? 1;
      const maxKg = a.volumeL * density;
      const noun = { jug: 'Garrafa', bottles: 'Ampolla', buckets: 'Galleda' }[item.catalogId];
      const what = a.content === 'sand' ? 'sorra' : 'aigua';
      const step = maxKg > 6 ? 0.5 : 0.25;
      return rangeOptions(step, maxKg, step, (kg) => {
        const liters = kg / density;
        const full = Math.abs(kg - maxKg) < 0.01;
        const base = full
          ? `${noun} ${formatKg(a.volumeL)} L de ${what} ≈ ${formatKg(kg)} kg`
          : `${noun} de ${formatKg(a.volumeL)} L omplerta fins a ~${formatKg(Math.round(liters * 10) / 10)} L de ${what} ≈ ${formatKg(kg)} kg`;
        return pair ? `${base} (×2)` : base;
      });
    }
    case 'backpack':
      return rangeOptions(1, a.maxKg, 1, (kg) => `Motxilla amb ~${formatKg(kg)} kg`);
    case 'weight_vest':
      return a.adjustable
        ? rangeOptions(1, a.kg, 1, (kg) => `Armilla a ${formatKg(kg)} kg`)
        : [{ kg: a.kg, setup: `Armilla de ${formatKg(a.kg)} kg` }];
    case 'sandbag':
    case 'homemade_sandbag':
    case 'medicine_ball': {
      const noun = { sandbag: 'Sandbag', homemade_sandbag: 'Sac casolà', medicine_ball: 'Pilota medicinal' }[item.catalogId];
      return [...new Set(a.weights || [])].sort((x, y) => x - y).map((w) => ({ kg: w, setup: `${noun} ${formatKg(w)} kg` }));
    }
    case 'smith': {
      const plates = platesFor('olympic');
      if (plates.length) return barbellOptions(a.barKg ?? 15, plates, 'Smith: barra');
      return rangeOptions(a.incrementKg, a.maxKg, a.incrementKg, (kg) => `Smith a ${formatKg(kg)} kg`);
    }
    case 'lever_machines': {
      const plates = platesFor('olympic');
      if (plates.length) return plateLoadedOptions(plates, 'Màquina');
      return rangeOptions(a.incrementKg, a.maxKg, a.incrementKg, (kg) => `Màquina a ${formatKg(kg)} kg`);
    }
    default:
      if (cat.load?.kind === 'stack') {
        if (!(a.maxKg > 0)) return [];
        return rangeOptions(a.incrementKg, a.maxKg, a.incrementKg, (kg) => `${cat.name}: placa de ${formatKg(kg)} kg`);
      }
      return [];
  }
}

/** Totes les opcions d'un tipus d'implement (p. ex. 'barbell', 'dumbbell', 'machine:leg_press') en un lloc. */
export function implementLoadOptions(location, implement, opts = {}) {
  const items = (location?.items || []).filter((i) => CATALOG_BY_ID[i.catalogId]?.load?.implement === implement);
  return sortUnique(items.flatMap((i) => itemLoadOptions(i, location, opts)));
}

/**
 * Càrrega muntable més propera a l'objectiu.
 * Arrodoneix cap avall, excepte si la diferència cap amunt és ≤ 2,5 %.
 * @returns {{kg:number, setup:string, diff:number} | null}
 */
export function nearestAchievable(targetKg, options) {
  if (!options?.length) return null;
  const sorted = [...options].sort((a, b) => a.kg - b.kg);
  let down = null;
  let up = null;
  for (const o of sorted) {
    if (o.kg <= targetKg + 1e-9) down = o;
    else { up = o; break; }
  }
  let pick;
  if (up && (up.kg - targetKg) / targetKg <= 0.025) pick = up;
  else pick = down || up;
  return { kg: pick.kg, setup: pick.setup, diff: Math.round((pick.kg - targetKg) * 100) / 100 };
}

/** Opcions dins d'un rang (per mostrar xips de càrregues probables). */
export function optionsInRange(options, minKg, maxKg, max = 5) {
  const inside = options.filter((o) => o.kg >= minKg - 1e-9 && o.kg <= maxKg + 1e-9);
  if (inside.length <= max) return inside;
  // repartim-les uniformement
  const step = (inside.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => inside[Math.round(i * step)]);
}

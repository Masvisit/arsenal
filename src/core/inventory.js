// Llocs, plantilles i capacitats que ofereix un lloc (secció 5.1). JS pur.
import { CATALOG_BY_ID, itemAttrs, itemProvides, QUICK_TILES } from './catalog.js';

export const LOCATION_SCHEMA_VERSION = 1;

export const LOCATION_KINDS = [
  { id: 'gym', name: 'Gimnàs' },
  { id: 'home', name: 'Casa' },
  { id: 'garden', name: 'Jardí' },
  { id: 'park', name: 'Parc' },
  { id: 'outdoor', name: 'Exterior' },
];

export const DEFAULT_CONSTRAINTS = { noJumps: false, lowCeiling: false, fragileFloor: false, runSpaceM: 0 };

let counter = 0;
export function newId(prefix = 'id') {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${counter}`;
}

export function makeItem(catalogId, attrs = {}) {
  return { uid: newId('it'), catalogId, attrs: { ...attrs } };
}

export function createLocation({ name, kind = 'home', items = [], constraints = {} } = {}) {
  return {
    schemaVersion: LOCATION_SCHEMA_VERSION,
    id: newId('loc'),
    name: name || 'Nou lloc',
    kind,
    constraints: { ...DEFAULT_CONSTRAINTS, ...constraints },
    items: items.map((i) => (i.uid ? i : makeItem(i.catalogId, i.attrs))),
  };
}

/** Crea un lloc nou a partir d'una plantilla de templates.json. */
export function locationFromTemplate(template, overrides = {}) {
  return createLocation({
    name: overrides.name || template.name,
    kind: overrides.kind || template.kind,
    constraints: { ...template.constraints, ...(overrides.constraints || {}) },
    items: (template.items || []).map((i) => makeItem(i.catalogId, i.attrs)),
  });
}

export function duplicateLocation(location, name) {
  return {
    ...structuredCloneSafe(location),
    id: newId('loc'),
    name: name || `${location.name} (còpia)`,
    items: location.items.map((i) => makeItem(i.catalogId, i.attrs)),
  };
}

function structuredCloneSafe(x) {
  return JSON.parse(JSON.stringify(x));
}

// ---------- Regles de substitució (què es pot fer amb què) ----------
const BALLISTIC = /swing|snatch|clean|jerk|throw|toss|slam|push press|thruster|high pull|jump|plyo|bound|hop|figure 8|pass between|pirate/i;

export const SUB_RULES = {
  controlled: (ex) => !BALLISTIC.test(ex.name),
  // Garrafes/ampolles com a mancuernes: només moviments controlats i agafables
  jugDumbbell: (ex) => !BALLISTIC.test(ex.name) && !/overhead|fly|flye|pullover|around the world|kickback|pronation|supination|wrist|hammer|zottman|spider|preacher|incline.*curl/i.test(ex.name),
  // Garrafa de sorra com a kettlebell: goblet, rem, carries, pes mort
  jugKettlebell: (ex) => !BALLISTIC.test(ex.name) && !/overhead|windmill|get-up|press/i.test(ex.name) && /goblet|row|carry|farmer|walk|deadlift|squat/i.test(ex.name),
  notBarbell: (ex) => !['barbell', 'e-z curl bar'].includes(ex.equipment) && !/barbell|smith/i.test(ex.name),
  benchDip: (ex) => /bench dip|chair dip|triceps|tricep|dips? - triceps/i.test(ex.name),
  dip: () => true,
  carry: (ex) => /carry|farmer|walk|load|yoke/i.test(ex.name),
};

/**
 * Capacitats d'un lloc.
 * @returns Map(cap → { direct: [item], subs: [{ item, note, rule, safety }] })
 */
export function locationCapabilities(location) {
  const caps = new Map();
  const ensure = (cap) => {
    if (!caps.has(cap)) caps.set(cap, { direct: [], subs: [] });
    return caps.get(cap);
  };
  for (const item of location?.items || []) {
    const cat = CATALOG_BY_ID[item.catalogId];
    if (!cat) continue;
    const a = itemAttrs(item);
    for (const cap of itemProvides(item)) ensure(cap).direct.push(item);
    for (const s of cat.subs || []) {
      if (s.when && !s.when(a)) continue;
      // fons entre dues cadires: cal tenir-ne almenys dues; amb una sola només fons a la cadira
      ensure(s.cap).subs.push({ item, note: s.note, rule: s.rule, safety: s.safety || cat.safety });
    }
  }
  const c = { ...DEFAULT_CONSTRAINTS, ...(location?.constraints || {}) };
  if (c.runSpaceM >= 10) ensure('run_space').direct.push({ uid: 'constraint', catalogId: 'run_space' });
  return caps;
}

/**
 * Pot el lloc cobrir una capacitat per a un exercici concret?
 * @returns { ok, adapted, item?, note?, safety? }
 */
export function resolveCap(cap, caps, ex) {
  const entry = caps.get(cap);
  if (!entry) return { ok: false };
  if (entry.direct.length) return { ok: true, adapted: false, item: entry.direct[0], items: entry.direct };
  for (const s of entry.subs) {
    const rule = s.rule ? SUB_RULES[s.rule] : null;
    if (!rule || rule(ex)) return { ok: true, adapted: true, item: s.item, note: s.note, safety: s.safety };
  }
  return { ok: false };
}

/** Quines caselles de la vista ràpida estan actives en un lloc. */
export function activeQuickTiles(location) {
  const ids = new Set((location?.items || []).map((i) => i.catalogId));
  return QUICK_TILES.filter((t) => ids.has(t.items[0])).map((t) => t.id);
}

/** Activa/desactiva una casella ràpida. En treure-la, no treu elements que també són d'una altra casella activa. */
export function toggleQuickTile(location, tileId) {
  const tile = QUICK_TILES.find((t) => t.id === tileId);
  if (!tile) return location;
  const active = activeQuickTiles(location);
  const items = [...(location.items || [])];
  if (active.includes(tileId)) {
    const keep = new Set(QUICK_TILES.filter((t) => t.id !== tileId && active.includes(t.id)).flatMap((t) => t.items));
    return { ...location, items: items.filter((i) => !tile.items.includes(i.catalogId) || keep.has(i.catalogId)) };
  }
  const have = new Set(items.map((i) => i.catalogId));
  for (const id of tile.items) if (!have.has(id)) items.push(makeItem(id));
  return { ...location, items };
}

/** Activa totes les caselles ràpides ("Tot"). */
export function selectAllQuickTiles(location) {
  let loc = location;
  for (const t of QUICK_TILES) if (!activeQuickTiles(loc).includes(t.id)) loc = toggleQuickTile(loc, t.id);
  return loc;
}

/** Resum curt d'un lloc per a llistes ("12 elements · Sense salts"). */
export function locationSummary(location) {
  const n = location?.items?.length || 0;
  const c = { ...DEFAULT_CONSTRAINTS, ...(location?.constraints || {}) };
  const parts = [`${n} ${n === 1 ? 'element' : 'elements'}`];
  if (c.noJumps) parts.push('Sense salts');
  if (c.lowCeiling) parts.push('Sostre baix');
  if (c.fragileFloor) parts.push('Terra delicat');
  if (c.runSpaceM > 0) parts.push(`${c.runSpaceM} m per córrer`);
  return parts.join(' · ');
}

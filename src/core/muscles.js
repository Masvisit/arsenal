// Músculs: unitats de selecció ("targets"), mapping amb el dataset i amb el mapa corporal
// (slugs de react-body-highlighter). JS pur.

export const TARGETS = [
  'chest', 'front-delts', 'side-delts', 'rear-delts', 'biceps', 'triceps', 'forearms',
  'abs', 'obliques', 'lats', 'middle-back', 'traps', 'lower-back',
  'glutes', 'quads', 'hamstrings', 'calves', 'adductors', 'abductors', 'neck',
];

export const TARGET_LABELS = {
  chest: 'Pit',
  'front-delts': 'Deltoide anterior',
  'side-delts': 'Deltoide lateral',
  'rear-delts': 'Deltoide posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Avantbraços',
  abs: 'Abdominals',
  obliques: 'Oblics',
  lats: 'Dorsals',
  'middle-back': 'Esquena mitja',
  traps: 'Trapezi',
  'lower-back': 'Lumbars',
  glutes: 'Glutis',
  quads: 'Quàdriceps',
  hamstrings: 'Isquiotibials',
  calves: 'Bessons',
  adductors: 'Adductors',
  abductors: 'Abductors',
  neck: 'Coll',
};

// Nom curt per a títols ("Pit, espatlles i tríceps")
export const TARGET_SHORT = {
  ...TARGET_LABELS,
  'front-delts': 'espatlles', 'side-delts': 'espatlles', 'rear-delts': 'espatlles',
  lats: 'esquena', 'middle-back': 'esquena', traps: 'trapezi', 'lower-back': 'lumbars',
  abs: 'core', obliques: 'core',
  quads: 'cames', hamstrings: 'isquios', glutes: 'glutis', calves: 'bessons',
};

// Mida relativa (per triar el compost principal del "grup més gran")
export const TARGET_SIZE = {
  quads: 10, glutes: 10, hamstrings: 9, lats: 9, chest: 8, 'middle-back': 7, 'lower-back': 6,
  'front-delts': 5, 'side-delts': 4, 'rear-delts': 4, traps: 5, triceps: 4, biceps: 3,
  calves: 3, abs: 3, obliques: 2, adductors: 3, abductors: 2, forearms: 2, neck: 1,
};

export const TARGET_TO_DATASET = {
  chest: 'chest',
  'front-delts': 'shoulders',
  'side-delts': 'shoulders',
  'rear-delts': 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  abs: 'abdominals',
  obliques: 'abdominals',
  lats: 'lats',
  'middle-back': 'middle back',
  traps: 'traps',
  'lower-back': 'lower back',
  glutes: 'glutes',
  quads: 'quadriceps',
  hamstrings: 'hamstrings',
  calves: 'calves',
  adductors: 'adductors',
  abductors: 'abductors',
  neck: 'neck',
};

// Com es pinta cada target al mapa
export const TARGET_TO_SLUGS = {
  chest: ['chest'],
  'front-delts': ['front-deltoids'],
  'side-delts': ['front-deltoids', 'back-deltoids'],
  'rear-delts': ['back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abs: ['abs'],
  obliques: ['obliques'],
  lats: ['upper-back'],
  'middle-back': ['upper-back'],
  traps: ['trapezius'],
  'lower-back': ['lower-back'],
  glutes: ['gluteal'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  calves: ['calves', 'left-soleus', 'right-soleus'],
  adductors: ['adductor'],
  abductors: ['abductors'],
  neck: ['neck'],
};

// Què selecciona tocar cada zona del mapa
export const SLUG_TO_TARGETS = {
  chest: ['chest'],
  'front-deltoids': ['front-delts'],
  'back-deltoids': ['rear-delts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearm: ['forearms'],
  abs: ['abs'],
  obliques: ['obliques'],
  'upper-back': ['lats', 'middle-back'],
  trapezius: ['traps'],
  'lower-back': ['lower-back'],
  gluteal: ['glutes'],
  quadriceps: ['quads'],
  hamstring: ['hamstrings'],
  calves: ['calves'],
  'left-soleus': ['calves'],
  'right-soleus': ['calves'],
  adductor: ['adductors'],
  abductors: ['abductors'],
  neck: ['neck'],
};

// Dataset (17) → slugs del mapa (taula 4.3 de l'especificació)
export const DATASET_TO_SLUGS = {
  chest: ['chest'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abdominals: ['abs', 'obliques'],
  lats: ['upper-back'],
  'middle back': ['upper-back'],
  traps: ['trapezius'],
  'lower back': ['lower-back'],
  glutes: ['gluteal'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstring'],
  calves: ['calves', 'left-soleus', 'right-soleus'],
  adductors: ['adductor'],
  abductors: ['abductors'],
  neck: ['neck'],
};

export const MUSCLE_GROUPS = [
  { id: 'upper-push', name: 'Empenta tren superior', targets: ['side-delts', 'triceps', 'chest', 'front-delts'] },
  { id: 'upper-pull', name: 'Tracció tren superior', targets: ['biceps', 'middle-back', 'lats', 'rear-delts'] },
  { id: 'lower-push', name: 'Empenta tren inferior', targets: ['calves', 'glutes', 'quads'] },
  { id: 'lower-pull', name: 'Tracció tren inferior', targets: ['calves', 'glutes', 'hamstrings'] },
  { id: 'core', name: 'Core', targets: ['lower-back', 'abs', 'obliques'] },
  { id: 'arms', name: 'Braços', targets: ['biceps', 'triceps'] },
  { id: 'shoulders', name: 'Espatlles', targets: ['front-delts', 'rear-delts'] },
  { id: 'full-body', name: 'Cos sencer', targets: ['glutes', 'hamstrings', 'lats', 'quads', 'chest', 'front-delts', 'rear-delts'] },
  { id: 'agent-rural', name: 'Proves Agent Rural', targets: ['chest', 'triceps', 'front-delts', 'quads', 'glutes', 'calves', 'abs', 'obliques', 'lower-back'] },
];

const uniq = (arr) => [...new Set(arr)];

/** Toca una zona del mapa: si tots els seus targets ja hi són, els treu; si no, els afegeix. */
export function toggleSlug(selection, slug) {
  const targets = SLUG_TO_TARGETS[slug];
  if (!targets) return selection;
  const allIn = targets.every((t) => selection.includes(t));
  return allIn ? selection.filter((t) => !targets.includes(t)) : uniq([...selection, ...targets]);
}

/** Aplica un preset de Grups (substitueix la selecció). */
export function applyGroup(groupId) {
  const g = MUSCLE_GROUPS.find((x) => x.id === groupId);
  return g ? [...g.targets] : [];
}

/** Slugs a pintar per a una selecció de targets. */
export function selectionToSlugs(selection) {
  return uniq(selection.flatMap((t) => TARGET_TO_SLUGS[t] || []));
}

// --- Classificació d'exercicis per paraules clau del nom (secció 4.3) ---
const RE_REAR = /rear[\s-]?delt|rear lateral|face pull|reverse fl(y|ie)|back fl(y|ie)|pull apart|bent[\s-]over.*(lateral|raise|side)|external rotation|rear-delt|reverse machine fl|lying rear|bent over low-pulley|sled reverse/i;
const RE_SIDE = /lateral raise|side lateral|laterals|upright\b.*\brow|deltoid raise|scaption|lateral\b.*raise|cuban|shoulder raise|iron cross|around the world|seated side/i;
const RE_OBLIQUE = /oblique|side bend|side bridge|side jackknife|russian twist|wood ?chop|pallof|twist|windmill|cross[\s-]body crunch|judo|elbow to knee|heel touch|wipers|bicycl|plate twist|landmine 180|torso rotation|spell caster|side plank|cable lift/i;

export function shoulderTarget(name) {
  if (RE_REAR.test(name)) return 'rear-delts';
  if (RE_SIDE.test(name)) return 'side-delts';
  return 'front-delts';
}

export function abdominalTarget(name) {
  return RE_OBLIQUE.test(name) ? 'obliques' : 'abs';
}

function datasetToTargets(muscle, name, { secondary = false } = {}) {
  switch (muscle) {
    case 'shoulders': {
      if (secondary && /row|pull|chin|face/i.test(name) && !RE_SIDE.test(name)) return ['rear-delts'];
      return [shoulderTarget(name)];
    }
    case 'abdominals': return [abdominalTarget(name)];
    case 'chest': return ['chest'];
    case 'biceps': return ['biceps'];
    case 'triceps': return ['triceps'];
    case 'forearms': return ['forearms'];
    case 'lats': return ['lats'];
    case 'middle back': return ['middle-back'];
    case 'traps': return ['traps'];
    case 'lower back': return ['lower-back'];
    case 'glutes': return ['glutes'];
    case 'quadriceps': return ['quads'];
    case 'hamstrings': return ['hamstrings'];
    case 'calves': return ['calves'];
    case 'adductors': return ['adductors'];
    case 'abductors': return ['abductors'];
    case 'neck': return ['neck'];
    default: return [];
  }
}

/** Targets principals i secundaris d'un exercici (dataset o propi). */
export function exerciseTargets(ex) {
  if (ex._targets) return ex._targets;
  const name = ex.name || '';
  const primary = uniq((ex.primaryTargets || ex.primaryMuscles.flatMap((m) => datasetToTargets(m, name))));
  const secondary = uniq((ex.secondaryTargets || (ex.secondaryMuscles || []).flatMap((m) => datasetToTargets(m, name, { secondary: true }))))
    .filter((t) => !primary.includes(t));
  const res = { primary, secondary };
  Object.defineProperty(ex, '_targets', { value: res, enumerable: false, configurable: true });
  return res;
}

/** Títol automàtic segons els targets seleccionats ("Pit, espatlles i tríceps"). */
export function workoutTitle(targets) {
  const ordered = [...targets].sort((a, b) => TARGETS.indexOf(a) - TARGETS.indexOf(b));
  const words = uniq(ordered.map((t) => TARGET_SHORT[t] || t).map((w) => w.toLowerCase()));
  if (words.length === 0) return 'Entrenament';
  if (words.length > 5) return 'Entrenament de cos sencer';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (words.length === 1) return cap(words[0]);
  return cap(words.slice(0, -1).join(', ') + ' i ' + words[words.length - 1]);
}

// Què necessita cada exercici (secció 4.4). JS pur.
//
// getRequirements(ex) → {
//   requires: [cap | [capA, capB]]   (AND; un array intern és OR)
//   load: { cap, pair } | null       (capacitat que aporta la càrrega externa)
//   pattern, unilateral, jump, ballistic, overheadBarbell, floorDrop
//   mapped: true/false, excluded?: motiu
// }
import { exerciseTargets } from './muscles.js';
import { resolveCap } from './inventory.js';

const has = (re, s) => re.test(s);

// ---------- Exclusions explícites (material que no té sentit al catàleg) ----------
const EXCLUDED = [
  [/chains?\b/i, 'Necessita cadenes de powerlifting'],
  [/axle/i, 'Necessita una barra d\'eix gruixut'],
  [/^car (deadlift|drivers)/i, null], // "Car Drivers" és amb disc: es tracta a part
  [/circus bell/i, 'Necessita una campana de circ (strongman)'],
  [/conan/i, 'Necessita una roda de Conan (strongman)'],
  [/rickshaw/i, 'Necessita un carro de strongman'],
  [/yoke/i, 'Necessita un jou de strongman'],
  [/head harness/i, 'Necessita un arnès de coll'],
  [/rope climb|london bridges/i, 'Necessita una corda de grimpar'],
  [/heavy bag/i, 'Necessita un sac de boxa'],
  [/power stairs/i, 'Necessita implements de strongman'],
  [/^crucifix$/i, 'Necessita implements de strongman'],
  [/lunge sprint/i, 'Màquina específica poc habitual'],
  [/prone manual hamstring/i, 'Cal un company que faci la resistència'],
];

// ---------- Classificació manual per a equipment "other" / null i casos especials ----------
// nom exacte → requisits
const MANUAL = {
  'Ab Roller': ['ab_wheel'],
  'Atlas Stone Trainer': ['stones'],
  'Atlas Stones': ['stones'],
  'Backward Drag': ['sled'],
  'Balance Board': ['bosu'],
  'Band Assisted Pull-Up': ['pullup_bar', 'bands'],
  'Battling Ropes': ['battle_rope'],
  'Bear Crawl Sled Drags': ['sled'],
  'Bench Sprint': ['box_or_step'],
  'Bodyweight Mid Row': [['door', 'park', 'rack']],
  'Box Jump (Multiple Response)': ['plyo_box'],
  'Box Skip': ['plyo_box'],
  'Car Deadlift': null,
  'Car Drivers': ['plates'],
  'Depth Jump Leap': ['plyo_box'],
  'Dips - Chest Version': ['dip_station'],
  'Donkey Calf Raises': ['box_or_step'],
  'Drop Push': ['box_or_step'],
  "Farmer's Walk": ['dumbbells'],
  'Forward Drag with Press': ['sled'],
  'Front Box Jump': ['plyo_box'],
  'Front Cone Hops (or hurdle hops)': [],
  'Front Plate Raise': ['plates'],
  'Gironda Sternum Chins': ['pullup_bar'],
  'Hurdle Hops': ['hurdles'],
  'Hyperextensions (Back Extensions)': ['hyper_bench'],
  'Incline Push-Up Depth Jump': ['box_or_step'],
  'Inverted Row with Straps': ['rings_or_suspension'],
  'Keg Load': ['sandbag'],
  'Kipping Muscle Up': ['pullup_bar'],
  'Knee/Hip Raise On Parallel Bars': ['dip_station'],
  'Lateral Box Jump': ['plyo_box'],
  'Lateral Cone Hops': [],
  'Linear Depth Jump': ['plyo_box'],
  'Log Lift': ['stones'],
  'Lying Face Down Plate Neck Resistance': ['plates', 'bench_flat'],
  'Lying Face Up Plate Neck Resistance': ['plates', 'bench_flat'],
  'Mixed Grip Chin': ['pullup_bar'],
  'Muscle Up': ['pullup_bar'],
  'One Arm Chin-Up': ['pullup_bar'],
  'Otis-Up': ['plates', 'foot_anchor'],
  'Parallel Bar Dip': ['dip_station'],
  'Plate Pinch': ['plates'],
  'Plate Twist': ['plates'],
  'Platform Hamstring Slides': ['slider_surface'],
  'Prowler Sprint': ['sled'],
  'Quick Leap': ['plyo_box'],
  'Reverse Plate Curls': ['plates'],
  'Ring Dips': ['rings_or_suspension'],
  'Rocky Pull-Ups/Pulldowns': ['pullup_bar'],
  'Rope Jumping': ['jump_rope'],
  'Sandbag Load': ['sandbag'],
  'Seated Band Hamstring Curl': ['bands', 'band_anchor'],
  'Side Hop-Sprint': ['run_space'],
  'Side to Side Box Shuffle': ['box_or_step'],
  'Side To Side Chins': ['pullup_bar'],
  'Single Leg Push-off': ['box_or_step'],
  'Single-Cone Sprint Drill': ['run_space'],
  'Single-Leg High Box Squat': ['plyo_box'],
  'Single-Leg Hop Progression': [],
  'Single-Leg Lateral Hop': [],
  'Single-Leg Stride Jump': [],
  'Sled Drag - Harness': ['sled'],
  'Sled Overhead Backward Walk': ['sled'],
  'Sled Overhead Triceps Extension': ['sled'],
  'Sled Push': ['sled'],
  'Sled Reverse Flye': ['sled'],
  'Sled Row': ['sled'],
  'Sledgehammer Swings': ['sledgehammer', 'tire'],
  'Standing Olympic Plate Hand Squeeze': ['plates'],
  'Stride Jump Crossover': [],
  'Suspended Fallout': ['rings_or_suspension'],
  'Suspended Push-Up': ['rings_or_suspension'],
  'Suspended Reverse Crunch': ['rings_or_suspension'],
  'Suspended Row': ['rings_or_suspension'],
  'Suspended Split Squat': ['rings_or_suspension'],
  'Svend Press': ['plates'],
  'Tire Flip': ['tire'],
  'Trap Bar Deadlift': ['trap_bar'],
  'Weighted Bench Dip': ['bench_flat', 'plates'],
  'Weighted Pull Ups': ['pullup_bar', 'weight_vest'],
  'Weighted Sit-Ups - With Bands': ['bench_decline', 'bands'],
  'Weighted Squat': ['dip_belt', 'box_or_step'],
  'Wrist Roller': ['stick', 'plates'],
  // null
  'Bodyweight Walking Lunge': [],
  'Decline Push-Up': ['box_or_step'],
  'Floor Glute-Ham Raise': ['foot_anchor'],
  'Inverted Row': ['low_bar'],
  'Mountain Climbers': [],
  'Scapular Pull-Up': ['pullup_bar'],
  'Alternate Leg Diagonal Bound': ['run_space'],
  'Carioca Quick Step': ['run_space'],
  'Kneeling Arm Drill': [],
  'Linear 3-Part Start Technique': ['run_space'],
  'Linear Acceleration Wall Drill': ['wall'],
  'Moving Claw Series': ['run_space'],
  'Side Standing Long Jump': [],
  // casos especials d'altres categories
  'Close-Grip Push-Up off of a Dumbbell': ['dumbbells'],
  'Standing Towel Triceps Extension': ['towel'],
  'Natural Glute Ham Raise': ['foot_anchor'],
  'Hyperextensions With No Hyperextension Bench': ['bench_flat', 'foot_anchor'],
  'Crunch - Legs On Exercise Ball': ['fitball'],
  'Push-Ups With Feet Elevated': ['box_or_step'],
  'Wind Sprints': ['run_space'],
  'Fast Skipping': ['run_space'],
  'Lateral Bound': ['run_space'],
  'Bench Dips': ['bench_flat'],
  'Bench Jump': ['bench_flat'],
  'Bodyweight Flyes': ['ez_bar'],
  'Glute Ham Raise': ['hyper_bench'],
  'Reverse Hyperextension': ['machine:reverse_hyper'],
  'Chair Squat': ['machine:lever_machines'],
  'Calf-Machine Shoulder Shrug': ['machine:calf_machine'],
  'Calf Press On The Leg Press Machine': ['machine:leg_press'],
  'Lying Machine Squat': ['machine:hack_squat'],
  'Lying T-Bar Row': ['machine:lever_machines'],
  'Weighted Ball Hyperextension': ['fitball'],
};

// ---------- Màquines per paraules clau ----------
const MACHINE_RULES = [
  [/smith/i, 'smith'],
  [/leg press/i, 'leg_press'],
  [/hack squat/i, 'hack_squat'],
  [/leg extension/i, 'leg_extension'],
  [/leg curl/i, 'leg_curl'],
  [/pulldown/i, 'lat_pulldown'],
  [/butterfly|pec deck|reverse machine fl/i, 'pec_deck'],
  [/machine bench press|chest press/i, 'chest_press'],
  [/shoulder \(military\) press|leverage shoulder press/i, 'shoulder_press'],
  [/calf/i, 'calf_machine'],
  [/thigh (abductor|adductor)/i, 'adductor_abductor'],
  [/dip machine/i, 'assisted_pullup_dip'],
  [/machine (bicep|preacher)|machine triceps|preacher curls/i, 'arm_machines'],
  [/ab crunch machine/i, 'ab_machine'],
  [/leverage|t-bar/i, 'lever_machines'],
];

const CARDIO_RULES = [
  [/treadmill|trail running|running/i, 'treadmill'],
  [/stationary|recumbent|bicycling/i, 'bike'],
  [/elliptical/i, 'elliptical'],
  [/rowing/i, 'rower'],
  [/stairmaster|step mill/i, 'stair_climber'],
];

// ---------- Banc segons el nom ----------
function benchCaps(name, { barbell = false } = {}) {
  if (/decline/i.test(name)) return ['bench_decline'];
  if (/incline|preacher|spider curl|scott/i.test(name) && !/incline push-up/i.test(name)) return ['bench_incline'];
  if (/bench|lying|flye|fly\b|flyes|pullover|skull ?crusher|seated|prone|head on bench|concentration|tate press|hip thrust|rollout from bench|jm press/i.test(name)
    && !/floor|bench dips|bench jump|bench sprint|ball/i.test(name)) return ['bench_flat'];
  if (barbell && /board press|pin press/i.test(name)) return ['bench_flat'];
  return [];
}

const RE_RACK_BARBELL = /bench press|board press|pin press|guillotine|squat(?!.*jump)|shoulder press|military press|push press|press behind|bradford|rack|jerk dip/i;

function machineCap(name) {
  for (const [re, id] of MACHINE_RULES) if (re.test(name)) return `machine:${id}`;
  return null;
}

function cableCap(name) {
  if (/pulldown|pushdown|face pull|high|overhead|kneeling.*crunch|rope crunch|cable crunch|judo|iron cross|wood ?chop|standing rope|crossover(?!.*low)|rear delt fly|incline pushdown/i.test(name) && !/low/i.test(name)) return 'cable_high';
  return 'cable_low';
}

// ---------- Patró de moviment ----------
export function movementPattern(ex) {
  const n = ex.nameEn || ex.name;
  if (ex.pattern) return ex.pattern;
  if (/walk|carry|farmer|yoke/i.test(n)) return 'carry';
  if (/lunge|split squat|step[- ]?up|bulgarian|pistol|single-leg.*squat|one leg barbell squat/i.test(n)) return 'lunge';
  if (/deadlift|good morning|hip thrust|glute bridge|bridge|swing|pull through|romanian|hyperextension|back extension|glute ham|nordic|stiff/i.test(n)) return 'hinge';
  if (/squat|leg press|hack/i.test(n)) return 'squat';
  if (/pull-?ups?|chin|pulldown|muscle up/i.test(n)) return 'vertical_pull';
  if (/row|face pull|pull apart/i.test(n)) return 'horizontal_pull';
  if (/shoulder press|military|overhead press|push press|arnold|handstand|jerk|pike|press behind/i.test(n)) return 'vertical_push';
  if (/bench press|push-?ups?|pushups|floor press|chest press|dip|flye?s?\b|crossover|pec deck|butterfly|svend/i.test(n)) return 'horizontal_push';
  const t = exerciseTargets(ex).primary[0] || 'other';
  if (/\bpress\b/i.test(n) && !/leg press|calf press|pallof/i.test(n)) {
    if (t === 'chest' || (t === 'triceps' && /bench|floor/i.test(n))) return 'horizontal_push';
    if (t === 'front-delts' || t === 'side-delts') return 'vertical_push';
  }
  return `iso:${t}`;
}

export const COMPOUND_PATTERNS = ['squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'carry'];

const RE_UNILATERAL = /one[- ]arm|one[- ]leg|single[- ]arm|single[- ]leg|single leg|alternat|split squat|lunge|step[- ]?ups?|pistol|bulgarian|unilateral|one-legged|one arm|one handed/i;
const RE_JUMP = /jump|hop|bound|leap|skip|burpee|plyo|tuck jump|star jump|depth|skater|carioca|frog hops|box shuffle|bench sprint|stride/i;
const RE_BALLISTIC = /swing|snatch|clean|jerk|throw|toss|slam|push press|thruster|high pull|kipping/i;
const RE_OVERHEAD = /shoulder press|military press|push press|press behind|jerk|snatch|overhead squat|overhead press|bradford/i;

// ---------- API principal ----------
export function getRequirements(ex) {
  if (ex._req) return ex._req;
  const req = computeRequirements(ex);
  Object.defineProperty(ex, '_req', { value: req, enumerable: false, configurable: true });
  return req;
}

function computeRequirements(ex) {
  const name = ex.nameEn || ex.name;
  const base = {
    pattern: movementPattern(ex),
    unilateral: ex.unilateral ?? RE_UNILATERAL.test(name),
    jump: ex.flags?.jump ?? (ex.category === 'plyometrics' || RE_JUMP.test(name)),
    ballistic: ex.flags?.ballistic ?? RE_BALLISTIC.test(name),
    overheadBarbell: false,
    floorDrop: ex.category === 'olympic weightlifting' || /slam|atlas|tire flip|keg/i.test(name),
  };

  // Exercicis propis: ho declaren tot
  if (ex.custom) {
    return {
      ...base,
      requires: ex.requires || [],
      load: ex.load || null,
      overheadBarbell: !!ex.flags?.overheadBarbell,
      mapped: true,
    };
  }

  for (const [re, reason] of EXCLUDED) {
    if (re.test(name) && reason) return { ...base, requires: [], load: null, mapped: false, excluded: reason };
  }
  if (Object.prototype.hasOwnProperty.call(MANUAL, name)) {
    const m = MANUAL[name];
    if (m === null) return { ...base, requires: [], load: null, mapped: false, excluded: 'Necessita un cotxe' };
    const load = m.includes('weight_vest') ? { cap: 'weight_vest', pair: false }
      : m.includes('dumbbells') && /farmer/i.test(name) ? { cap: 'dumbbells', pair: true }
        : m.includes('trap_bar') ? { cap: 'trap_bar', pair: false }
          : m.find((c) => typeof c === 'string' && c.startsWith('machine:')) ? { cap: m.find((c) => typeof c === 'string' && c.startsWith('machine:')), pair: false }
            : m.includes('sandbag') ? { cap: 'sandbag', pair: false } : null;
    return { ...base, requires: m, load, mapped: true };
  }

  const eq = ex.equipment;
  let requires = [];
  let load = null;

  switch (eq) {
    case 'barbell': {
      requires = ['barbell', 'plates', ...benchCaps(name, { barbell: true })];
      if (RE_RACK_BARBELL.test(name) && !/jump|hack|step|lunge|split|bands$/i.test(name)) requires.push('rack');
      if (/landmine/i.test(name)) requires.push('landmine');
      if (/with bands|reverse band/i.test(name)) requires.push('bands');
      if (/step ups?/i.test(name)) requires.push('box_or_step');
      if (/box squat|to a bench/i.test(name)) requires.push('box_or_step');
      load = { cap: 'barbell', pair: false };
      base.overheadBarbell = RE_OVERHEAD.test(name);
      break;
    }
    case 'e-z curl bar':
      requires = ['ez_bar', 'plates', ...benchCaps(name, { barbell: true })];
      if (/with band/i.test(name)) requires.push('bands');
      load = /bodyweight/i.test(name) ? null : { cap: 'ez_bar', pair: false };
      if (/bodyweight/i.test(name)) requires = ['ez_bar'];
      break;
    case 'dumbbell': {
      requires = ['dumbbells', ...benchCaps(name)];
      if (/step ups?|box jump/i.test(name)) requires.push('box_or_step');
      if (/to a bench/i.test(name)) requires.push('box_or_step');
      const single = /one[- ]arm|single|one dumbbell|goblet|concentration|pullover|calf raise on a dumbbell|side bend|plie|one-leg|alternat|^dumbbell raise$|around the worlds|incline row/i.test(name)
        && !/alternat.*(curl|press|raise)/i.test(name);
      load = { cap: 'dumbbells', pair: !single };
      break;
    }
    case 'kettlebells':
      requires = ['kettlebell'];
      load = { cap: 'kettlebell', pair: /two|double|kettlebells|alternating (floor press|kettlebell press|kettlebell row|hang clean)|seesaw|renegade/i.test(name) };
      base.overheadBarbell = false;
      break;
    case 'cable':
      requires = [cableCap(name), ...benchCaps(name).filter((c) => c !== 'bench_flat' || /bench|lying/i.test(name))];
      if (/bosu/i.test(name)) requires.push('bosu');
      load = { cap: requires[0], pair: false };
      break;
    case 'machine': {
      const cardio = ex.category === 'cardio' ? CARDIO_RULES.find(([re]) => re.test(name)) : null;
      if (cardio) { requires = [`cardio:${cardio[1]}`]; break; }
      const m = machineCap(name);
      if (!m) return { ...base, requires: [], load: null, mapped: false };
      requires = [m];
      load = m === 'machine:back_extension' ? null : { cap: m, pair: false };
      break;
    }
    case 'body only': {
      if (/pull-?ups?|pullup|chin|hanging|muscle up|gorilla|body-up/i.test(name)) requires.push('pullup_bar');
      if (/\bdips?\b/i.test(name)) requires.push('dip_station');
      if (/inverted row/i.test(name)) requires.push('low_bar');
      if (/handstand/i.test(name)) requires.push('wall');
      if (/step-?up/i.test(name)) requires.push('box_or_step');
      if (/box jump/i.test(name)) requires.push('plyo_box');
      requires.push(...benchCaps(name).filter(() => /flat bench|decline|seated flat/i.test(name)));
      break;
    }
    case 'bands':
      requires = ['bands'];
      if (/pushdown|face pull|cross over|pallof|hamstring curl|pull through|good morning \(pull/i.test(name)) requires.push('band_anchor');
      if (/bench press/i.test(name)) requires = ['bands', 'barbell', 'plates', 'bench_flat', 'rack'];
      if (/bench press/i.test(name)) load = { cap: 'barbell', pair: false };
      break;
    case 'medicine ball':
      requires = ['medicine_ball'];
      if (/crunches/i.test(name)) load = { cap: 'medicine_ball', pair: false };
      break;
    case 'exercise ball':
      requires = ['fitball'];
      break;
    case 'foam roll':
      requires = ['foam_roller'];
      break;
    case 'other':
    case null:
    case undefined:
      if (ex.category === 'stretching') { requires = []; break; }
      if (ex.category === 'cardio') {
        const c = CARDIO_RULES.find(([re]) => re.test(name));
        if (c) { requires = [`cardio:${c[1]}`]; break; }
        return { ...base, requires: [], load: null, mapped: false, excluded: 'Cardio a l\'aire lliure (fora del generador de força)' };
      }
      return { ...base, requires: [], load: null, mapped: false };
    default:
      return { ...base, requires: [], load: null, mapped: false };
  }
  return { ...base, requires: [...new Set(requires.map((r) => (Array.isArray(r) ? r : r)))], load, mapped: true };
}

// ---------- Restriccions del lloc i limitacions de l'usuari ----------
export function violatesConstraints(ex, constraints = {}) {
  const r = getRequirements(ex);
  const reasons = [];
  if (constraints.noJumps && r.jump) reasons.push('Sense salts');
  if (constraints.lowCeiling && r.overheadBarbell) reasons.push('Sostre baix');
  if (constraints.fragileFloor && r.floorDrop) reasons.push('Terra delicat');
  return reasons;
}

export const LIMITATION_RULES = {
  shoulder: /behind (the )?neck|upright|\bdips?\b|handstand|snatch|jerk|kipping|muscle up|guillotine|pullover|military|push press|overhead press|wide-grip.*bench|iron cross/i,
  elbow: /skull ?crusher|lying triceps|triceps extension|tricep extension|close-grip.*(bench|press)|jm press|tate press|\bdips?\b/i,
  wrist: /front (barbell )?squat|clean|handstand|wrist|zottman|reverse.*curl|push press|jerk|snatch/i,
  lowerBack: /deadlift|good morning|bent[- ]over.*row|hyperextension|back extension|sit-up|jefferson|clean|snatch|t-bar|long bar row|atlas|tire flip|keg|superman|stiff/i,
  knee: /jump|hop|bound|leap|lunge|pistol|sissy|leg extension|split squat|full squat|step-?up|skater|frog|tuck|depth|bulgarian/i,
  ankle: /jump|hop|bound|leap|skip|sprint|calf raise|calf press|carioca|run|skating|rope jumping/i,
};

export function limitationConflicts(ex, limitations = []) {
  const name = ex.nameEn || ex.name;
  return limitations.filter((l) => (ex.limitations || []).includes(l) || (LIMITATION_RULES[l] && LIMITATION_RULES[l].test(name)));
}

/**
 * Es pot fer aquest exercici en aquest lloc?
 * @param caps resultat de locationCapabilities(location)
 * @returns { ok, adapted, notes: [text], safety: [text], loadItem, missing: [cap] }
 */
export function feasibility(ex, caps, constraints = {}) {
  const r = getRequirements(ex);
  if (!r.mapped) return { ok: false, adapted: false, notes: [], safety: [], missing: [], reason: r.excluded || 'Sense mapejar' };
  const blocked = violatesConstraints(ex, constraints);
  if (blocked.length) return { ok: false, adapted: false, notes: [], safety: [], missing: [], reason: blocked.join(', ') };
  const notes = [];
  const safety = [];
  const missing = [];
  let adapted = false;
  const resolved = {};
  for (const req of r.requires) {
    const options = Array.isArray(req) ? req : [req];
    let best = null;
    for (const cap of options) {
      const res = resolveCap(cap, caps, ex);
      if (res.ok && (!best || (best.adapted && !res.adapted))) best = { ...res, cap };
    }
    if (!best) { missing.push(options.join(' o ')); continue; }
    resolved[best.cap] = best;
    for (const c of options) if (!resolved[c]) resolved[c] = best;
    if (best.adapted) {
      adapted = true;
      if (best.note) notes.push(best.note);
      if (best.safety) safety.push(best.safety);
    }
  }
  if (missing.length) return { ok: false, adapted: false, notes: [], safety: [], missing, reason: 'Falta material' };
  const loadRes = r.load ? resolved[r.load.cap] : null;
  return { ok: true, adapted, notes: [...new Set(notes)], safety: [...new Set(safety)], missing: [], loadItem: loadRes?.item || null, loadItems: loadRes?.items || (loadRes?.item ? [loadRes.item] : []) };
}

/** Llista plana de totes les capacitats que pot demanar algun exercici (per a l'auditoria). */
export function allRequiredCaps(exercises) {
  const s = new Set();
  for (const ex of exercises) for (const r of getRequirements(ex).requires) (Array.isArray(r) ? r : [r]).forEach((c) => s.add(c));
  return [...s].sort();
}

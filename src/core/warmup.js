// Escalfament detallat i estiraments de tornada a la calma, segons els músculs i el material del lloc. JS pur.
import { resolveCap } from './inventory.js';
import { regionOf } from './blocks.js';

// Estiraments estàtics (sense company) per múscul, amb el material que necessiten
const STATIC = {
  chest: [['Chest_And_Front_Of_Shoulder_Stretch', [['wall', 'door', 'rack', 'pullup_bar', 'park']]], ['Shoulder_Stretch', []]],
  'front-delts': [['Shoulder_Stretch', []]],
  'side-delts': [['Shoulder_Stretch', []]],
  'rear-delts': [['Upper_Back_Stretch', []]],
  'middle-back': [['Middle_Back_Stretch', []], ['Upper_Back_Stretch', []]],
  traps: [['Upper_Back_Stretch', []]],
  lats: [['Side-Lying_Floor_Stretch', []]],
  triceps: [['Triceps_Stretch', []]],
  biceps: [['Standing_Biceps_Stretch', []]],
  forearms: [['Kneeling_Forearm_Stretch', []]],
  abs: [['Standing_Lateral_Stretch', []]],
  obliques: [['Standing_Lateral_Stretch', []]],
  'lower-back': [['Childs_Pose', []], ['Cat_Stretch', []]],
  quads: [['On_Your_Side_Quad_Stretch', []], ['Kneeling_Hip_Flexor', []]],
  hamstrings: [['Seated_Floor_Hamstring_Stretch', []], ['90_90_Hamstring', []]],
  glutes: [['Knee_Across_The_Body', []]],
  abductors: [['Knee_Across_The_Body', []]],
  calves: [['Calf_Stretch_Hands_Against_Wall', ['wall']], ['Standing_Gastrocnemius_Calf_Stretch', ['box_or_step']]],
  adductors: [['Side_Lying_Groin_Stretch', []]],
  neck: [['Side_Neck_Stretch', []]],
};
const PER_SIDE = new Set(['Shoulder_Stretch', 'Side-Lying_Floor_Stretch', 'Triceps_Stretch', 'Standing_Lateral_Stretch', 'On_Your_Side_Quad_Stretch', 'Kneeling_Hip_Flexor', '90_90_Hamstring', 'Knee_Across_The_Body', 'Calf_Stretch_Hands_Against_Wall', 'Standing_Gastrocnemius_Calf_Stretch', 'Side_Neck_Stretch', 'Chest_And_Front_Of_Shoulder_Stretch']);

const MOBILITY = {
  upper: ['Arm_Circles', 'Dynamic_Chest_Stretch', 'Dynamic_Back_Stretch', 'Shoulder_Circles'],
  lower: ['Standing_Hip_Circles', 'Groiners', 'Knee_Circles', 'Worlds_Greatest_Stretch'],
  both: ['Worlds_Greatest_Stretch', 'Inchworm', 'Arm_Circles', 'Standing_Hip_Circles'],
};

const CARDIO_ORDER = [
  ['cardio:rower', 'Remadora a ritme suau'],
  ['cardio:air_bike', 'Air bike a ritme suau'],
  ['cardio:bike', 'Bicicleta a ritme suau'],
  ['cardio:skierg', 'SkiErg a ritme suau'],
  ['cardio:elliptical', 'El·líptica a ritme suau'],
  ['cardio:treadmill', 'Cinta: caminar ràpid o trotar suau'],
  ['cardio:stair_climber', 'Escaladora a ritme suau'],
];

const ok = (reqs, caps) => reqs.every((r) => (Array.isArray(r) ? r : [r]).some((c) => resolveCap(c, caps, { name: '' }).ok));

/**
 * Escalfament: general (3 min) + mobilitat dinàmica (4 × 30 s) + activació (ronda suau del primer bloc) + aproximació.
 * @param firstBlock entrades del primer bloc (per a l'activació i les sèries d'aproximació)
 */
export function buildWarmup({ targets, caps, constraints = {}, firstBlock = [], short = false }) {
  const items = [];
  const general = short ? 120 : 180;
  const cardio = CARDIO_ORDER.find(([cap]) => caps.has(cap));
  if (cardio) items.push({ kind: 'cardio', name: cardio[1], seconds: general });
  else if (caps.has('jump_rope') && !constraints.noJumps) items.push({ kind: 'cardio', name: 'Saltar a corda a ritme suau', seconds: general });
  else if (!constraints.noJumps) items.push({ kind: 'cardio', name: 'Jumping jacks i skipping suau, alternant cada 30 s', seconds: general });
  else items.push({ kind: 'cardio', name: 'Marxa al lloc portant els genolls amunt i movent els braços', seconds: general });

  const regions = new Set(targets.map(regionOf).filter((r) => r !== 'core'));
  const key = regions.has('upper') && regions.has('lower') ? 'both' : regions.has('lower') ? 'lower' : 'upper';
  for (const id of MOBILITY[key].slice(0, short ? 3 : 4)) items.push({ kind: 'mobility', exerciseId: id, seconds: 30 });

  if (firstBlock.length) {
    items.push({
      kind: 'activation',
      name: `Ronda d'activació: ${firstBlock.map((e) => e.pos).join(' → ')} amb la meitat de reps i ~50 % del pes`,
      seconds: 120,
    });
    const withApproach = firstBlock.filter((e) => e.approach?.length);
    // Aproximació només si el pes és prou alt per necessitar-la (barra o ≥ 20 kg)
    const worth = withApproach.filter((e) => e.weight && (e.weight.itemKind === 'bar' || e.weight.kg >= 20));
    const heavy = worth.find((e) => e.pos === 'A') || worth.sort((a, b) => (b.weight?.kg || 0) - (a.weight?.kg || 0))[0];
    if (heavy) {
      for (const a of heavy.approach) items.push({ kind: 'approach', exerciseId: heavy.exerciseId, reps: a.reps, loadKg: a.kg, name: `Aproximació: ${a.reps} reps amb ${a.setup}`, seconds: 45 });
    }
  }
  return items;
}

/** Tornada a la calma: un estirament estàtic per als músculs més treballats (4–6), 30–40 s. */
export function buildCooldown({ fatigue = {}, caps, short = false }) {
  const order = Object.entries(fatigue).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const used = new Set();
  const items = [];
  for (const t of order) {
    if (items.length >= (short ? 4 : 6)) break;
    const pick = (STATIC[t] || []).find(([id, reqs]) => !used.has(id) && ok(reqs, caps));
    if (!pick) continue;
    used.add(pick[0]);
    const perSide = PER_SIDE.has(pick[0]);
    items.push({ kind: 'stretch', exerciseId: pick[0], target: t, seconds: perSide ? 30 : 40, perSide });
  }
  if (items.length < 4 && !used.has('Childs_Pose')) items.push({ kind: 'stretch', exerciseId: 'Childs_Pose', target: 'lower-back', seconds: 40, perSide: false });
  items.push({ kind: 'breath', name: 'Respiració lenta: 4 s inspirar, 6 s expirar', seconds: 60 });
  return items;
}

export function itemsMinutes(items) {
  return items.reduce((s, i) => s + (i.seconds || 30) * (i.perSide ? 2 : 1), 0) / 60;
}

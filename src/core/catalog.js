// Catàleg de material (secció 5 de l'especificació). JS pur.
//
// Cada element:
//   id, name (català), cat, provides: capacitats directes,
//   subs: substitucions [{ cap, rule?, note, when?(attrs) }] → l'exercici queda "Adaptat",
//   fields: atributs editables (level 2 = quantitats/pesos, level 3 = avançat),
//   defaults, load: com aporta càrrega (veure loads.js), equiv / safety: textos d'ajuda.

export const CATEGORIES = [
  { id: 'free', name: 'Pes lliure' },
  { id: 'bench', name: 'Bancs i estructures' },
  { id: 'bands', name: 'Gomes i accessoris' },
  { id: 'machine', name: 'Màquines' },
  { id: 'cardio', name: 'Cardio' },
  { id: 'home', name: 'Casolà i exterior' },
];

const machine = (id, name, extra = {}) => ({
  id, name, cat: 'machine', provides: [`machine:${id}`, ...(extra.provides || [])],
  subs: extra.subs || [],
  fields: [
    { key: 'incrementKg', label: 'Increment de placa', type: 'number', unit: 'kg', level: 2, step: 0.5 },
    { key: 'maxKg', label: 'Pes màxim', type: 'number', unit: 'kg', level: 2 },
    ...(extra.fields || []),
  ],
  defaults: { incrementKg: 5, maxKg: extra.maxKg || 100, ...(extra.defaults || {}) },
  load: { implement: `machine:${id}`, kind: 'stack' },
  pro: extra.pro,
});

const cardio = (id, name) => ({ id, name, cat: 'cardio', provides: [`cardio:${id}`], subs: [], fields: [], defaults: {} });

export const CATALOG = [
  // ---------- A. Pes lliure ----------
  {
    id: 'dumbbells_fixed', name: 'Mancuernes fixes', cat: 'free', provides: ['dumbbells'],
    subs: [{ cap: 'kettlebell', note: 'Kettlebell substituïda per una mancuerna (agafa-la pel disc als swings)' }],
    fields: [
      { key: 'weights', label: 'Pesos disponibles', type: 'weights', unit: 'kg', level: 2 },
      { key: 'pairs', label: 'Hi ha parell de cada pes', type: 'bool', level: 3 },
    ],
    defaults: { weights: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30], pairs: true },
    load: { implement: 'dumbbell', kind: 'list' },
  },
  {
    id: 'dumbbells_adjustable', name: 'Mancuernes ajustables de disc', cat: 'free', provides: ['dumbbells'],
    subs: [{ cap: 'kettlebell', note: 'Kettlebell substituïda per una mancuerna' }],
    fields: [
      { key: 'handleKg', label: 'Pes de la maneta', type: 'number', unit: 'kg', level: 3, step: 0.5 },
      { key: 'handles', label: 'Nombre de manetes', type: 'number', level: 2 },
      { key: 'plates', label: 'Discs', type: 'plates', unit: 'kg', level: 2 },
    ],
    defaults: { handleKg: 2, handles: 2, plates: [{ kg: 1.25, qty: 4 }, { kg: 2.5, qty: 4 }, { kg: 5, qty: 4 }] },
    load: { implement: 'dumbbell', kind: 'adjustable' },
  },
  {
    id: 'dumbbells_selector', name: 'Mancuernes de selector', cat: 'free', provides: ['dumbbells'],
    subs: [{ cap: 'kettlebell', note: 'Kettlebell substituïda per una mancuerna' }],
    fields: [
      { key: 'minKg', label: 'Mínim', type: 'number', unit: 'kg', level: 2, step: 0.5 },
      { key: 'maxKg', label: 'Màxim', type: 'number', unit: 'kg', level: 2, step: 0.5 },
      { key: 'stepKg', label: 'Increment', type: 'number', unit: 'kg', level: 3, step: 0.5 },
    ],
    defaults: { minKg: 2.5, maxKg: 24, stepKg: 2.5 },
    load: { implement: 'dumbbell', kind: 'range' },
  },
  {
    id: 'barbell_olympic', name: 'Barra olímpica', cat: 'free', provides: ['barbell'],
    subs: [{ cap: 'ez_bar', note: 'Barra recta en lloc de barra EZ' }],
    fields: [{ key: 'weightKg', label: 'Pes de la barra', type: 'number', unit: 'kg', level: 3, step: 0.5 }],
    defaults: { weightKg: 20, diameter: 'olympic' },
    load: { implement: 'barbell', kind: 'bar' },
  },
  {
    id: 'barbell_standard', name: 'Barra estàndard (Ø 28 mm)', cat: 'free', provides: ['barbell'],
    subs: [{ cap: 'ez_bar', note: 'Barra recta en lloc de barra EZ' }],
    fields: [{ key: 'weightKg', label: 'Pes de la barra', type: 'number', unit: 'kg', level: 3, step: 0.5 }],
    defaults: { weightKg: 8, diameter: 'standard' },
    load: { implement: 'barbell', kind: 'bar' },
  },
  {
    id: 'barbell_ez', name: 'Barra EZ', cat: 'free', provides: ['ez_bar'],
    subs: [],
    fields: [
      { key: 'weightKg', label: 'Pes de la barra', type: 'number', unit: 'kg', level: 3, step: 0.5 },
      { key: 'diameter', label: 'Diàmetre', type: 'select', level: 3, options: [{ value: 'olympic', label: 'Olímpic (50 mm)' }, { value: 'standard', label: 'Estàndard (28 mm)' }] },
    ],
    defaults: { weightKg: 10, diameter: 'olympic' },
    load: { implement: 'ez_bar', kind: 'bar' },
  },
  {
    id: 'trap_bar', name: 'Barra hexagonal (trap bar)', cat: 'free', provides: ['trap_bar'], pro: true,
    subs: [],
    fields: [{ key: 'weightKg', label: 'Pes de la barra', type: 'number', unit: 'kg', level: 3 }],
    defaults: { weightKg: 25, diameter: 'olympic' },
    load: { implement: 'trap_bar', kind: 'bar' },
  },
  {
    id: 'ssb', name: 'Barra multiagafada / safety squat', cat: 'free', provides: ['ssb'], pro: true,
    subs: [], fields: [{ key: 'weightKg', label: 'Pes de la barra', type: 'number', unit: 'kg', level: 3 }],
    defaults: { weightKg: 25 },
  },
  {
    id: 'plates', name: 'Discs', cat: 'free', provides: ['plates'],
    subs: [],
    fields: [
      { key: 'plates', label: 'Discs (pes × quantitat)', type: 'plates', unit: 'kg', level: 2 },
      { key: 'diameter', label: 'Diàmetre', type: 'select', level: 3, options: [{ value: 'olympic', label: 'Olímpic (50 mm)' }, { value: 'standard', label: 'Estàndard (28 mm)' }] },
    ],
    defaults: { plates: [{ kg: 1.25, qty: 2 }, { kg: 2.5, qty: 2 }, { kg: 5, qty: 2 }, { kg: 10, qty: 2 }, { kg: 20, qty: 2 }], diameter: 'olympic' },
  },
  {
    id: 'kettlebells', name: 'Kettlebells', cat: 'free', provides: ['kettlebell'],
    subs: [{ cap: 'dumbbells', rule: 'controlled', note: 'Kettlebell en lloc de mancuerna' }],
    fields: [{ key: 'weights', label: 'Pesos', type: 'weights', unit: 'kg', level: 2 }],
    defaults: { weights: [8, 12, 16] },
    load: { implement: 'kettlebell', kind: 'list' },
  },
  {
    id: 'weight_vest', name: 'Armilla llastrada', cat: 'free', provides: ['weight_vest'],
    subs: [],
    fields: [
      { key: 'kg', label: 'Pes', type: 'number', unit: 'kg', level: 2 },
      { key: 'adjustable', label: 'Ajustable', type: 'bool', level: 3 },
    ],
    defaults: { kg: 10, adjustable: false },
    load: { implement: 'weight_vest', kind: 'vest' },
  },
  {
    id: 'ankle_weights', name: 'Turmelleres / canelleres de pes', cat: 'free', provides: ['ankle_weights'],
    subs: [], fields: [{ key: 'kg', label: 'Pes de cada una', type: 'number', unit: 'kg', level: 2, step: 0.5 }],
    defaults: { kg: 1 },
  },
  {
    id: 'dip_belt', name: 'Cinturó de llast amb cadena', cat: 'free', provides: ['dip_belt'], pro: true,
    subs: [{ cap: 'weight_vest', note: 'Cinturó de llast en lloc d\'armilla' }], fields: [], defaults: {},
  },
  {
    id: 'medicine_ball', name: 'Pilota medicinal / wall ball / slam ball', cat: 'free', provides: ['medicine_ball'],
    subs: [], fields: [{ key: 'weights', label: 'Pesos', type: 'weights', unit: 'kg', level: 2 }],
    defaults: { weights: [6] },
    load: { implement: 'medicine_ball', kind: 'list' },
  },
  {
    id: 'sandbag', name: 'Sandbag / sac búlgar', cat: 'free', provides: ['sandbag'],
    subs: [], fields: [{ key: 'weights', label: 'Pesos', type: 'weights', unit: 'kg', level: 2 }],
    defaults: { weights: [20] },
    load: { implement: 'sandbag', kind: 'list' },
  },

  // ---------- B. Bancs i estructures ----------
  {
    id: 'bench_flat', name: 'Banc pla', cat: 'bench', provides: ['bench_flat', 'box_or_step'],
    subs: [
      { cap: 'bench_incline', rule: 'notBarbell', note: 'Banc pla amb un suport estable sota un extrem', safety: 'Comprova que el suport no rellisca abans de carregar.' },
      { cap: 'dip_station', rule: 'benchDip', note: 'Fons a banc en lloc de paral·leles' },
    ],
    fields: [{ key: 'rackSupports', label: 'Amb suports per a la barra', type: 'bool', level: 3 }],
    defaults: { rackSupports: false },
  },
  {
    id: 'bench_adjustable', name: 'Banc ajustable', cat: 'bench', provides: ['bench_flat', 'bench_incline', 'box_or_step'],
    subs: [{ cap: 'dip_station', rule: 'benchDip', note: 'Fons a banc en lloc de paral·leles' }],
    fields: [
      { key: 'angles', label: 'Angles disponibles', type: 'multi', unit: '°', level: 3, options: [0, 15, 30, 45, 60, 90] },
      { key: 'decline', label: 'Declinat', type: 'bool', level: 3 },
    ],
    defaults: { angles: [0, 15, 30, 45, 60, 90], decline: true },
    extraProvides: (a) => (a.decline ? ['bench_decline'] : []),
  },
  {
    id: 'rack', name: 'Suports d\'esquat / gàbia', cat: 'bench', provides: ['rack'],
    subs: [{ cap: 'low_bar', note: 'Barra del rack a baixa alçada per al rem invertit' }],
    fields: [
      { key: 'kind', label: 'Tipus', type: 'select', level: 3, options: [{ value: 'stands', label: 'Suports' }, { value: 'half', label: 'Mitja gàbia' }, { value: 'power', label: 'Power rack' }] },
      { key: 'safeties', label: 'Amb barres de seguretat', type: 'bool', level: 3 },
      { key: 'pullupBar', label: 'Barra de dominades integrada', type: 'bool', level: 3 },
    ],
    defaults: { kind: 'power', safeties: true, pullupBar: true },
    extraProvides: (a) => (a.pullupBar ? ['pullup_bar'] : []),
  },
  {
    id: 'pullup_bar', name: 'Barra de dominades', cat: 'bench', provides: ['pullup_bar'],
    subs: [],
    fields: [
      { key: 'type', label: 'Tipus', type: 'select', level: 3, options: [{ value: 'door', label: 'De porta' }, { value: 'wall', label: 'De paret' }, { value: 'ceiling', label: 'De sostre' }, { value: 'rig', label: 'Rig' }] },
      { key: 'rings', label: 'S\'hi poden penjar anelles', type: 'bool', level: 3 },
    ],
    defaults: { type: 'wall', rings: true },
  },
  { id: 'dip_station', name: 'Paral·leles (estació de fons)', cat: 'bench', provides: ['dip_station'], subs: [], fields: [], defaults: {} },
  { id: 'parallettes', name: 'Paralletes', cat: 'bench', provides: ['parallettes'], subs: [], fields: [], defaults: {} },
  {
    id: 'rings', name: 'Anelles', cat: 'bench', provides: ['rings_or_suspension'],
    subs: [
      { cap: 'pullup_bar', note: 'Anelles penjades alt en lloc de barra' },
      { cap: 'low_bar', note: 'Anelles baixes per al rem invertit' },
      { cap: 'dip_station', rule: 'dip', note: 'Fons a les anelles' },
    ],
    fields: [{ key: 'anchor', label: 'Punt d\'ancoratge disponible', type: 'bool', level: 3 }],
    defaults: { anchor: true },
  },
  {
    id: 'suspension', name: 'Suspensió (TRX)', cat: 'bench', provides: ['rings_or_suspension'],
    subs: [{ cap: 'low_bar', note: 'TRX per al rem invertit' }],
    fields: [{ key: 'anchor', label: 'Punt d\'ancoratge disponible', type: 'bool', level: 3 }],
    defaults: { anchor: true },
  },
  { id: 'landmine', name: 'Landmine', cat: 'bench', provides: ['landmine'], subs: [], fields: [], defaults: {}, equiv: 'Substitut: extrem de la barra a la cantonada de la paret amb una tovallola.' },
  { id: 'wall_bars', name: 'Espatllera', cat: 'bench', provides: ['wall_bars', 'band_anchor'], subs: [{ cap: 'foot_anchor', note: 'Peus sota l\'espatllera' }], fields: [], defaults: {} },

  // ---------- C. Gomes i accessoris ----------
  {
    id: 'minibands', name: 'Minibands', cat: 'bands', provides: ['bands', 'minibands'],
    subs: [], fields: [{ key: 'colors', label: 'Colors i resistència aproximada', type: 'text', level: 3 }],
    defaults: { colors: 'groc 5 kg · vermell 10 kg · negre 15 kg' },
  },
  {
    id: 'power_bands', name: 'Gomes llargues (power bands)', cat: 'bands', provides: ['bands'],
    subs: [], fields: [{ key: 'bands', label: 'Amplades → resistència aproximada', type: 'text', level: 3 }],
    defaults: { bands: '13 mm ≈ 5–15 kg · 22 mm ≈ 10–25 kg · 32 mm ≈ 15–35 kg' },
  },
  {
    id: 'tube_bands', name: 'Gomes tubulars amb mànecs', cat: 'bands', provides: ['bands'],
    subs: [
      { cap: 'cable_high', when: (a) => a.doorAnchor, note: 'Goma tubular ancorada a dalt de la porta en lloc de politja alta' },
      { cap: 'cable_low', when: (a) => a.doorAnchor, note: 'Goma tubular ancorada a baix de la porta en lloc de politja baixa' },
    ],
    fields: [
      { key: 'doorAnchor', label: 'Amb ancoratge de porta', type: 'bool', level: 2 },
      { key: 'resistance', label: 'Resistències', type: 'text', level: 3 },
    ],
    defaults: { doorAnchor: true, resistance: 'lleugera · mitjana · forta' },
    extraProvides: (a) => (a.doorAnchor ? ['band_anchor'] : []),
  },
  { id: 'ab_wheel', name: 'Roda abdominal', cat: 'bands', provides: ['ab_wheel'], subs: [], fields: [], defaults: {} },
  { id: 'fitball', name: 'Fitball', cat: 'bands', provides: ['fitball'], subs: [], fields: [{ key: 'diameterCm', label: 'Diàmetre', type: 'number', unit: 'cm', level: 3 }], defaults: { diameterCm: 65 } },
  { id: 'bosu', name: 'Bosu', cat: 'bands', provides: ['bosu'], subs: [], fields: [], defaults: {} },
  { id: 'foam_roller', name: 'Foam roller', cat: 'bands', provides: ['foam_roller'], subs: [], fields: [], defaults: {} },
  { id: 'jump_rope', name: 'Corda de saltar', cat: 'bands', provides: ['jump_rope'], subs: [], fields: [], defaults: {} },
  { id: 'agility_ladder', name: 'Escala d\'agilitat', cat: 'bands', provides: ['agility_ladder'], subs: [], fields: [], defaults: {} },
  { id: 'cones', name: 'Cons', cat: 'bands', provides: ['cones'], subs: [], fields: [], defaults: {} },
  {
    id: 'hurdles', name: 'Tanques', cat: 'bands', provides: ['hurdles'], subs: [],
    fields: [{ key: 'heights', label: 'Alçades regulables', type: 'weights', unit: 'cm', level: 2 }],
    defaults: { heights: [30, 50, 70, 90] },
  },
  {
    id: 'plyo_box', name: 'Caixa pliomètrica / step', cat: 'bands', provides: ['plyo_box', 'box_or_step'], subs: [],
    fields: [{ key: 'heights', label: 'Alçades', type: 'weights', unit: 'cm', level: 2 }],
    defaults: { heights: [30, 45, 60] },
  },
  { id: 'mat', name: 'Matalàs / colxoneta', cat: 'bands', provides: ['mat'], subs: [], fields: [], defaults: {} },
  { id: 'plint', name: 'Plint', cat: 'bands', provides: ['plint'], subs: [], fields: [], defaults: {} },

  // ---------- D. Màquines ----------
  {
    id: 'cable_station', name: 'Estació de politges', cat: 'machine', provides: [],
    subs: [],
    fields: [
      { key: 'high', label: 'Politja alta', type: 'bool', level: 3 },
      { key: 'low', label: 'Politja baixa', type: 'bool', level: 3 },
      { key: 'incrementKg', label: 'Increment de placa', type: 'number', unit: 'kg', level: 2, step: 0.5 },
      { key: 'maxKg', label: 'Pes màxim', type: 'number', unit: 'kg', level: 2 },
    ],
    defaults: { high: true, low: true, incrementKg: 5, maxKg: 90 },
    extraProvides: (a) => [...(a.high !== false ? ['cable_high'] : []), ...(a.low !== false ? ['cable_low'] : [])],
    load: { implement: 'cable', kind: 'stack' },
  },
  {
    id: 'crossover', name: 'Crossover', cat: 'machine', provides: ['cable_high', 'cable_low', 'crossover'], subs: [],
    fields: [
      { key: 'incrementKg', label: 'Increment de placa', type: 'number', unit: 'kg', level: 2, step: 0.5 },
      { key: 'maxKg', label: 'Pes màxim per costat', type: 'number', unit: 'kg', level: 2 },
    ],
    defaults: { incrementKg: 5, maxKg: 70 },
    load: { implement: 'cable', kind: 'stack' },
  },
  machine('smith', 'Màquina Smith', {
    subs: [{ cap: 'low_bar', note: 'Barra de la Smith a baixa alçada per al rem invertit' }],
    fields: [{ key: 'barKg', label: 'Pes de la barra (efectiu)', type: 'number', unit: 'kg', level: 3 }],
    defaults: { barKg: 15, incrementKg: 2.5 }, maxKg: 200,
  }),
  machine('leg_press', 'Premsa de cames', {
    fields: [{ key: 'kind', label: 'Tipus', type: 'select', level: 3, options: [{ value: '45', label: '45°' }, { value: 'horizontal', label: 'Horitzontal' }] }],
    defaults: { kind: '45' }, maxKg: 300,
  }),
  machine('hack_squat', 'Hack squat', { maxKg: 200 }),
  machine('leg_extension', 'Extensió de quàdriceps', { maxKg: 120 }),
  machine('leg_curl', 'Curl femoral', {
    fields: [{ key: 'kind', label: 'Tipus', type: 'select', level: 3, options: [{ value: 'lying', label: 'Estirat' }, { value: 'seated', label: 'Assegut' }, { value: 'both', label: 'Tots dos' }] }],
    defaults: { kind: 'both' }, maxKg: 100,
  }),
  machine('lat_pulldown', 'Jaló al pit', { maxKg: 120, provides: ['cable_high'] }),
  machine('seated_row', 'Rem assegut', { maxKg: 120, provides: ['cable_low'] }),
  machine('pec_deck', 'Contractor (pec deck)', { maxKg: 100 }),
  machine('chest_press', 'Press de pit en màquina', { maxKg: 150 }),
  machine('shoulder_press', 'Press d\'espatlles en màquina', { maxKg: 120 }),
  machine('assisted_pullup_dip', 'Dominades i fons assistits', { maxKg: 80 }),
  machine('hip_thrust_machine', 'Màquina de hip thrust', { maxKg: 200 }),
  machine('back_extension', 'Banc de lumbars 45° / GHD', { provides: ['hyper_bench', 'foot_anchor'], maxKg: 0 }),
  machine('adductor_abductor', 'Adductors / abductors', { maxKg: 100 }),
  machine('calf_machine', 'Bessons (de peu / assegut)', { maxKg: 150 }),
  machine('lever_machines', 'Màquines de palanca (discs)', { maxKg: 200 }),
  machine('arm_machines', 'Màquines de braços (curl / tríceps)', { maxKg: 80 }),
  machine('ab_machine', 'Màquina d\'abdominals', { maxKg: 80 }),
  machine('belt_squat', 'Belt squat', { pro: true, maxKg: 200 }),
  machine('pendulum_squat', 'Pendulum squat', { pro: true, maxKg: 200 }),
  machine('reverse_hyper', 'Reverse hyper', { pro: true, maxKg: 100 }),
  { id: 'sled', name: 'Trineu (sled / prowler)', cat: 'machine', provides: ['sled'], pro: true, subs: [], fields: [], defaults: {} },

  // ---------- Cardio ----------
  cardio('treadmill', 'Cinta'),
  cardio('bike', 'Bicicleta'),
  cardio('elliptical', 'El·líptica'),
  cardio('rower', 'Remadora'),
  cardio('air_bike', 'Air bike'),
  cardio('skierg', 'SkiErg'),
  cardio('stair_climber', 'Escaladora'),

  // ---------- E. Casolà i exterior ----------
  {
    id: 'jug', name: 'Garrafa', cat: 'home', provides: ['jug'],
    subs: [
      { cap: 'dumbbells', rule: 'jugDumbbell', note: 'Garrafa en lloc de mancuerna' },
      { cap: 'kettlebell', rule: 'jugKettlebell', when: (a) => a.content === 'sand', note: 'Garrafa de sorra ben tancada en lloc de kettlebell' },
    ],
    fields: [
      { key: 'volumeL', label: 'Volum', type: 'number', unit: 'L', level: 2, step: 0.5 },
      { key: 'qty', label: 'Quantitat', type: 'number', level: 2 },
      { key: 'content', label: 'Contingut', type: 'select', level: 2, options: [{ value: 'water', label: 'Aigua (1 kg/L)' }, { value: 'sand', label: 'Sorra seca (≈1,5 kg/L)' }] },
    ],
    defaults: { volumeL: 8, qty: 2, content: 'water' },
    load: { implement: 'jug', kind: 'fillable' },
    equiv: 'Mancuerna / kettlebell. 8 L de sorra ≈ 12 kg.',
    safety: 'Mai per a swings ni moviments balístics.',
  },
  {
    id: 'bottles', name: 'Ampolles plenes', cat: 'home', provides: ['jug'],
    subs: [{ cap: 'dumbbells', rule: 'jugDumbbell', note: 'Ampolles en lloc de mancuernes lleugeres' }],
    fields: [
      { key: 'volumeL', label: 'Volum', type: 'number', unit: 'L', level: 2, step: 0.5 },
      { key: 'qty', label: 'Quantitat', type: 'number', level: 2 },
      { key: 'content', label: 'Contingut', type: 'select', level: 2, options: [{ value: 'water', label: 'Aigua (1 kg/L)' }, { value: 'sand', label: 'Sorra seca (≈1,5 kg/L)' }] },
    ],
    defaults: { volumeL: 1.5, qty: 2, content: 'water' },
    load: { implement: 'jug', kind: 'fillable' },
    equiv: 'Mancuerna lleugera.',
  },
  {
    id: 'backpack', name: 'Motxilla carregada', cat: 'home', provides: ['backpack'],
    subs: [{ cap: 'weight_vest', note: 'Motxilla carregada en lloc d\'armilla llastrada' }],
    fields: [{ key: 'maxKg', label: 'Càrrega màxima', type: 'number', unit: 'kg', level: 2 }],
    defaults: { maxKg: 15 },
    load: { implement: 'backpack', kind: 'fillable' },
    equiv: 'Armilla llastrada / càrrega frontal.',
    safety: 'Tirants ben ajustats i càrrega compacta.',
  },
  {
    id: 'homemade_sandbag', name: 'Sac casolà', cat: 'home', provides: ['homemade_sandbag'],
    subs: [{ cap: 'sandbag', note: 'Sac casolà en lloc de sandbag' }],
    fields: [{ key: 'weights', label: 'Pes', type: 'weights', unit: 'kg', level: 2 }],
    defaults: { weights: [20] },
    load: { implement: 'sandbag', kind: 'list' },
    equiv: 'Sandbag (sorra en bosses dobles dins una bossa de lona).',
  },
  { id: 'broomstick', name: 'Pal d\'escombra / PVC', cat: 'home', provides: ['stick'], subs: [{ cap: 'hurdles', note: 'Pal d\'escombra sobre dues cadires o galledes (cau si el toques)' }], fields: [], defaults: {} },
  {
    id: 'towel', name: 'Tovallola', cat: 'home', provides: ['towel'],
    subs: [{ cap: 'slider_surface', note: 'Tovallola sobre terra llis en lloc de lliscadors' }],
    fields: [], defaults: {}, safety: 'A la porta: tancada cap a tu i comprova el pom.',
  },
  { id: 'rag', name: 'Drap o paper sobre terra llis', cat: 'home', provides: ['slider_surface'], subs: [], fields: [], defaults: {}, equiv: 'Lliscadors (sliders).' },
  {
    id: 'chair', name: 'Cadira robusta (sense rodes)', cat: 'home', provides: ['chair', 'box_or_step'],
    subs: [
      { cap: 'bench_flat', rule: 'notBarbell', note: 'Cadira robusta com a banc baix (només pes moderat)' },
      { cap: 'dip_station', rule: 'benchDip', note: 'Fons a la cadira' },
    ],
    fields: [{ key: 'qty', label: 'Quantitat', type: 'number', level: 2 }],
    defaults: { qty: 1 }, safety: 'Recolzada contra la paret.',
  },
  { id: 'table', name: 'Taula robusta', cat: 'home', provides: ['table'], subs: [{ cap: 'low_bar', note: 'Rem invertit sota una taula robusta' }], fields: [], defaults: {}, safety: 'Comprova que no bolca.' },
  { id: 'sofa', name: 'Sofà pesat', cat: 'home', provides: ['sofa'], subs: [{ cap: 'foot_anchor', note: 'Peus sota el sofà' }], fields: [], defaults: {} },
  { id: 'step', name: 'Esglaó / escala', cat: 'home', provides: ['box_or_step', 'stairs'], subs: [], fields: [], defaults: {} },
  { id: 'wall', name: 'Paret', cat: 'home', provides: ['wall'], subs: [], fields: [], defaults: {} },
  { id: 'door', name: 'Porta i marc', cat: 'home', provides: ['door'], subs: [], fields: [], defaults: {}, safety: 'Porta tancada cap a tu i comprova el pom.' },
  {
    id: 'pallets', name: 'Palets', cat: 'home', provides: ['pallets'],
    subs: [{ cap: 'plyo_box', note: 'Plataforma de palets en lloc de caixa' }, { cap: 'box_or_step', note: 'Palets com a esglaó' }],
    fields: [{ key: 'qty', label: 'Quantitat', type: 'number', level: 2 }],
    defaults: { qty: 2 }, safety: 'Ben fixats; manta o matalàs a sobre si fa de plint.',
  },
  { id: 'tire', name: 'Pneumàtic gran', cat: 'home', provides: ['tire'], subs: [], fields: [{ key: 'kg', label: 'Pes aproximat', type: 'number', unit: 'kg', level: 2 }], defaults: { kg: 80 } },
  { id: 'sledgehammer', name: 'Mall / maça', cat: 'home', provides: ['sledgehammer'], subs: [], fields: [{ key: 'kg', label: 'Pes', type: 'number', unit: 'kg', level: 2 }], defaults: { kg: 5 } },
  { id: 'logs_stones', name: 'Troncs / pedres', cat: 'home', provides: ['stones'], subs: [{ cap: 'sandbag', rule: 'carry', note: 'Tronc o pedra en lloc de sandbag' }], fields: [{ key: 'kg', label: 'Pes aproximat', type: 'number', unit: 'kg', level: 2 }], defaults: { kg: 30 } },
  {
    id: 'buckets', name: 'Galledes', cat: 'home', provides: ['buckets'],
    subs: [{ cap: 'jug', rule: 'carry', note: 'Galledes per al passeig del granger' }],
    fields: [
      { key: 'volumeL', label: 'Volum', type: 'number', unit: 'L', level: 2 },
      { key: 'qty', label: 'Quantitat', type: 'number', level: 2 },
      { key: 'content', label: 'Contingut', type: 'select', level: 2, options: [{ value: 'water', label: 'Aigua (1 kg/L)' }, { value: 'sand', label: 'Sorra seca (≈1,5 kg/L)' }] },
    ],
    defaults: { volumeL: 10, qty: 2, content: 'water' },
    load: { implement: 'jug', kind: 'fillable' },
  },
  { id: 'thick_rope', name: 'Corda gruixuda', cat: 'home', provides: ['battle_rope'], subs: [], fields: [{ key: 'lengthM', label: 'Longitud', type: 'number', unit: 'm', level: 3 }], defaults: { lengthM: 10 } },
  { id: 'tree_branch', name: 'Branca d\'arbre forta', cat: 'home', provides: ['tree_branch'], subs: [{ cap: 'pullup_bar', note: 'Branca forta en lloc de barra de dominades' }], fields: [], defaults: {} },
  {
    id: 'park', name: 'Parc urbà / infantil', cat: 'home', provides: ['park'],
    subs: [
      { cap: 'pullup_bar', note: 'Barra del parc' },
      { cap: 'dip_station', note: 'Paral·leles del parc' },
      { cap: 'low_bar', note: 'Barra baixa del parc' },
      { cap: 'bench_flat', rule: 'notBarbell', note: 'Banc del parc' },
      { cap: 'box_or_step', note: 'Banc o esglaó del parc' },
    ],
    fields: [], defaults: {},
  },
  { id: 'hill', name: 'Pujada / costa · escales · platja', cat: 'home', provides: ['run_space', 'hill', 'stairs'], subs: [], fields: [{ key: 'lengthM', label: 'Longitud', type: 'number', unit: 'm', level: 3 }], defaults: { lengthM: 50 } },
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

export function getCatalogItem(id) {
  return CATALOG_BY_ID[id];
}

/** Atributs efectius d'un element d'inventari (per defecte + els de l'usuari). */
export function itemAttrs(item) {
  const c = CATALOG_BY_ID[item.catalogId];
  return { ...(c?.defaults || {}), ...(item.attrs || {}), ...(item.qty != null ? { qty: item.qty } : {}) };
}

/** Capacitats directes que dona un element segons els seus atributs. */
export function itemProvides(item) {
  const c = CATALOG_BY_ID[item.catalogId];
  if (!c) return [];
  const a = itemAttrs(item);
  return [...c.provides, ...(c.extraProvides ? c.extraProvides(a) : [])];
}

// Caselles de la vista ràpida (com l'original): cada una afegeix/treu uns elements amb valors per defecte.
export const QUICK_TILES = [
  { id: 'barbell', name: 'Barra', icon: 'barbell', items: ['barbell_olympic', 'plates', 'rack', 'bench_adjustable'] },
  { id: 'dumbbells', name: 'Mancuernes', icon: 'dumbbell', items: ['dumbbells_fixed', 'bench_adjustable'] },
  { id: 'bodyweight', name: 'Pes corporal', icon: 'body', items: ['pullup_bar', 'dip_station', 'mat'] },
  { id: 'machine', name: 'Màquina', icon: 'machine', items: ['smith', 'leg_press', 'hack_squat', 'leg_extension', 'leg_curl', 'lat_pulldown', 'seated_row', 'pec_deck', 'chest_press', 'shoulder_press', 'assisted_pullup_dip', 'back_extension', 'adductor_abductor', 'calf_machine', 'hip_thrust_machine', 'lever_machines'] },
  { id: 'kettlebells', name: 'Kettlebells', icon: 'kettlebell', items: ['kettlebells'] },
  { id: 'cables', name: 'Politges', icon: 'cable', items: ['cable_station'] },
  { id: 'bands', name: 'Gomes', icon: 'band', items: ['tube_bands', 'power_bands', 'minibands'] },
];

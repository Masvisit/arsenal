# Arsenal — Especificació

> Nom provisional: **Arsenal** (el meu arsenal = el material que tinc). Repo: `Masvisit/arsenal`. Carpeta local: `C:\dev\arsenal`.
> Usuari: l'Àlex (26 anys, 85 kg, 1,86 m, intermedi). Prepara les proves físiques d'Agent Rural (Catalunya) i entrena al gimnàs 3–4 dies/setmana, però també a casa, al jardí i al parc.

---

## 0. Objectiu

Replicar el generador d'entrenaments de MuscleWiki (flux a `docs/referencia/`), amb una diferència clau: **el material es pot detallar tant com vulgui** (quins pesos exactes tinc, quins discs, quines màquines, quines coses casolanes) i l'app em diu **què fer per treballar el que vull amb el que tinc de veritat**, incloent-hi la càrrega concreta que puc muntar.

L'original només deixa marcar 7 categories genèriques (Barbell, Dumbbells, Bodyweight, Machine, Kettlebells, Cables, Band) i amaga 5 de 6 exercicis darrere d'un mur de pagament. Aquí: tot visible, tot local, tot gratis.

---

## 1. Flux de referència (què fa l'original, pantalla per pantalla)

| Captura | Pantalla | Què hi ha |
|---|---|---|
| 01 | Crear | Títol "How do you want to train?" + 3 targetes: **Generar l'entrenament d'avui** (ràpid, ~30 s, una sessió) · **Generar pla setmanal** (recomanat, 3–6 dies, progressiu) · **Construir manualment** (control total, biblioteca, mapa muscular en directe, desat automàtic) |
| 02 | Construir manualment | Botó "Obrir constructor" + previsualització del mapa muscular (frontal/posterior, gradient baix→alt volum, ratllat = motor principal) |
| 03–10 | Assistent de 6 passos | Barra superior amb 6 icones (✓ quan estan fets) i botons fixos a baix "Enrere" / "Següent" |
| 03 | Pas 1 | Tipus de cos: Home / Dona |
| 04 | Pas 2 | Edat: número gran + slider 13–100 |
| 05 | Pas 3 | Objectiu: Perdre pes · Guanyar força · Guanyar múscul |
| 06–07 | Pas 4 | Nivell: Novell · Principiant · Intermedi · Avançat, cadascun amb botó ⓘ que obre un modal amb referències (mesos entrenant, temps a la milla, dominades, flexions, press banca/esquat/pes mort × pes corporal) |
| 08 | Pas 5 | Material: graella de 8 caselles (Tot · Barra · Mancuernes · Pes corporal · Màquina · Kettlebells · Politges · Gomes), multiselecció, comptador "N seleccionats" |
| 09–10 | Pas 6 | Músculs: mapa corporal on es toquen els músculs (es pinten), comptador "N músculs seleccionats", desplegable **Grups** amb presets; botó gran "Generar" |
| 11 | Generant | Animació "Construint el teu entrenament… analitzant objectius" amb barra de progrés |
| 12 | Resultat | Títol ("Entrenament d'abdominals"), xips Nivell · Nº exercicis · Objectiu, botó 🔄 regenerar, mapa frontal+posterior amb **gradient de fatiga** (groc→vermell) |
| 13 | Targeta d'exercici | Vídeo en bucle, nom, material, Sèrie 1/2/3 × reps, botó 🔄 canviar exercici, mini-mapa amb els músculs implicats; botó fix "Desar entrenament" |

Presets del desplegable Grups (traduïts):
- Empenta tren superior: deltoide lateral, tríceps, pit, deltoide anterior
- Tracció tren superior: bíceps, trapezi (mig), dorsals, deltoide posterior
- Empenta tren inferior: bessons, glutis, quàdriceps
- Tracció tren inferior: bessons, glutis, isquiotibials
- Core: lumbars, abdominals, oblics
- Braços: bíceps, tríceps
- Espatlles: deltoide anterior, deltoide posterior
- Cos sencer: glutis, isquios, dorsals, quàdriceps, pit, deltoides
- **(nou) Proves Agent Rural**: pit, tríceps, deltoide anterior, quàdriceps, glutis, bessons, core

---

## 2. Què canvia respecte l'original

1. **Llocs amb inventari propi.** Tinc diversos llocs (Gimnàs, Casa, Jardí, Parc…) i cadascun té el seu material detallat. Al generar, primer tries "On entrenes avui?".
2. **Material detallat**, amb tres nivells de detall per element: només marcar que el tinc → indicar quantitats/pesos → atributs avançats (pes de la barra, discs per parells, angles del banc, alçades de la caixa…).
3. **Càrrega concreta** a cada exercici, arrodonida a una càrrega que realment puc muntar ("Barra 20 + 2×10 + 2×5 = 50 kg").
4. **Adaptació quan el material es queda curt**: si no tinc prou pes per a l'objectiu, l'app canvia l'estratègia (unilateral, tempo, pauses, més reps…) i m'explica per què.
5. **Material casolà i rudimentari** amb equivalències (garrafa de 8 L de sorra ≈ kettlebell de 12 kg, motxilla amb llibres ≈ armilla llastrada…).
6. **"Què em falta?"**: rànquing del material que més exercicis o rang de càrregues em desbloquejaria, amb alternativa casolana.
7. **Perfil desat**: l'assistent sencer només es fa la primera vegada. Després, "Generar avui" només pregunta lloc, temps i músculs.
8. **Temps disponible i limitacions** (lesions/molèsties) com a passos nous.
9. **Mode entrenament en directe** amb registre de sèries, temporitzador de descans amb so i historial (Fase 2).
10. **Res bloquejat**: tots els exercicis visibles.

---

## 3. Arquitectura

### Stack
React 18 · Vite 5 · Tailwind CSS 3 · Zustand (`persist`) · react-router-dom (HashRouter, per GitHub Pages) · vite-plugin-pwa · react-body-highlighter (MIT, models `anterior`/`posterior`, `onClick` per múscul i colors per freqüència) · Vitest.
Desplegament: GitHub Pages amb GitHub Actions (`base: '/arsenal/'` a `vite.config.js`).

### Estructura de carpetes
```
C:\dev\arsenal\
├─ CLAUDE.md
├─ docs\ (ESPECIFICACIO.md, DECISIONS.md, referencia\, captures\)
├─ scripts\
│  ├─ fetch-exercises.mjs        → baixa free-exercise-db a public\data\exercises.json
│  └─ audit-requirements.mjs     → informe d'exercicis mapejats / sense mapejar
├─ public\data\exercises.json
├─ src\
│  ├─ core\            ← JS pur, sense React, amb tests *.test.js al costat
│  │  ├─ catalog.js         catàleg de material (secció 5)
│  │  ├─ inventory.js       llocs, plantilles, capacitats d'un lloc
│  │  ├─ loads.js           càrregues possibles i arrodoniment
│  │  ├─ requirements.js    què necessita cada exercici
│  │  ├─ muscles.js         mapping músculs dataset ↔ mapa corporal, grups
│  │  ├─ prescription.js    sèries/reps/descans/RIR per objectiu i nivell
│  │  ├─ adaptations.js     estratègies quan falta càrrega
│  │  ├─ generator.js       generador (secció 7)
│  │  ├─ fatigue.js         mapa de fatiga i de recuperació
│  │  ├─ progression.js     doble progressió i descàrregues (Fase 2)
│  │  └─ missing.js         "Què em falta?" (Fase 2)
│  ├─ data\
│  │  ├─ custom-exercises.json
│  │  ├─ templates.json            plantilles d'inventari
│  │  └─ i18n\ (exercise-names.ca.json, instructions.ca.json, labels.ca.json)
│  ├─ store\ (profileStore.js, inventoryStore.js, workoutStore.js, historyStore.js)
│  ├─ components\ (BodyMap, Stepper, EquipmentTile, ExerciseCard, LoadChip, RestTimer…)
│  └─ pages\ (Home, Create, Wizard, Equipment, Location, Result, Live, Library, History, WeeklyPlan, Missing, Profile)
└─ .github\workflows\deploy.yml
```

### Rutes
`/` Inici · `/crear` · `/assistent/:pas` · `/material` i `/material/:llocId` · `/entrenament/:id` (resultat) · `/entrenament/:id/fer` (en directe) · `/biblioteca` · `/historial` · `/pla` · `/que-em-falta` · `/perfil`

### Dades persistides (totes amb `schemaVersion` per a migracions)
```js
Profile   { schemaVersion, sex, age, bodyWeightKg, heightCm, goal, level, limitations[], referenceLifts{}, defaultLocationId }
Location  { id, name, kind: 'gym'|'home'|'garden'|'park'|'outdoor', constraints{ noJumps, lowCeiling, fragileFloor, runSpaceM }, items: [{ catalogId, qty?, attrs{} }] }
Workout   { id, createdAt, locationId, goal, level, targetMuscles[], durationMin, seed, warmup[], exercises: [WorkoutExercise], notes }
WorkoutExercise { exerciseId, slot, sets: [{ reps|seconds, loadKg?, loadSetup?, rir? }], restSec, tempo?, adaptations[], equipmentUsed[] }
SessionLog { id, workoutId, startedAt, endedAt, sets: [{ exerciseId, setIndex, reps, loadKg, rir, done }] }
```
Exportar / importar tot com un JSON (Perfil → "Còpia de seguretat").

---

## 4. Dades d'exercicis

### 4.1 Font
- **free-exercise-db** (domini públic, Unlicense): `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json` → 876 exercicis.
- Camps: `id, name, force, level (beginner|intermediate|expert), mechanic (compound|isolation), equipment, primaryMuscles[], secondaryMuscles[], instructions[], category (strength|stretching|plyometrics|powerlifting|olympic weightlifting|strongman|cardio), images[2]`.
- Imatges: prefix `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/` + `images[i]`. Cada exercici té 2 fotos (posició inicial i final): **alterna-les cada ~800 ms** per fer l'efecte "vídeo en bucle". Cache amb el service worker (CacheFirst) perquè funcionin sense connexió un cop vistes.
- `scripts/fetch-exercises.mjs` la baixa i la desa a `public/data/exercises.json` (s'executa a `npm run data`, i el JSON es versiona al repo).

### 4.2 Traduccions (es fan una sola vegada durant el desenvolupament, no en temps d'execució)
- `exercise-names.ca.json`: nom en català dels 876 exercicis (fes-ho tu en lots, revisant la terminologia: "press de banca", "esquat", "pes mort", "rem", "dominades", "fons", "jaló al pit", "curl femoral", "elevació de bessons", "hip thrust"…).
- `instructions.ca.json`: instruccions en català dels exercicis marcats com a `core` (els ~150–200 més habituals que fa servir el generador). La resta mostra les instruccions en anglès amb una etiqueta "EN".
- `labels.ca.json`: músculs, material, categories, nivells, objectius.

### 4.3 Músculs (`core/muscles.js`)
Dataset (17) → slugs de react-body-highlighter:

| Dataset | Mapa | Nom català |
|---|---|---|
| chest | chest | Pit |
| shoulders | front-deltoids + back-deltoids | Deltoides |
| biceps | biceps | Bíceps |
| triceps | triceps | Tríceps |
| forearms | forearm | Avantbraços |
| abdominals | abs (+ obliques visual) | Abdominals |
| lats | upper-back | Dorsals |
| middle back | upper-back | Esquena mitja (romboides) |
| traps | trapezius | Trapezi |
| lower back | lower-back | Lumbars |
| glutes | gluteal | Glutis |
| quadriceps | quadriceps | Quàdriceps |
| hamstrings | hamstring | Isquiotibials |
| calves | calves (+ left-soleus/right-soleus al posterior) | Bessons |
| adductors | adductor | Adductors |
| abductors | abductors | Abductors |
| neck | neck | Coll |

Matisos que cal resoldre per paraules clau del nom:
- Tocar **deltoide anterior** → `shoulders`, preferència per empentes ("Press", "Front Raise"). Tocar **deltoide posterior** → `shoulders`, preferència per "Rear Delt", "Face Pull", "Reverse Fly". Deltoide lateral: "Lateral Raise", "Upright Row".
- Tocar **oblics** → `abdominals`, preferència per "Oblique", "Side", "Russian Twist", "Woodchop", "Pallof".
- Tocar **upper-back** → selecciona `lats` + `middle back`.

### 4.4 Requisits de cada exercici (`core/requirements.js`) — la part més important
Cada exercici declara **capacitats** que necessita, no categories genèriques. Un lloc ofereix capacitats segons el seu material (secció 5). Un exercici és realitzable si el lloc cobreix tots els seus requisits (directament o per substitució permesa).

Capacitats (ids en anglès al codi):
`barbell, plates, rack, bench_flat, bench_incline, bench_decline, dumbbells, kettlebell, cable_high, cable_low, bands_loop, bands_tube, band_anchor, pullup_bar, dip_station, rings_or_suspension, high_anchor, low_bar (rem invertit), box_or_step, plyo_box, wall, slider_surface, foot_anchor (nòrdics), medicine_ball, fitball, ab_wheel, landmine, sled, sandbag, weight_vest, jump_rope, hurdles, mat, run_space, machine:<id>`.

Regles base per `equipment` del dataset (+ paraules clau del nom):
- `barbell` → `barbell + plates`. Si el nom conté "Bench" → `+ bench_flat` (Incline → `bench_incline`, Decline → `bench_decline`) i `+ rack`. Si conté "Squat" (no "Jump") o és un press de peu pesat → `+ rack`.
- `dumbbell` → `dumbbells` (fixes, ajustables o selector). "Bench"/"Incline"/"Decline" → banc corresponent.
- `kettlebells` → `kettlebell`.
- `cable` → `cable_high` o `cable_low` segons el moviment ("Pulldown", "Pushdown", "Face Pull" → alt; "Seated Row", "Curl" → baix).
- `machine` → `machine:<id>` per paraules clau ("Leg Press" → premsa de cames, "Leg Extension" → extensió de quàdriceps, "Leg Curl" → curl femoral, "Pulldown" → jaló, "Smith" → Smith, "Pec Deck"/"Butterfly" → contractor, "Hack Squat" → hack, "Calf" + machine → màquina de bessons…).
- `body only` → cap, excepte paraules clau: "Pull-up/Chin-up/Hanging" → `pullup_bar`; "Dip" → `dip_station`; "Inverted Row" → `low_bar`; "Handstand" → `wall`; "Step-up" → `box_or_step`; "Box Jump" → `plyo_box`.
- `bands` → `bands_loop` o `bands_tube + band_anchor`; `medicine ball` → `medicine_ball`; `exercise ball` → `fitball`; `foam roll` → foam roller; `e-z curl bar` → barra EZ (o barra recta com a substitució).
- `other` (122) i `null` (77) → classificació manual per nom. Revisa-les una per una.
- Categories `plyometrics` i salts → excloses si el lloc té `noJumps`. Press per sobre del cap amb barra → exclòs si `lowCeiling`.

**Substitucions permeses** (marquen l'exercici com a "Adaptat" i ho diuen a la targeta):
- Mancuernes ← kettlebells, garrafes amb nansa, ampolles grans (només moviments controlats: goblet, rem, curl, pes mort romanès, farmer's walk; **mai** swings ni arrencades amb aigua dins).
- Kettlebell ← mancuerna (swing agafant-la pel disc), garrafa de sorra ben tancada (goblet, rem, carries).
- Politja ← goma tubular amb ancoratge de porta (alt/baix) o politja casolana.
- Banc pla ← caixa estable o cadira robusta (només pes moderat); `bench_incline` ← banc pla + suport estable sota un extrem (avís de seguretat).
- `low_bar` ← barra de Smith/rack a baixa alçada, anelles/TRX, taula robusta (rem invertit a sota), barra de parc.
- `pullup_bar` ← rig, barra de parc, branca forta, anelles/TRX pengats alt.
- `dip_station` ← dues cadires robustes / banc (fons a banc), paral·leles de parc.
- `weight_vest` ← motxilla carregada.
- `sandbag` ← sac casolà.
- `slider_surface` ← drap o tovallola sobre terra llis.
- `foot_anchor` ← sofà pesat, espatllera, company.
- `hurdles` ← pal d'escombra sobre dues cadires/galledes (cau si el toques).

`scripts/audit-requirements.mjs` ha d'imprimir: total realitzables per plantilla (Gimnàs complet / Casa bàsica / Parc / Només pes corporal / Casolà), i la llista d'exercicis `strength` o `plyometrics` sense mapejar. **Criteri: ≥ 90 % dels `strength` + `plyometrics` mapejats**; la resta, exclosos explícitament amb motiu.

### 4.5 Exercicis propis (`custom-exercises.json`)
Mateix esquema que el dataset + `requires[]`, `pattern`, `substituteFor?`, `safety?`. Sense fotos: la targeta mostra el mapa muscular gran en lloc de la imatge. Mínim aquests (~35):

Material casolà:
- Esquat goblet amb garrafa · Rem a una mà amb garrafa · Pes mort romanès amb garrafes · Hip thrust amb motxilla/garrafa · Farmer's walk amb garrafes o galledes · Bear hug carry amb sac casolà · Esquat amb sac casolà a l'espatlla
- Flexions amb motxilla · Dominades amb motxilla · Fons amb motxilla · Esquat búlgar amb motxilla (peu a la cadira)
- Rem invertit sota una taula robusta · Rem amb tovallola a la porta (porta tancada, cap a tu) · Rem isomètric amb tovallola
- Curl femoral lliscant amb drap · Body saw amb drap · Escaladors lliscants · Gambada enrere lliscant
- Nòrdics amb els peus sota el sofà · Flexions declinades amb peus a la cadira · Fons de tríceps a la cadira · Step-up a la cadira/esglaó · Elevació de bessons a una cama a l'esglaó · Wall sit · Flexions pike · Pino recolzat a la paret
- Bolcar pneumàtic · Cops de mall al pneumàtic · Arrossegar pneumàtic amb corda (trineu casolà) · Ones amb corda gruixuda lligada a un arbre/columna · Salts a una plataforma de palets

Proves Agent Rural (components de força i potència; navette i piscina són de PITU):
- **Press banca a ritme de prova**: 40 kg amb metrònom (1 rep cada ~1,6 s ≈ 28 reps en 45 s)
- **Press banca EMOM 40 kg** (cada minut, X reps)
- **Test press banca**: màximes reps a 40 kg en 45 s (es registra a l'historial com a test)
- Salts de tanca amb peus junts (progressió d'alçada fins a 90 cm) · Pas per sota de tanca (mobilitat de maluc, "duck walk") · Tombarella endavant al matalàs (tècnica, amb les dues mans) · Sprints curts de 5–10 m amb canvis de direcció (requereix `run_space`)

---

## 5. Inventari detallat (`core/catalog.js` + `templates.json`)

### 5.1 Llocs
- Cada lloc: nom, tipus, icona, **restriccions** (sense salts / sostre baix / terra delicat — no deixar caure pes / metres lliures per córrer) i llista d'elements.
- Plantilles per començar ràpid: **Gimnàs complet**, **Casa bàsica**, **Parc de cal·listènia**, **Només pes corporal**, **Casolà** (garrafes, motxilla, cadira, tovallola, drap). Es poden duplicar i editar.
- Llocs inicials suggerits: "Gimnàs", "Casa", "Jardí" (≈20 m², allargat), "Parc".

### 5.2 Tres nivells de detall per element
1. **Ràpid**: casella on/off (com l'original).
2. **Quantitats**: quants n'hi ha i quins pesos (xips de pes editables).
3. **Avançat**: atributs específics (taula de sota).

### 5.3 Catàleg

**A. Pes lliure**
| Element | Atributs | Notes |
|---|---|---|
| Mancuernes fixes | llista de pesos (kg), parell sí/no | |
| Mancuernes ajustables de disc | pes de la maneta, discs {pes, quantitat} | per fer parell, els discs es reparteixen entre dues manetes |
| Mancuernes de selector | mínim, màxim, increment | |
| Barra olímpica | pes (20 kg per defecte) | Ø 50 mm |
| Barra estàndard | pes (~7–10 kg) | Ø 28 mm (els discs han de coincidir) |
| Barra EZ | pes | |
| Barra hexagonal (trap bar) | pes | **pro** |
| Barra multiagafada (swiss) / Safety squat bar | pes | **pro** |
| Discs | {pes, quantitat}, diàmetre (olímpic/estàndard) | |
| Kettlebells | llista de pesos | |
| Armilla llastrada | kg (ajustable sí/no) | |
| Turmelleres / canelleres de pes | kg | |
| Cinturó de llast amb cadena | — | **pro** |
| Pilota medicinal / wall ball / slam ball | kg | |
| Sandbag / sac búlgar | kg | |

**B. Bancs i estructures**
| Element | Atributs |
|---|---|
| Banc pla | amb suports per a barra sí/no |
| Banc ajustable | angles disponibles (0/15/30/45/60/90), declinat sí/no |
| Suports d'esquat / mitja gàbia / power rack | safeties sí/no, barra de dominades integrada sí/no |
| Barra de dominades | tipus (porta / paret / sostre / rig), es poden penjar anelles sí/no |
| Paral·leles (estació de fons) · Paralletes | — |
| Anelles · Suspensió (TRX) | punt d'ancoratge disponible |
| Landmine | — (substitut: extrem de la barra a la cantonada de la paret amb una tovallola) |
| Espatllera | — |

**C. Gomes i accessoris**
| Element | Atributs |
|---|---|
| Minibands | colors i resistència aproximada |
| Gomes llargues (power bands) | amplada → resistència aproximada (editable) |
| Gomes tubulars amb mànecs + ancoratge de porta | resistència |
| Roda abdominal · Fitball (Ø) · Bosu · Foam roller | — |
| Corda de saltar · Escala d'agilitat · Cons | — |
| Tanques | alçades regulables (cm) → rellevant per a la tanca de 90 cm del circuit |
| Caixa pliomètrica / step | alçades (cm) |
| Matalàs / colxoneta · Plint | — |

**D. Màquines de gimnàs** (cada una: increment de placa i pes màxim)
Estació de politges (alta/baixa) · Crossover · Smith · Premsa de cames (45° / horitzontal) · Hack squat · Extensió de quàdriceps · Curl femoral (estirat / assegut) · Jaló al pit · Rem assegut · Contractor (pec deck) · Press de pit en màquina · Press d'espatlles en màquina · Dominades i fons assistits · Màquina de hip thrust · Banc de lumbars 45° / GHD · Adductors / abductors · Bessons (de peu / assegut) · **Pro:** belt squat, pendulum squat, reverse hyper, trineu (sled).
Cardio: cinta, bici, el·líptica, remadora, air bike, SkiErg, escaladora.

**E. Rudimentari / casolà** (cada un amb equivalència i avís de seguretat)
| Element | Atributs | Equival a | Avís |
|---|---|---|---|
| Garrafa d'aigua | volum (L), contingut (aigua 1 kg/L · sorra seca ≈1,5 kg/L), quantitat | mancuerna / kettlebell | mai per a swings ni moviments balístics |
| Ampolles plenes | volum, contingut | mancuerna lleugera | |
| Motxilla carregada | kg (llibres, sorra, ampolles) | armilla llastrada / càrrega frontal | tirants ben ajustats, càrrega compacta |
| Sac casolà | kg (sorra en bosses dobles dins una bossa de lona) | sandbag | |
| Pal d'escombra / PVC | — | tècnica, mobilitat, tanca casolana | |
| Tovallola | — | rem a la porta, isomètrics, lliscador | porta tancada cap a tu, comprova el pom |
| Drap o paper sobre terra llis | — | sliders | |
| Cadira robusta (sense rodes) | — | banc baix, step, fons | contra la paret |
| Taula robusta | — | rem invertit | comprova que no bolca |
| Esglaó / escala | — | step, bessons, flexions declinades, sprints | |
| Paret · Porta i marc | — | pino, wall sit, isomètrics | |
| Palets | quants | plataforma de salts, plint casolà, banc | ben fixats; manta/matalàs a sobre si és plint |
| Pneumàtic gran | kg aprox. | bolcades, salts, objectiu del mall | |
| Mall / maça | kg | potència i core | |
| Troncs · Pedres | kg aprox. | carries, press de tronc, atlas casolana | |
| Galledes | volum, contingut | farmer's walk | |
| Corda gruixuda | longitud | battle rope, trineu casolà | |
| Branca d'arbre forta | — | barra de dominades | |
| Parc urbà / infantil | barres, bancs | barra, banc, `low_bar` | |
| Pujada / costa · Escales públiques · Platja | longitud, pendent | sprints, carries, `run_space` | |

### 5.4 Càrregues possibles (`core/loads.js`)
- **Barra**: `pesBarra + 2 × (suma de qualsevol subconjunt de parells de discs)`. Els parells per pes = `floor(quantitat/2)`. Llista ordenada i sense duplicats.
- **Mancuernes ajustables**: igual, per maneta; si es vol parell, cada maneta rep la meitat dels discs.
- **Fixes / kettlebells**: la llista.
- **Selector**: de mínim a màxim en increments.
- **Màquines**: de l'increment al màxim.
- **Garrafes/motxilla**: rang continu de 0 al màxim (mostra-ho com "omple-la fins a ~X L").
- `nearestAchievable(targetKg, opcions)` → `{ kg, setup: 'Barra 20 + 2×10 + 2×5', diff }`. Arrodoneix cap avall excepte si la diferència cap amunt és ≤ 2,5 %.
- **Test obligatori**: barra de 20 kg + discs només de 5 kg en amunt (com al meu gimnàs) → només surten càrregues en salts de 10 kg (20, 30, 40, 50…). Mai "17,5 kg per costat".

---

## 6. Perfil i assistent

Primera vegada: assistent complet. Després, "Generar avui" salta directament a **Lloc → Temps → Músculs** (amb opció "Canviar perfil").

Passos (barra superior amb icones, botons fixos Enrere/Següent, com a la referència):
1. **Cos**: sexe (afecta les referències de nivell), edat (slider 14–90), pes corporal (kg), alçada (opcional).
2. **Objectiu**: Guanyar múscul · Guanyar força · Perdre greix · Resistència muscular · Potència i explosivitat · **Proves Agent Rural**.
3. **Nivell**: Novell · Principiant · Intermedi · Avançat, amb ⓘ (text propi, valors orientatius):
   - Novell: 0–3 mesos entrenant · < 5 flexions · 0 dominades
   - Principiant: 3–9 mesos · 5–15 flexions · 1–4 dominades · press banca ≈ 0,6–0,8 × pes corporal
   - Intermedi: 9–24 mesos · 15–30 flexions · 5–12 dominades · press banca ≈ 1 × PC · esquat ≈ 1,25 × PC · pes mort ≈ 1,5 × PC
   - Avançat: > 2 anys · 30+ flexions · 12+ dominades · press banca ≥ 1,25 × PC · esquat ≥ 1,75 × PC · pes mort ≥ 2 × PC
   - Opcional: "Calcula'l per mi" a partir dels aixecaments de referència.
4. **On i amb què**: tria un lloc (o crea'n un des d'una plantilla). Vista ràpida de caselles com l'original + botó "Detallar" que obre l'editor del lloc.
5. **Temps i limitacions**: durada (20 / 30 / 45 / 60 / 75 / 90 min) · molèsties (espatlla, colze, canell, lumbar, genoll, turmell) → exclouen o substitueixen exercicis de risc.
6. **Músculs**: mapa frontal i posterior tocable (ambdós visibles a la vegada en pantalla ampla; pestanyes Frontal/Posterior al mòbil) + desplegable Grups + comptador + botó gran **Generar**.

Aixecaments de referència (opcionals, al Perfil): press banca, esquat, pes mort, press militar, rem; dominades i flexions màximes; **reps a 40 kg en 45 s**. S'entren com "X kg × Y reps" i es calcula l'1RM estimat (Epley: `kg × (1 + reps/30)`, només fins a 10 reps).

---

## 7. Generador (`core/generator.js`) — determinista, sense IA

Entrades: perfil, lloc (capacitats + càrregues), músculs objectiu, durada, historial recent, `seed`.

1. **Pool**: exercicis realitzables al lloc (secció 4.4), de nivell adequat (Novell/Principiant → `beginner`; Intermedi → `beginner`+`intermediate`; Avançat → tots), sense conflicte amb limitacions ni restriccions, de categoria coherent amb l'objectiu (`strength` sempre; `plyometrics` per a Potència i Agent Rural; `stretching` només a escalfament/tornada a la calma; `powerlifting`/`olympic`/`strongman` només Avançat i amb el material).
2. **Nombre d'exercicis** segons durada i objectiu (orientatiu): 20′→3 · 30′→4 · 45′→5 · 60′→6 · 75′→7 · 90′→8 (menys si l'objectiu és Força, pels descansos llargs).
3. **Plantilla de franges**: (a) compost principal del grup muscular més gran seleccionat → (b) segon compost d'un altre grup → (c) accessoris/aïllament fins a cobrir tots els músculs seleccionats → (d) core o finisher si s'escau. Cada múscul seleccionat ha d'aparèixer com a principal almenys una vegada si hi ha franges; si no, avisa de quins s'han quedat fora.
4. **Puntuació** de cada candidat per franja:
   - +5 si el múscul principal és l'objectiu de la franja · +2 per cada secundari seleccionat · −3 si el principal no està seleccionat
   - +3 compost a les franges (a)/(b) · +2 si fa servir càrrega externa i l'objectiu és força o múscul
   - −4 si el mateix múscul principal s'ha treballat fort fa < 48 h (historial) · −2 si repeteix patró de moviment ja triat
   - +2 si és `core` (llista curada) · −1 si és "Adaptat" · soroll aleatori ±1,5 amb la `seed`
5. **Prescripció** (secció 8) i **càrrega** concreta.
6. **Escalfament** automàtic (5–8 min: general + sèries d'aproximació del primer exercici) i tornada a la calma opcional.
7. **Durada estimada**: Σ sèries × (reps × 3 s + descans) + escalfament.

Accions al resultat: 🔄 **canviar exercici** (següent millor candidat de la mateixa franja, mai un de ja triat) · 🔄 **regenerar tot** (nova `seed`) · **bloquejar** un exercici abans de regenerar.

---

## 8. Prescripció i adaptació

### 8.1 Esquemes per objectiu (punt de partida, editables a `prescription.js`)
| Objectiu | Compostos | Aïllament / accessoris | Descans |
|---|---|---|---|
| Guanyar múscul | 3–4 × 6–10, RIR 1–3 | 2–4 × 10–15 (fins a 20), RIR 0–2 | 90–150 s / 60–90 s |
| Guanyar força | 3–5 × 3–6, RIR 1–3 | 3 × 6–10 | 2–4 min |
| Perdre greix | superseries o circuit 2–4 × 10–15 | idem | 30–60 s |
| Resistència muscular | 2–3 × 15–25+ | idem | 30–60 s |
| Potència | 3–5 × 3–5 explosives, sempre al principi | — | 2–3 min complets |
| Proves Agent Rural | combina força de press banca + específic a 40 kg + potència de cames + core | | segons bloc |

Nivell: Novell/Principiant → menys sèries (2–3) i més màquines o variants guiades; Avançat → més sèries i tècniques d'intensitat.
Agent Rural (proposta de partida, revisable amb el meu entrenador): força 4 × 5–6 al 75–85 % de l'1RM estimat · específic 3 × 15–20 reps a 40 kg amb metrònom de prova, 2–3 min de descans · EMOM 10′ amb 8–10 reps a 40 kg · test de 45 s cada 3–4 setmanes.

### 8.2 Càrrega
- Si hi ha dades (historial o aixecament de referència de l'exercici o d'un de relacionat): % de l'1RM estimat → `nearestAchievable`. Ràtios aproximades entre exercicis relacionats a `core/ratios.js` (conservadores, marcades com "estimació — ajusta-ho amb el RIR").
- Si no hi ha dades: "Tria el pes que et deixi 2 reps a la recambra" + xips amb les càrregues que pots muntar dins el rang probable.

### 8.3 Quan el material es queda curt (`core/adaptations.js`)
Si la càrrega màxima disponible no arriba al rang de reps de l'objectiu, aplica per aquest ordre i **explica-ho a la targeta** ("Amb 12 kg no arribes a 8 reps al RIR 2 → fem búlgara a una cama i tempo 3-1-1"):
1. Pujar reps dins del rang (per a múscul, fins a 20–30 a prop del fallo)
2. Passar a unilateral (búlgara, rem a una mà, press a una mà)
3. Tempo excèntric lent (3–4 s) i pauses de 2 s a la posició difícil
4. Repeticions 1½
5. Rest-pause / myo-reps
6. Pre-fatiga (aïllament abans del compost)
7. Menys descans / densitat
8. Variant mecànicament més difícil (flexions amb peus elevats, dèficit, pistol assistit, nòrdic)
Per a l'objectiu Força, si no hi ha càrrega: avisa del límit, passa a progressions de pes corporal exigents i enllaça a "Què em falta?".

---

## 9. Resultat i mode en directe

**Resultat** (refs. 12–13): títol automàtic segons els músculs ("Pit, espatlles i tríceps"), xips (nivell · nº exercicis · objectiu · durada estimada · lloc), mapa frontal+posterior amb **gradient de fatiga** (per múscul: Σ sèries × 1 si és principal + Σ sèries × 0,5 si és secundari → 5 nivells groc→taronja→vermell, amb llegenda), llista de targetes:
- Imatge alternant (o mapa gran si és exercici propi) · nom en català · **material concret** ("Mancuernes 12 kg", "Barra 20 + 2×10 = 40 kg", "Garrafa 8 L de sorra ≈ 12 kg") · sèries × reps/temps · descans · RIR · tempo si n'hi ha · mini-mapa · etiqueta "Adaptat" amb motiu · desplegable amb instruccions i "Per què aquest exercici".
- Botó fix a baix: **Desar** i **Començar**.

**Mode en directe** (Fase 2): un exercici per pantalla; per sèrie, xips de càrrega (només les muntables) + comptador de reps + RIR; temporitzador de descans automàtic amb so (Web Audio) i veu opcional (`speechSynthesis`, ca-ES); Wake Lock si el navegador ho permet; resum final (volum per múscul, durada, rècords) que es desa a l'historial.

---

## 10. Construir manualment, historial i extres

- **Biblioteca / constructor**: cercador + filtres (múscul, "només el que puc fer aquí", patró, nivell, material), afegir a l'entrenament, editar sèries/reps, mapa de fatiga en directe, desat automàtic.
- **Historial**: sessions, gràfica d'1RM estimat per exercici, sèries setmanals per múscul.
- **Recuperació muscular**: mapa amb els dies des de l'últim treball de cada múscul → a l'Inici, suggeriment "Avui et toca: esquena i cames".
- **Progressió (doble progressió)**: si totes les sèries arriben al sostre del rang al RIR objectiu → següent càrrega muntable. Si el salt és massa gran (> 10 %, p. ex. de 12 a 16 kg), primer més reps/sèries o tempo i després el salt. Descàrrega cada 4–6 setmanes (−40 % de volum) o si el rendiment baixa dues sessions seguides.
- **Què em falta?**: per a l'objectiu i els músculs habituals, rànquing d'elements del catàleg que no tinc per nombre d'exercicis desbloquejats i millora del rang de càrregues ("Amb un parell de discs de 2,5 kg passaries de salts de 10 kg a salts de 5 kg en press banca"), amb cost orientatiu (€ / €€ / €€€) i alternativa casolana si n'hi ha.
- **Pla setmanal** (Fase 3): dies/setmana (2–6), dies no disponibles, lloc i durada per dia. Divisió: 2–3 dies → cos sencer; 4 → torso/cama ×2; 5 → torso/cama + empenta/tracció/cames; 6 → empenta/tracció/cames ×2. Volum setmanal orientatiu per múscul: novell 6–10 sèries, intermedi 10–16, avançat 12–20, amb freqüència 2×/setmana. Mode Agent Rural: dies reservats com a "Sessió PITU" (piscina / navette / agilitat) i res de cames pesades el dia abans de navette o agilitat.

---

## 11. Disseny

- Fosc per defecte, com la referència: fons `#0f1115`, targetes `#1a1d23`, vores `#2a2f38`, accent blau `#2f5bea`, text `#e8eaed`, secundari `#9aa0a6`. Gradient de fatiga: `#fde047 → #fb923c → #ef4444`. Mode clar opcional.
- Tipografia del sistema (`-apple-system, Inter, …`), títols en negreta i majúscules a l'assistent (com la referència).
- Botons tàctils ≥ 44 px, `safe-area-inset` per a l'iPhone, `100dvh`, res que depengui del hover.
- Responsive: mòbil una columna · tauleta: assistent a l'esquerra i mapa a la dreta · escriptori: contenidor ample amb barra lateral.
- Pantalla Crear amb les 3 targetes i la previsualització del mapa (refs. 01–02).
- Animació "Construint el teu entrenament…" breu (≤ 1,2 s, el càlcul és local).
- Número de versió visible al peu del Perfil.

---

## 12. Fases i criteris d'acceptació

### Fase 1 — Rèplica millorada (MVP)
Scaffold + PWA + desplegament · `npm run data` · traduccions de noms · `core/` (catalog, inventory, loads, requirements, muscles, prescription, adaptations, generator, fatigue) amb tests · assistent de 6 passos · editor de llocs i material amb plantilles · Crear amb les 3 targetes ("Pla setmanal" i "Construir manualment" poden mostrar "Properament") · Resultat complet · Desar entrenaments · Inici amb els entrenaments desats.

Criteris (tots s'han de veure a la UI i tenir test a `core/`):
1. Lloc "Gimnàs" amb barra de 20 kg i un parell de discs de cada pes (5, 10, 15, 20 i 25 kg) → el press banca proposa càrregues en salts de 10 kg i mostra el muntatge.
2. Lloc "Casa" amb només 2 garrafes de 8 L de sorra i una cadira, objectiu Guanyar múscul, músculs de cames → cap exercici demana barra ni màquina; surten goblet/búlgara amb garrafa; si la càrrega es queda curta apareix l'adaptació explicada.
3. Lloc amb "Sense salts" → cap pliometria.
4. 🔄 Canviar substitueix per un exercici realitzable amb el mateix múscul principal; 🔄 Regenerar respecta els bloquejats.
5. Selecció de músculs tocant el mapa i amb Grups; comptador correcte; oblics i deltoides posteriors es comporten com diu la secció 4.3.
6. Tot en català · funciona sense connexió després de la primera càrrega · s'instal·la a l'iPhone (Safari → Compartir → Afegir a la pantalla d'inici).
7. `audit-requirements` ≥ 90 % dels `strength` + `plyometrics` mapejats.
8. Desplegat a https://masvisit.github.io/arsenal/ i verificat.

### Fase 2 — Entrenar i aprendre
Mode en directe · historial · progressió · recuperació muscular a l'Inici · Construir manualment (biblioteca) · Què em falta? · instruccions en català dels exercicis `core`.

### Fase 3 — Planificar
Pla setmanal · mode Proves Agent Rural (metrònom de press banca, test de 45 s, dies "Sessió PITU") · exportar/importar JSON.

### Fase 4 — Unificació (futur)
Integrar dins PITU 2.0 (mateix stack; `src/core/` s'importa tal qual) i Coll. Mantenir els esquemes de dades versionats i l'export JSON compatible.

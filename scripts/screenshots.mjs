// Verificació visual amb Playwright: recorre les pantalles a mòbil, tauleta i escriptori,
// desa captures a docs/captures/ i comprova els criteris d'acceptació des de la interfície.
// Ús: npm run preview (en una altra terminal) && npm run shots
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { weightConflict } from '../src/core/blocks.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'docs', 'captures');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:4173/arsenal/';
const dataset = JSON.parse(readFileSync(join(root, 'public/data/exercises.json'), 'utf8'));
const custom = JSON.parse(readFileSync(join(root, 'src/data/custom-exercises.json'), 'utf8'));
const byId = Object.fromEntries([...dataset, ...custom].map((e) => [e.id, e]));

const VIEWPORTS = {
  mobil: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  tauleta: { width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  escriptori: { width: 1280, height: 800, deviceScaleFactor: 1 },
};

const failures = [];
const passes = [];
function check(cond, msg) {
  (cond ? passes : failures).push(msg);
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
}

const browser = await chromium.launch();
async function newPage(vp, init) {
  const ctx = await browser.newContext({ viewport: { width: VIEWPORTS[vp].width, height: VIEWPORTS[vp].height }, ...VIEWPORTS[vp], locale: 'ca-ES', serviceWorkers: 'block' });
  if (init) await ctx.addInitScript(init.fn, init.arg);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => failures.push(`[${vp}] error de pàgina: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/raw\.githubusercontent|ERR_INTERNET/.test(m.text())) failures.push(`[${vp}] consola: ${m.text()}`); });
  return { ctx, page };
}
const shot = (page, name, opts = {}) => page.screenshot({ path: join(OUT, `${name}.png`), ...opts });
const go = (page, hash) => page.goto(`${BASE}#${hash}`, { waitUntil: 'networkidle' });

// Estat inicial injectat (per als escenaris dels criteris)
function seed({ profile, locations, wizard }) {
  localStorage.setItem('arsenal-profile', JSON.stringify({ state: { profile, completed: true }, version: 1 }));
  if (locations) localStorage.setItem('arsenal-inventory', JSON.stringify({ state: { locations }, version: 1 }));
  if (wizard) sessionStorage.setItem('arsenal-wizard', JSON.stringify({ state: wizard, version: 0 }));
}
const PROFILE = { schemaVersion: 1, sex: 'male', age: 26, bodyWeightKg: 85, heightCm: 186, goal: 'muscle', level: 'intermediate', limitations: [], referenceLifts: {}, defaultLocationId: null };
const item = (catalogId, attrs = {}) => ({ uid: `${catalogId}-1`, catalogId, attrs });
const loc = (id, name, kind, items, constraints = {}) => ({ schemaVersion: 1, id, name, kind, constraints: { noJumps: false, lowCeiling: false, fragileFloor: false, runSpaceM: 0, ...constraints }, items });

async function cardIds(page) {
  return page.$$eval('[data-testid="exercise-card"]', (els) => els.map((e) => e.dataset.exerciseId));
}

// Espera que les fotos visibles de les targetes hagin carregat (són externes i lazy)
async function waitImages(page, card) {
  await card.locator('img').first().waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
  await page.waitForFunction((el) => [...el.querySelectorAll('img')].every((i) => i.complete && i.naturalWidth > 0), await card.elementHandle(), { timeout: 8000 }).catch(() => {});
}

// ---------------- A. Flux complet (usuari nou) ----------------
for (const vp of Object.keys(VIEWPORTS)) {
  const { ctx, page } = await newPage(vp);
  await go(page, '/');
  await shot(page, `${vp}-01-inici`);
  await go(page, '/crear');
  await shot(page, `${vp}-02-crear`, { fullPage: true });
  await page.click('[data-testid="create-today"]');
  await page.waitForURL(/assistent\/cos/);
  await shot(page, `${vp}-03-pas1-cos`);
  await page.getByRole('button', { name: /Següent/ }).click();
  await page.getByRole('button', { name: /Guanyar múscul/ }).click();
  await shot(page, `${vp}-04-pas2-objectiu`);
  await page.getByRole('button', { name: /Següent/ }).click();
  await page.getByRole('button', { name: 'Informació sobre Intermedi' }).click();
  await shot(page, `${vp}-05-pas3-nivell-info`);
  check(await page.getByText('9–24 mesos entrenant').isVisible(), `[${vp}] el modal ⓘ del nivell mostra les referències`);
  await page.getByRole('button', { name: 'Tanca' }).click();
  await page.getByRole('button', { name: /Següent/ }).click();
  await shot(page, `${vp}-06-pas4-lloc`, { fullPage: true });
  await page.getByRole('button', { name: /Següent/ }).click();
  await page.getByRole('button', { name: '45 min' }).click();
  await shot(page, `${vp}-07-pas5-temps`);
  await page.getByRole('button', { name: /Següent/ }).click();
  await page.waitForURL(/assistent\/muscles/);
  // Criteri 5: tocar el mapa
  const scope = vp === 'mobil' ? page.locator('.md\\:hidden') : page.locator('aside');
  await scope.locator('polygon[data-muscle="chest"]').first().click();
  if (vp === 'mobil') await scope.getByRole('button', { name: 'Posterior' }).click();
  await scope.locator('polygon[data-muscle="back-deltoids"]').first().click();
  await scope.locator('polygon[data-muscle="upper-back"]').first().click();
  if (vp === 'mobil') await scope.getByRole('button', { name: 'Frontal' }).click();
  await scope.locator('polygon[data-muscle="obliques"]').first().click();
  const count = await page.getByTestId('muscle-count').innerText();
  check(count === '5 músculs seleccionats', `[${vp}] criteri 5: pit + deltoide posterior + esquena alta (2) + oblics = 5 (${count})`);
  check(await page.getByText('Deltoide posterior', { exact: true }).isVisible() && await page.getByText('Oblics', { exact: true }).isVisible(), `[${vp}] criteri 5: deltoide posterior i oblics tenen identitat pròpia`);
  await shot(page, `${vp}-08-pas6-muscles-mapa`);
  await scope.locator('polygon[data-muscle="obliques"]').first().click();
  check((await page.getByTestId('muscle-count').innerText()) === '4 músculs seleccionats', `[${vp}] criteri 5: tornar a tocar treu el múscul`);
  await page.getByRole('button', { name: /Grups/ }).click();
  await shot(page, `${vp}-09-pas6-grups`);
  await page.getByRole('button', { name: /Empenta tren superior/ }).click();
  check((await page.getByTestId('muscle-count').innerText()) === '4 músculs seleccionats', `[${vp}] criteri 5: el grup "Empenta tren superior" selecciona 4 músculs`);
  await page.getByRole('button', { name: /Generar/ }).click();
  await page.waitForURL(/generant/);
  await page.waitForTimeout(250);
  await shot(page, `${vp}-10-generant`);
  await page.waitForURL(/entrenament\//, { timeout: 5000 });
  await page.waitForSelector('[data-testid="exercise-card"]');
  await page.waitForTimeout(600);
  await shot(page, `${vp}-11-resultat`);
  check((await page.getByTestId('workout-title').innerText()).length > 0, `[${vp}] el resultat té títol automàtic`);
  await page.locator('[data-testid="exercise-card"]').first().scrollIntoViewIfNeeded();
  await waitImages(page, page.locator('[data-testid="exercise-card"]').first());
  await shot(page, `${vp}-12-targeta`);
  // Criteri 4: canviar i regenerar
  const before = await cardIds(page);
  await page.locator('[data-testid="exercise-card"]').first().getByRole('button', { name: "Canvia l'exercici" }).click();
  const afterSwap = await cardIds(page);
  const a = byId[before[0]];
  const b = byId[afterSwap[0]];
  check(afterSwap[0] !== before[0] && afterSwap.slice(1).join() === before.slice(1).join(), `[${vp}] criteri 4: 🔄 canvia només el primer exercici (${a?.name} → ${b?.name})`);
  await page.locator('[data-testid="exercise-card"]').nth(1).getByRole('button', { name: 'Bloqueja' }).click();
  await page.getByRole('button', { name: "Regenera l'entrenament" }).click();
  const afterRegen = await cardIds(page);
  check(afterRegen[1] === afterSwap[1] && afterRegen.join() !== afterSwap.join(), `[${vp}] criteri 4: regenerar respecta el bloquejat`);
  await page.locator('[data-testid="exercise-card"]').nth(1).scrollIntoViewIfNeeded();
  await shot(page, `${vp}-13-regenerat-bloquejat`);
  await page.getByRole('button', { name: /^Desar/ }).click();
  await go(page, '/');
  check(await page.getByTestId('saved-list').isVisible(), `[${vp}] l'entrenament desat surt a l'Inici`);
  await shot(page, `${vp}-14-inici-desat`);
  await go(page, '/material');
  await page.waitForTimeout(400);
  await shot(page, `${vp}-15-material`, { fullPage: vp !== 'escriptori' });
  await page.getByRole('link', { name: /Gimnàs/ }).first().click();
  await page.waitForTimeout(300);
  await shot(page, `${vp}-16-lloc-gimnas`);
  await go(page, '/perfil');
  await shot(page, `${vp}-17-perfil`, { fullPage: true });
  check(/Arsenal v\d+\.\d+\.\d+/.test(await page.getByTestId('version').innerText()), `[${vp}] el Perfil mostra el número de versió`);
  await ctx.close();
}

// ---------------- B. Criteri 1: press de banca amb discs de 5 a 25 kg ----------------
for (const vp of ['mobil', 'escriptori']) {
  const gym = loc('loc_gym', 'Gimnàs', 'gym', [
    item('barbell_olympic', { weightKg: 20 }),
    item('plates', { plates: [5, 10, 15, 20, 25].map((kg) => ({ kg, qty: 2 })) }),
    item('bench_flat'), item('rack'),
  ]);
  const { ctx, page } = await newPage(vp, { fn: seed, arg: { profile: { ...PROFILE, goal: 'strength' }, locations: [gym], wizard: { mode: 'quick', locationId: 'loc_gym', durationMin: 45, targets: ['chest'] } } });
  await go(page, '/material/loc_gym');
  const loads = await page.getByTestId('loads-barbell_olympic').innerText();
  check(/20–170 kg \(16 càrregues\)/.test(loads), `[${vp}] criteri 1: l'editor mostra les càrregues de barra (${loads})`);
  await page.getByTestId('item-plates').scrollIntoViewIfNeeded();
  await shot(page, `${vp}-c1-editor-discs`);
  await go(page, '/generant');
  await page.waitForSelector('[data-testid="exercise-card"]', { timeout: 5000 });
  const cards = page.locator('[data-testid="exercise-card"]');
  const ids = await cardIds(page);
  const idx = ids.findIndex((id) => /bench press/i.test(byId[id]?.name || '') && /barbell/i.test(byId[id]?.equipment || ''));
  check(idx >= 0, `[${vp}] criteri 1: surt un press de banca amb barra`);
  if (idx >= 0) {
    const card = cards.nth(idx);
    await card.scrollIntoViewIfNeeded();
    const setup = await card.getByTestId('load-setup').innerText();
    const chips = await card.locator('button[aria-pressed]').allInnerTexts();
    const kgs = chips.filter((t) => /kg/.test(t)).map((t) => Number(t.replace(' kg', '').replace(',', '.')));
    check(/^Barra 20 \+ 2×\d+( \+ 2×\d+)* = \d+ kg$/.test(setup), `[${vp}] criteri 1: mostra el muntatge (${setup})`);
    check(kgs.length > 1 && kgs.every((k) => (k - 20) % 10 === 0), `[${vp}] criteri 1: xips en salts de 10 kg (${kgs.join(', ')})`);
    await waitImages(page, card);
    await shot(page, `${vp}-c1-press-banca`);
  }
  await ctx.close();
}

// ---------------- C. Criteri 2: Casa amb 2 garrafes de sorra i una cadira ----------------
for (const vp of ['mobil', 'escriptori']) {
  const casa = loc('loc_casa', 'Casa', 'home', [item('jug', { volumeL: 8, qty: 2, content: 'sand' }), item('chair')]);
  const { ctx, page } = await newPage(vp, { fn: seed, arg: { profile: PROFILE, locations: [casa], wizard: { mode: 'quick', locationId: 'loc_casa', durationMin: 45, targets: ['quads', 'glutes', 'hamstrings', 'calves'] } } });
  await go(page, '/generant');
  await page.waitForSelector('[data-testid="exercise-card"]', { timeout: 5000 });
  const ids = await cardIds(page);
  const setups = await page.locator('[data-testid="load-setup"]').allInnerTexts();
  const reqText = ids.map((id) => JSON.stringify(byId[id]?.equipment));
  check(!setups.some((s) => /Barra|Màquina|Smith|politja/i.test(s)) && !reqText.some((t) => /barbell|machine|cable/.test(t)), `[${vp}] criteri 2: cap exercici amb barra ni màquina`);
  const names = await page.locator('[data-testid="exercise-card"] h3').allInnerTexts();
  check(names.some((n) => /goblet|búlgar/i.test(n)), `[${vp}] criteri 2: surt goblet o búlgara amb garrafa (${names.join(' | ')})`);
  check(setups.some((s) => /Garrafa/.test(s)), `[${vp}] criteri 2: la càrrega es mostra com a garrafa`);
  const adapt = page.getByTestId('adaptation').first();
  check(await adapt.count() > 0, `[${vp}] criteri 2: apareix l'adaptació explicada`);
  await shot(page, `${vp}-c2-casa-resultat`);
  if (await adapt.count()) {
    await adapt.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await shot(page, `${vp}-c2-casa-adaptacio`);
  }
  await ctx.close();
}

// ---------------- D. Criteri 3: "Sense salts" → cap pliometria ----------------
{
  const vp = 'mobil';
  const l = loc('loc_nj', 'Pis', 'home', [item('plyo_box'), item('hurdles'), item('dumbbells_fixed'), item('jump_rope')], { noJumps: true });
  const { ctx, page } = await newPage(vp, { fn: seed, arg: { profile: { ...PROFILE, goal: 'power' }, locations: [l], wizard: { mode: 'quick', locationId: 'loc_nj', durationMin: 60, targets: ['quads', 'glutes', 'calves'] } } });
  await go(page, '/generant');
  await page.waitForSelector('[data-testid="exercise-card"]', { timeout: 5000 });
  const ids = await cardIds(page);
  check(ids.length > 0 && ids.every((id) => byId[id].category !== 'plyometrics' && !/jump|hop|bound|leap/i.test(byId[id].name)), `[${vp}] criteri 3: cap pliometria amb "Sense salts" (${ids.map((i) => byId[i].name).join(' | ')})`);
  await shot(page, `${vp}-c3-sense-salts`);
  await ctx.close();
}

// ---------------- F. Sessió en blocs, sessió en directe i historial ----------------
async function workoutFromStorage(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('arsenal-workouts') || '{}').state?.current);
}
for (const vp of ['mobil', 'escriptori']) {
  const gymLoc = loc('loc_gym', 'Gimnàs', 'gym', [
    item('barbell_olympic'), item('plates', { plates: [1.25, 2.5, 5, 10, 15, 20, 25].map((kg) => ({ kg, qty: 4 })) }),
    item('dumbbells_fixed'), item('bench_adjustable'), item('rack'), item('cable_station'), item('kettlebells', { weights: [8, 12, 16, 20, 24] }), item('rower'),
  ]);
  const { ctx, page } = await newPage(vp, { fn: seed, arg: { profile: PROFILE, locations: [gymLoc], wizard: { mode: 'quick', locationId: 'loc_gym', durationMin: 60, targets: ['chest', 'lats', 'middle-back', 'quads', 'hamstrings', 'abs'] } } });
  await page.clock.install();
  await go(page, '/generant');
  await page.clock.fastForward(1500);
  await page.waitForSelector('[data-testid="exercise-card"]', { timeout: 8000 });
  const w = await workoutFromStorage(page);
  const nBlocks = await page.getByTestId('block').count();
  check(nBlocks >= 2 && w.blocks.length === nBlocks, `[${vp}] punt 1: sessió de 60 min en ${nBlocks} blocs A-B-C (${w.exercises.length} exercicis)`);
  const conflicts = w.blocks.map((b) => weightConflict(b.entries.map((i) => w.exercises[i]))).filter(Boolean);
  check(conflicts.length === 0, `[${vp}] punt 2: cap bloc amb canvis de pes a mitja ronda`);
  check(await page.getByTestId('warmup').isVisible() && await page.getByTestId('cooldown').isVisible(), `[${vp}] punt 3: escalfament i estiraments detallats`);
  const warmTxt = await page.getByTestId('warmup').innerText();
  check(/Remadora/.test(warmTxt), `[${vp}] punt 5: l'escalfament fa servir el material del lloc (remadora)`);
  await shot(page, `${vp}-20-sessio-blocs`);
  await page.getByTestId('block').first().scrollIntoViewIfNeeded();
  await waitImages(page, page.locator('[data-testid="exercise-card"]').first());
  await shot(page, `${vp}-21-bloc-1`);
  await page.getByTestId('cooldown').scrollIntoViewIfNeeded();
  await shot(page, `${vp}-22-estiraments`);

  // Sessió en directe (manual)
  await page.getByRole('button', { name: /Començar/ }).click();
  await page.waitForURL(/\/fer$/);
  await shot(page, `${vp}-23-directe-inici`);
  await page.getByRole('button', { name: /Manual/ }).click();
  await page.getByTestId('live-start').click();
  check(/Escalfament/i.test(await page.getByTestId('live-phase').innerText()), `[${vp}] punt 4: la sessió comença per l'escalfament`);
  await shot(page, `${vp}-24-directe-escalfament`);
  for (let k = 0; k < 20; k++) {
    if (/Bloc 1/i.test(await page.getByTestId('live-phase').innerText())) break;
    await page.getByTestId('live-next').click();
  }
  check(/Bloc 1 · Ronda 1\//i.test(await page.getByTestId('live-phase').innerText()), `[${vp}] punt 4: després de l'escalfament toca el bloc 1, ronda 1`);
  await page.getByRole('button', { name: 'Una rep menys' }).click();
  await waitImages(page, page.getByTestId('live'));
  await shot(page, `${vp}-25-directe-exercici`);
  const t1 = await page.getByTestId('live-title').innerText();
  await page.getByTestId('live-next').click();
  check(/Descans/i.test(await page.getByTestId('live-phase').innerText()), `[${vp}] punt 4: entre A i B hi ha el canvi amb compte enrere`);
  await shot(page, `${vp}-26-directe-descans`);
  // Manual: el descans s'acaba però no avança sol
  await page.clock.fastForward(40000);
  check(/Descans/i.test(await page.getByTestId('live-phase').innerText()), `[${vp}] punt 4: en mode manual no avança sol`);
  // Automàtic: avança sol
  await page.getByRole('button', { name: 'Auto' }).click();
  await page.clock.fastForward(2000);
  const ph = await page.getByTestId('live-phase').innerText();
  const t2 = await page.getByTestId('live-title').innerText();
  check(/Bloc 1/i.test(ph) && t2 !== t1, `[${vp}] punt 4: en mode automàtic passa sol a l'exercici B (${t2})`);
  await page.clock.fastForward(120000);
  const ph2 = await page.getByTestId('live-phase').innerText();
  check(!/Escalfament/i.test(ph2), `[${vp}] punt 4: el mode automàtic continua avançant (${ph2.replace(/\n/g, ' ')})`);
  await shot(page, `${vp}-27-directe-auto`);
  // Acabar i desar
  await page.getByRole('button', { name: 'Sortir' }).click();
  await page.getByRole('button', { name: /Acabar ara i desar/ }).click();
  await page.waitForURL(/historial\//);
  check(await page.getByTestId('history-detail').isVisible(), `[${vp}] punt 7: la sessió es desa a l'historial amb les sèries fetes`);
  await shot(page, `${vp}-28-historial-detall`, { fullPage: vp !== 'escriptori' });
  await go(page, '/historial');
  check(/1\s*Sessions aquesta setmana/.test(await page.getByTestId('week-summary').innerText()), `[${vp}] punt 7: el resum setmanal compta la sessió`);
  await shot(page, `${vp}-29-historial`, { fullPage: true });
  await go(page, '/');
  check(await page.getByTestId('home-week').isVisible(), `[${vp}] punt 7: l'Inici mostra el resum de la setmana`);
  await shot(page, `${vp}-30-inici-setmana`);
  await ctx.close();
}

// ---------------- E. Criteri 6: funciona sense connexió ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'ca-ES' });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'networkidle' });
  const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await page.goto(`${BASE}#/material`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const text = await page.locator('main').innerText();
  check(controlled && /Llocs i material/.test(text) && /exercicis realitzables/.test(text), '[mobil] criteri 6: sense connexió l\'app i els exercicis (exercises.json) carreguen del service worker');
  await shot(page, 'mobil-c6-sense-connexio');
  await ctx.close();
}

await browser.close();
console.log(`\n${passes.length} comprovacions correctes, ${failures.length} errors`);
if (failures.length) {
  console.log(failures.map((f) => ` - ${f}`).join('\n'));
  process.exitCode = 1;
}

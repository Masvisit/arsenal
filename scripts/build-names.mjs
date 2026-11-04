// Uneix scripts/i18n/names-*.txt ("índex|nom català", índex sobre el dataset ordenat per id)
// i genera src/data/i18n/exercise-names.ca.json ({ id: nom }). Falla si en falta o en sobra cap.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const exercises = JSON.parse(readFileSync(join(root, 'public/data/exercises.json'), 'utf8'));
const dir = join(root, 'scripts/i18n');
const byIndex = new Map();
for (const f of readdirSync(dir).filter((f) => /^names-\d+\.txt$/.test(f)).sort()) {
  for (const line of readFileSync(join(dir, f), 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [i, ...rest] = line.split('|');
    const idx = Number(i);
    const name = rest.join('|').trim();
    if (!Number.isInteger(idx) || !name) throw new Error(`Línia invàlida a ${f}: ${line}`);
    if (byIndex.has(idx)) throw new Error(`Índex duplicat ${idx} a ${f}`);
    byIndex.set(idx, name);
  }
}
const out = {};
exercises.forEach((e, i) => {
  if (!byIndex.has(i)) throw new Error(`Falta la traducció de ${i} (${e.name})`);
  out[e.id] = byIndex.get(i);
});
if (byIndex.size !== exercises.length) throw new Error(`Hi ha ${byIndex.size} traduccions per a ${exercises.length} exercicis`);
writeFileSync(join(root, 'src/data/i18n/exercise-names.ca.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`✓ ${Object.keys(out).length} noms en català`);

// Baixa free-exercise-db (domini públic, Unlicense) i la desa a public/data/exercises.json.
// Ús: npm run data
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'data');

const res = await fetch(SRC);
if (!res.ok) throw new Error(`No s'ha pogut baixar el dataset: HTTP ${res.status}`);
const data = await res.json();
if (!Array.isArray(data) || data.length < 800) throw new Error(`Dataset inesperat (${data?.length} elements)`);

// Ordre estable per id perquè els diffs del repo siguin nets
data.sort((a, b) => a.id.localeCompare(b.id));
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'exercises.json'), JSON.stringify(data));
console.log(`✓ ${data.length} exercicis desats a public/data/exercises.json`);

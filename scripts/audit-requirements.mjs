// Informe de requisits: exercicis realitzables per plantilla i exercicis strength/plyometrics sense mapejar.
// Ús: npm run audit
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getRequirements, feasibility } from '../src/core/requirements.js';
import { locationFromTemplate, locationCapabilities } from '../src/core/inventory.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const exercises = read('public/data/exercises.json');
const custom = read('src/data/custom-exercises.json');
const templates = read('src/data/templates.json');

export function audit() {
  const relevant = exercises.filter((e) => e.category === 'strength' || e.category === 'plyometrics');
  const mapped = relevant.filter((e) => getRequirements(e).mapped);
  const excluded = relevant.filter((e) => !getRequirements(e).mapped && getRequirements(e).excluded);
  const unmapped = relevant.filter((e) => !getRequirements(e).mapped && !getRequirements(e).excluded);
  const all = [...exercises, ...custom];
  const perTemplate = templates.map((t) => {
    const loc = locationFromTemplate(t);
    const caps = locationCapabilities(loc);
    const ok = all.filter((e) => (e.category === 'strength' || e.category === 'plyometrics') && feasibility(e, caps, loc.constraints).ok);
    return { template: t.name, feasible: ok.length, adapted: ok.filter((e) => feasibility(e, caps, loc.constraints).adapted).length };
  });
  return { total: relevant.length, mapped: mapped.length, pct: mapped.length / relevant.length, excluded, unmapped, perTemplate, customCount: custom.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = audit();
  console.log('Exercicis realitzables per plantilla (strength + plyometrics, inclosos els propis):');
  for (const p of r.perTemplate) console.log(`  · ${p.template.padEnd(22)} ${String(p.feasible).padStart(4)}  (${p.adapted} adaptats)`);
  console.log(`\nExercicis propis: ${r.customCount}`);
  console.log(`\nMapejats: ${r.mapped}/${r.total} strength + plyometrics = ${(r.pct * 100).toFixed(1)} % (criteri ≥ 90 %)`);
  console.log(`\nExclosos explícitament (${r.excluded.length}):`);
  for (const e of r.excluded) console.log(`  - ${e.name} → ${getRequirements(e).excluded}`);
  console.log(`\nSense mapejar (${r.unmapped.length}):`);
  for (const e of r.unmapped) console.log(`  - ${e.name} [${e.equipment}]`);
  if (r.pct < 0.9 || r.unmapped.length) process.exitCode = 1;
}

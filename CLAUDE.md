# Arsenal — normes del projecte

App web (PWA) que genera entrenaments de força a partir del material REAL que hi ha a cada lloc on entreno.
- Especificació completa: `docs/ESPECIFICACIO.md` → llegeix-la sencera abans de tocar res.
- Captures del flux original que replico: `docs/referencia/` (13 PNG, en ordre).
- Decisions preses sense preguntar: apunta-les a `docs/DECISIONS.md` (una línia per decisió, amb data).

## Normes fixes
- Interfície 100% en català. Codi, noms de fitxers i variables en anglès.
- Stack fix (el mateix que PITU 2.0, perquè després s'han d'unificar): React 18 + Vite 5 + Tailwind CSS 3 + Zustand (amb `persist`) + react-router-dom (HashRouter) + vite-plugin-pwa + react-body-highlighter + Vitest.
- Sense backend i sense APIs de pagament: tot funciona en local (localStorage / IndexedDB). Zero cost per ús.
- Mobile-first (iPhone, Safari i PWA a pantalla d'inici). Revisa sempre mòbil, tauleta i escriptori.
- Tota la lògica de domini (inventari, càrregues, requisits, generador, progressió) va a `src/core/` com a JS pur, sense React, amb tests. Ha de poder-se importar tal qual dins PITU més endavant.
- No inventis exercicis ni dades: surten de `public/data/exercises.json` (free-exercise-db, domini públic) + `src/data/custom-exercises.json`.
- No copiïs marca, logo, textos ni vídeos de MuscleWiki. Només n'agafem el flux; nom i disseny propis.
- Commits petits i descriptius en català, un per tasca acabada.

## Verificació obligatòria (no diguis mai "fet" sense això)
1. `npm run test` i `npm run build` passen sense errors ni warnings nous.
2. Arrenca `npm run preview` i revisa amb Playwright cada pantalla nova o canviada a 390×844 (iPhone) i a 1280×800. Desa les captures a `docs/captures/` i mira-les tu mateix abans de continuar.
3. Al final de cada fase, entrega tres llistes separades: ✅ verificat visualment · ⚠️ fet però no verificat · ❌ pendent. Res no compta com a "implementat" si no es veu i funciona a la interfície.
4. Després de cada desplegament, obre https://masvisit.github.io/arsenal/ i comprova que la versió publicada és la nova (mostra el número de versió al peu de la pàgina de Perfil).

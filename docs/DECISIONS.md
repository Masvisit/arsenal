# Decisions preses sense preguntar

Format: `AAAA-MM-DD · decisió · motiu`

- 2026-11-04 · Versions exactes de l'stack fix: React 18.3.1, Vite 5.4.21, Tailwind 3.4.19, Zustand 5.0.8, react-router-dom 6.30.6, vite-plugin-pwa 0.21.2, react-body-highlighter 2.0.5, Vitest 2.1.9. · CLAUDE.md fixa React 18 / Vite 5 / Tailwind 3. Nota: el repo local de PITU 2.0 ja és a React 19 / Vite 8 / Tailwind 4; caldrà tenir-ho en compte a la Fase 4.
- 2026-11-04 · Verificació visual amb el paquet `playwright` (script `npm run shots`) i Chromium. · CLAUDE.md demana Playwright; un script propi és més simple que el test runner.
- 2026-11-04 · Node 22 al workflow de GitHub Actions. · LTS estable; localment hi ha Node 24.

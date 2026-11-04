# Decisions preses sense preguntar

Format: `AAAA-MM-DD · decisió · motiu`

- 2026-11-04 · Versions exactes de l'stack fix: React 18.3.1, Vite 5.4.21, Tailwind 3.4.19, Zustand 5.0.8, react-router-dom 6.30.6, vite-plugin-pwa 0.21.2, react-body-highlighter 2.0.5, Vitest 2.1.9. · CLAUDE.md fixa React 18 / Vite 5 / Tailwind 3. Nota: el repo local de PITU 2.0 ja és a React 19 / Vite 8 / Tailwind 4; caldrà tenir-ho en compte a la Fase 4.
- 2026-11-04 · Verificació visual amb el paquet `playwright` (script `npm run shots`) i Chromium. · CLAUDE.md demana Playwright; un script propi és més simple que el test runner.
- 2026-11-04 · Node 22 al workflow de GitHub Actions. · LTS estable; localment hi ha Node 24.
- 2026-11-04 · La selecció de músculs fa servir 20 "targets" propis (inclou deltoide lateral, que només s'activa amb Grups). Tocar `upper-back` selecciona dorsals + esquena mitja i el comptador compta targets. · Així els oblics i els tres deltoides tenen identitat pròpia (secció 4.3) i els Grups coincideixen amb la referència.
- 2026-11-04 · Al grup "Tracció tren superior", "trapezi (mig)" = esquena mitja. "Proves Agent Rural": core = abdominals + oblics + lumbars. · Interpretació de la captura 10 ("Traps (mid-back)").
- 2026-11-04 · Requisits amb grups OR (`[["table","low_bar"]]`) i camp `load.cap` per saber quin element aporta la càrrega. · Els exercicis propis poden fer-se amb material alternatiu sense duplicar-los.
- 2026-11-04 · Afegits al catàleg: sofà pesat (ancoratge de peus), màquines de braços, màquina d'abdominals. · Els demanen exercicis del dataset o substitucions de l'especificació.
- 2026-11-04 · Exclosos del generador amb motiu (7 de 645): cadenes, sac de boxa, corda de grimpar, arnès de coll, company, "Lunge Sprint". Strongman sense implements casolans (eix, campana, roda de Conan, carro, jou) també. · Material que no té sentit al catàleg.
- 2026-11-04 · 42 exercicis propis: els de l'especificació + búlgar amb garrafes, esquat amb motxilla al davant, press i elevació lateral amb garrafa. · El criteri 2 demana "búlgara amb garrafa".
- 2026-11-04 · Garrafa com a mancuerna: prohibits balístics i també obertures, pullovers, curls de canell/martell (agafada insegura). Garrafa com a kettlebell: només si és de sorra i per a goblet, rem, carries i pes mort. · Seguretat (secció 4.4).
- 2026-11-04 · 1RM per exercici = aixecament base (referència del perfil o estàndard per nivell × pes corporal) × factor per patró i implement (`core/ratios.js`). Sempre es mostra com a "estimació — ajusta-ho amb el RIR". · Secció 8.2: sense dades no hi ha cap altra manera de proposar un pes concret.
- 2026-11-04 · Puntuació del generador, a més de la secció 7.4: −2 extra a un exercici adaptat si al lloc hi ha una alternativa nativa amb càrrega del mateix patró i múscul (−5 en total), i +2 / −1 (unilateral / bilateral) quan la càrrega es queda curta. Un exercici propi amb `substituteFor` amaga la versió adaptada del dataset. · Sense això, a Casa sortien "mancuernes" fetes amb garrafes en lloc dels exercicis pensats per a garrafes (criteri 2).
- 2026-11-04 · Els exercicis "strength" del dataset que són salts (p. ex. "Freehand Jump Squat") es tracten com a pliometria: només per a Potència i Agent Rural. · Coherència amb la secció 7.1.
- 2026-11-04 · Llista curada `core` de 190 exercicis habituals a `src/data/core-exercises.json` (+ els propis marcats `core`). · Secció 7.4 (+2 si és core).
- 2026-11-04 · Títol automàtic en ordre anatòmic fix ("Pit, espatlles i tríceps"), sigui quin sigui l'ordre de selecció. · Títols estables.
- 2026-11-04 · react-body-highlighter només té un model de cos: el selector Home/Dona canvia les referències de nivell, no el dibuix. La previsualització de Crear no té el commutador Home/Dona de l'original. · Limitació de la llibreria fixada a l'stack.
- 2026-11-04 · Cada polígon del mapa s'etiqueta amb el seu múscul (`data-muscle`, `aria-label` en català, focus i Enter/Espai) segons l'ordre de `src/assets` de la llibreria 2.0.5 (`bodyMapPolygons.js`). · Accessibilitat i proves amb Playwright; si s'actualitza la llibreria cal regenerar-ho.
- 2026-11-04 · Primer ús: es creen 4 llocs (Gimnàs = Gimnàs complet, Casa = Casa bàsica, Jardí = Casolà amb 20 m per córrer, Parc = Parc de cal·listènia). · Llocs inicials suggerits a la secció 5.1.
- 2026-11-04 · "Generar avui" amb perfil fet → assistent ràpid de 3 passos (Lloc → Temps → Músculs) amb enllaç "Canviar perfil". L'estat de l'assistent es desa a sessionStorage. · Secció 6.
- 2026-11-04 · "Començar" porta a una pantalla "Properament" (mode en directe = Fase 2). "Pla setmanal" i "Construir manualment" surten com a "Properament" a Crear. · Abast de la Fase 1.
- 2026-11-04 · Les molèsties es pregunten al pas 5 i es desen al perfil (persisteixen entre sessions). · Són una dada estable de l'usuari.
- 2026-11-04 · Al mòbil el botó del resultat diu només "Desar" (a partir de 640 px, "Desar entrenament"). · Cabia en dues línies a 390 px.
- 2026-11-04 · El repo de GitHub tenia un commit inicial amb un README d'una línia: s'ha integrat amb un merge (sense force-push). · No sobreescriure res del remot.

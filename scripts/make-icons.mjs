// Genera les icones PNG de la PWA a partir de public/icons/favicon.svg (requereix Chromium de Playwright).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icons/favicon.svg', import.meta.url), 'utf8');
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['apple-touch-icon.png', 180, 0]]) {
  await page.setViewportSize({ width: size, height: size });
  // L'icona d'Apple va sense cantonades arrodonides (iOS ja les retalla)
  const body = name.startsWith('apple') ? svg.replace('rx="14"', 'rx="0"') : svg;
  await page.setContent(`<html><body style="margin:0;background:transparent">${body.replace('<svg ', `<svg width="${size - pad * 2}" height="${size - pad * 2}" `)}</body></html>`);
  await page.screenshot({ path: out(name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('✓', name);
}
await browser.close();

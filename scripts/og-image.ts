// Renders the social preview images (Open Graph / Twitter card, 1200 × 630) for both locales
// to public/og/kokot-it-<locale>.png: the Relay network still on the scene background, the
// logo and the locale's headline. Colours and fonts come from the brand tokens.
//
//   npm run og:image      (needs Chromium once: npm run pdf:install)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { escapeHtml } from '../src/content/html.ts';
import { content, OG_IMAGE, ogImagePath } from '../src/content/render.ts';
import { LOCALES, type Locale } from '../src/i18n/index.ts';
import { relayGraph, SCENE_SEED } from '../src/scene/relay-graph.ts';
import { relayStillMarkup } from '../src/scene/still.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const tokens = pathToFileURL(join(root, 'src', 'styles', 'tokens.css')).href;
const logo = pathToFileURL(join(root, 'public', 'brand', 'logo.svg')).href;

const { width, height } = OG_IMAGE;
const graph = relayGraph({ seed: SCENE_SEED, count: 64, width, height, links: 2, pulses: 8 });
const still = relayStillMarkup(graph, width, height, { id: 'og', fit: 'xMidYMid slice' });

function ogImageHtml(locale: Locale): string {
  const c = content(locale);
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="${tokens}" />
<style>
  html, body { margin: 0; width: ${String(width)}px; height: ${String(height)}px; }
  body { position: relative; overflow: hidden; background: var(--scene-bg); color: var(--color-text);
    font-family: var(--font-sans); }
  .net, .net svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .scrim { position: absolute; inset: 0; background: linear-gradient(90deg, var(--scene-scrim-strong) 0%,
    var(--scene-scrim-soft) 55%, transparent 85%); }
  .text { position: absolute; left: 80px; top: 92px; width: 860px; }
  .logo { display: block; height: 44px; }
  .eyebrow { margin: 64px 0 20px; font-family: var(--font-mono); font-size: 22px;
    letter-spacing: var(--tracking-label); text-transform: uppercase; color: var(--color-accent); }
  h1 { margin: 0; font-size: 64px; line-height: 1.08; font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-display); text-wrap: balance; }
  .url { position: absolute; left: 80px; bottom: 64px; font-family: var(--font-mono); font-size: 24px;
    color: var(--color-text-muted); }
</style>
</head>
<body>
  <div class="net">${still}</div>
  <div class="scrim"></div>
  <div class="text">
    <img class="logo" src="${logo}" alt="" />
    <p class="eyebrow">${escapeHtml(c.hero.eyebrow)}</p>
    <h1>${escapeHtml(c.meta.ogImage.headline)}</h1>
  </div>
  <p class="url">kokot.it</p>
</body>
</html>`;
}

const work = join(tmpdir(), `og-${String(process.pid)}`);
mkdirSync(work, { recursive: true });
mkdirSync(join(root, 'public', 'og'), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  for (const locale of LOCALES) {
    const file = join(work, `${locale}.html`);
    writeFileSync(file, ogImageHtml(locale));
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const out = join(root, 'public', ...ogImagePath(locale).split('/').filter(Boolean));
    await page.screenshot({ path: out, type: 'png' });
    console.log(`PNG: ${out}`);
  }
} finally {
  await browser.close();
  rmSync(work, { recursive: true, force: true });
}

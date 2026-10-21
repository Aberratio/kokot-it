// Generates the kokot.it logo, sign and favicons from code, with colours read from
// src/styles/tokens.css. Run: npm run brand:assets (needs Chromium: npm run pdf:install).
// Outputs are committed; rerun only when the geometry or the palette changes.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { parseCustomProperties, resolvingReader } from '../src/styles/tokens.ts';
import { markGeometry, wordmarkGeometry, type Geometry } from './brand-geometry.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const css = readFileSync(join(root, 'src', 'styles', 'tokens.css'), 'utf8');
const base = parseCustomProperties(css, ':root');
const dark = resolvingReader(base);
const paper = resolvingReader(base, parseCustomProperties(css, "[data-theme='paper']"));

interface Colours {
  readonly line: string;
  readonly node: string;
}

const onDark: Colours = { line: dark('--color-text'), node: dark('--color-accent') };
const onLight: Colours = { line: paper('--color-text'), node: paper('--color-accent') };
const mono: Colours = { line: 'currentColor', node: 'currentColor' };

function body(g: Geometry, c: Colours): string {
  const lines = g.strokes.map((d) => `<path d="${d}"/>`).join('');
  const nodes = g.nodes
    .map(
      (n) =>
        `<circle cx="${String(n.cx)}" cy="${String(n.cy)}" r="${String(n.r)}" fill="${n.accent ? c.node : c.line}"/>`,
    )
    .join('');
  return (
    `<g fill="none" stroke="${c.line}" stroke-width="${String(g.stroke)}" ` +
    `stroke-linecap="round" stroke-linejoin="round">${lines}</g>${nodes}`
  );
}

function svg(g: Geometry, c: Colours, title: string, background?: string): string {
  const [x, y, w, h] = g.viewBox;
  const bg = background
    ? `<rect x="${String(x)}" y="${String(y)}" width="${String(w)}" height="${String(h)}" rx="${String(g.tileRadius)}" fill="${background}"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.viewBox.join(' ')}" ` +
    `width="${String(w * g.pxPerUnit)}" height="${String(h * g.pxPerUnit)}" role="img" aria-label="${title}">` +
    `<title>${title}</title>${bg}${body(g, c)}</svg>\n`
  );
}

const brandDir = join(root, 'public', 'brand');
mkdirSync(brandDir, { recursive: true });

const word = wordmarkGeometry();
const mark = markGeometry();
const tile = markGeometry({ tile: true });
const files: Record<string, string> = {
  'brand/logo.svg': svg(word, onDark, 'kokot.it'),
  'brand/logo-on-light.svg': svg(word, onLight, 'kokot.it'),
  'brand/logo-mono.svg': svg(word, mono, 'kokot.it'),
  'brand/mark.svg': svg(mark, onDark, 'kokot.it'),
  'brand/mark-on-light.svg': svg(mark, onLight, 'kokot.it'),
  'brand/mark-mono.svg': svg(mark, mono, 'kokot.it'),
  'favicon.svg': svg(tile, onDark, 'kokot.it', dark('--color-bg')),
};
for (const [path, content] of Object.entries(files)) {
  writeFileSync(join(root, 'public', path), content);
  console.log(`SVG: public/${path}`);
}

// PNG favicons: the same tile rendered by Chromium. apple-touch-icon has no rounded corners
// (iOS masks it) and no transparency.
const pngs = [
  { path: 'favicon-32.png', size: 32, svg: files['favicon.svg'] ?? '' },
  {
    path: 'apple-touch-icon.png',
    size: 180,
    svg: svg(markGeometry({ tile: true, square: true }), onDark, 'kokot.it', dark('--color-bg')),
  },
  {
    path: 'brand/icon-512.png',
    size: 512,
    svg: svg(markGeometry({ tile: true, square: true }), onDark, 'kokot.it', dark('--color-bg')),
  },
];
const browser = await chromium.launch();
try {
  for (const png of pngs) {
    const page = await browser.newPage({ viewport: { width: png.size, height: png.size } });
    const sized = png.svg.replace(
      /width="[^"]+" height="[^"]+"/,
      `width="${String(png.size)}" height="${String(png.size)}"`,
    );
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${sized}</body></html>`,
    );
    await page.screenshot({
      path: join(root, 'public', png.path),
      omitBackground: true,
      clip: { x: 0, y: 0, width: png.size, height: png.size },
    });
    await page.close();
    console.log(`PNG: public/${png.path}`);
  }
} finally {
  await browser.close();
}

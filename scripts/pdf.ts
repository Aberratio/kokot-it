// Renders docs-templates/<document>/<lang>.html to out/pdf/<document>-<lang>.pdf
// with Playwright's Chromium. Run: npm run pdf (first time: npm run pdf:install).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { pdfTargets } from './pdf-targets.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'out', 'pdf');
const targets = pdfTargets(join(root, 'docs-templates'));

if (targets.length === 0) {
  console.log('No templates in docs-templates/ — nothing to render.');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.error('Chromium for Playwright is missing. Run: npm run pdf:install');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

try {
  const page = await browser.newPage();
  for (const target of targets) {
    await page.goto(pathToFileURL(target.source).href, { waitUntil: 'networkidle' });
    // Brand fonts load per unicode-range subset (latin-ext only when Polish text needs it).
    await page.evaluate(() => document.fonts.ready);
    const path = join(outDir, target.output);
    await page.pdf({ path, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log(`PDF: ${path}`);
  }
} finally {
  await browser.close();
}

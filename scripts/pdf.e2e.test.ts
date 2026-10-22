import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { CvContent } from '../docs-templates/cv/cv.ts';
import { planDocuments } from './documents.ts';
import { inspectPdf, pdfProblems, type PdfInfo } from './pdf-check.ts';
import { renderPdf } from './pdf-render.ts';

// Real PDFs through Chromium: page limits, embedded brand fonts, extractable text (ATS).
// Needs the Playwright browser (`npm run pdf:install`); skipped with a note when it is missing.
const hasChromium = existsSync(chromium.executablePath());
const out = join(import.meta.dirname, '..', 'out', 'test');

const sample = JSON.parse(
  readFileSync(new URL('../tests/fixtures/cv.sample.json', import.meta.url), 'utf8'),
) as CvContent;

describe.skipIf(!hasChromium)('generated PDFs', () => {
  let browser: Browser;
  const results = new Map<string, PdfInfo>();
  const plan = planDocuments({
    mode: 'draft',
    cv: { dir: 'fixture', pl: sample, en: { ...sample, lang: 'en' } },
    cvDir: 'fixture',
  });

  beforeAll(async () => {
    browser = await chromium.launch();
    for (const doc of plan.docs) {
      const name = doc.output.replace(/\.pdf$/, '');
      const bytes = await renderPdf(
        browser,
        doc.html,
        join(out, `${name}.html`),
        join(out, doc.output),
      );
      results.set(doc.output, await inspectPdf(bytes));
    }
  }, 120_000);

  afterAll(async () => {
    await browser.close();
  });

  it.each(plan.docs.map((d) => [d.output, d] as const))('%s meets its checks', (output, doc) => {
    const info = results.get(output);
    expect(info).toBeDefined();
    if (!info) return;
    expect(
      pdfProblems(info, {
        ...(doc.maxPages !== undefined ? { maxPages: doc.maxPages } : {}),
        phrases: doc.phrases,
      }),
    ).toEqual([]);
  });

  it('the offers and the CV fit in 1–2 pages', () => {
    for (const name of ['oferta-pl.pdf', 'oferta-en.pdf', 'cv-pl.pdf', 'cv-en.pdf']) {
      const pages = results.get(name)?.pages ?? 0;
      expect(pages, name).toBeGreaterThanOrEqual(1);
      expect(pages, name).toBeLessThanOrEqual(2);
    }
  });

  it('embeds the brand fonts as real TrueType fonts, Polish letters included', () => {
    const info = results.get('oferta-pl.pdf');
    expect(info?.fonts.map((f) => f.name)).toEqual(
      expect.arrayContaining([
        'SchibstedGrotesk-Regular',
        'SchibstedGrotesk-SemiBold',
        'JetBrainsMono-Regular',
      ]),
    );
    expect(info?.fonts.every((f) => f.embedded && f.subtype !== 'Type3')).toBe(true);
    expect(results.get('cv-pl.pdf')?.text).toContain('zażółć gęślą jaźń');
  });

  it('puts the name first in the CV text, where an ATS starts reading', () => {
    expect(results.get('cv-pl.pdf')?.text.startsWith('Ada Przykładowa')).toBe(true);
  });

  it('keeps unfilled fields and TODO_OWNER notes where they belong', () => {
    expect(results.get('oferta-cenowa-szablon-pl.pdf')?.text).toContain('{{NAZWA_FIRMY}}');
    expect(results.get('cv-pl.pdf')?.text).not.toContain('Fikcyjne pytanie');
  });
});

it.runIf(!hasChromium)(
  'PDF tests skipped: Playwright Chromium missing (npm run pdf:install)',
  () => {
    expect(hasChromium).toBe(false);
  },
);

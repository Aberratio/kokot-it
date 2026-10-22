import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { CvContent } from '../docs-templates/cv/cv.ts';
import { planDocuments } from './documents.ts';
import type { PdfInfo } from './pdf-check.ts';
import { renderDocument, type RenderedDocument } from './pdf-render.ts';

// Real PDFs through Chromium: page limits, embedded brand fonts, extractable text (ATS).
// Needs the Playwright browser (`npm run pdf:install`); skipped with a note when it is missing.
const hasChromium = existsSync(chromium.executablePath());
const out = join(import.meta.dirname, '..', 'out', 'test');

const sample = JSON.parse(
  readFileSync(new URL('../tests/fixtures/cv.sample.json', import.meta.url), 'utf8'),
) as CvContent;

describe.skipIf(!hasChromium)('generated PDFs', () => {
  let browser: Browser;
  const rendered = new Map<string, RenderedDocument>();
  const results = new Map<string, PdfInfo>();
  // EN copy carries an oversized optional section, so the two-page fallback is exercised too.
  const longEn: CvContent = {
    ...sample,
    lang: 'en',
    additional: Array.from({ length: 150 }, (_, i) => `Optional line ${String(i + 1)}.`),
  };
  const plan = planDocuments({
    mode: 'draft',
    cv: { dir: 'fixture', pl: sample, en: longEn },
    cvDir: 'fixture',
  });

  beforeAll(async () => {
    browser = await chromium.launch();
    for (const doc of plan.docs) {
      const result = await renderDocument(browser, doc, out);
      rendered.set(doc.output, result);
      results.set(doc.output, result.info);
    }
  }, 120_000);

  afterAll(async () => {
    await browser.close();
  });

  it.each(plan.docs.map((d) => d.output))('%s meets its checks', (output) => {
    expect(rendered.get(output)?.problems).toEqual([]);
  });

  it('drops the optional CV section only when the CV would exceed two pages', () => {
    expect(rendered.get('cv-pl.pdf')?.usedFallback).toBe(false);
    expect(rendered.get('cv-en.pdf')?.usedFallback).toBe(true);
    expect(results.get('cv-en.pdf')?.text).not.toContain('Optional line');
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

// HTML string → PDF file with Playwright's Chromium. The HTML is written next to the PDF
// first, so relative stylesheet and font paths resolve over file:// and the page
// can be opened in a browser for debugging.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Browser } from 'playwright';
import type { DocSpec } from './documents.ts';
import { inspectPdf, pdfProblems, type PdfInfo } from './pdf-check.ts';

export async function renderPdf(
  browser: Browser,
  html: string,
  htmlPath: string,
  pdfPath: string,
): Promise<Uint8Array> {
  mkdirSync(dirname(htmlPath), { recursive: true });
  mkdirSync(dirname(pdfPath), { recursive: true });
  writeFileSync(htmlPath, html);
  const page = await browser.newPage();
  try {
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      // Tagged PDF: reading order and structure for screen readers and ATS parsers.
      tagged: true,
    });
  } finally {
    await page.close();
  }
  return new Uint8Array(readFileSync(pdfPath));
}

export interface RenderedDocument {
  pdfPath: string;
  info: PdfInfo;
  /** Problems against the document's checks (pages, fonts, text); empty when it passes. */
  problems: string[];
  /** True when the first version was too long and `fallbackHtml` was rendered instead. */
  usedFallback: boolean;
}

/**
 * Renders one planned document to `<outDir>/<name>.pdf` with its HTML next to it, falls back to
 * `fallbackHtml` when the page limit is exceeded, and checks the result. `outDir` must sit two
 * levels below the repo root (out/pdf, out/test): the HTML links CSS via ../../docs-templates/.
 */
export async function renderDocument(
  browser: Browser,
  doc: DocSpec,
  outDir: string,
): Promise<RenderedDocument> {
  const pdfPath = join(outDir, doc.output);
  const htmlPath = join(outDir, doc.output.replace(/\.pdf$/, '.html'));
  let info = await inspectPdf(await renderPdf(browser, doc.html, htmlPath, pdfPath));
  let usedFallback = false;
  if (doc.fallbackHtml && doc.maxPages !== undefined && info.pages > doc.maxPages) {
    info = await inspectPdf(await renderPdf(browser, doc.fallbackHtml, htmlPath, pdfPath));
    usedFallback = true;
  }
  const problems = pdfProblems(info, {
    ...(doc.maxPages !== undefined ? { maxPages: doc.maxPages } : {}),
    phrases: doc.phrases,
  });
  return { pdfPath, info, problems, usedFallback };
}

// HTML string → PDF file with Playwright's Chromium. The HTML is written next to the PDF
// (out/html/) first, so relative stylesheet and font paths resolve over file:// and the page
// can be opened in a browser for debugging.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Browser } from 'playwright';

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

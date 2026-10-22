// Inspects a generated PDF: page count, fonts (embedded or not) and the extracted text.
// Used by `npm run pdf` after every document and by the PDF tests.
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface PdfFont {
  /** BaseFont without the subset prefix, e.g. `SchibstedGrotesk-Regular`. */
  name: string;
  subtype: string;
  embedded: boolean;
}

export interface PdfInfo {
  pages: number;
  fonts: PdfFont[];
  /** Text of all pages, whitespace collapsed. */
  text: string;
}

const name = (dict: PDFDict, key: string): string =>
  (dict.get(PDFName.of(key))?.toString() ?? '').replace(/^\//, '');

function fontsOf(doc: PDFDocument): PdfFont[] {
  const fonts: PdfFont[] = [];
  const descriptors = new Map<string, boolean>();
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFDict)) continue;
    if (name(obj, 'Type') === 'FontDescriptor') {
      const embedded = ['FontFile', 'FontFile2', 'FontFile3'].some((k) => obj.has(PDFName.of(k)));
      descriptors.set(name(obj, 'FontName'), embedded);
    }
  }
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFDict) || name(obj, 'Type') !== 'Font') continue;
    const subtype = name(obj, 'Subtype');
    // Composite fonts point at a descendant that carries the descriptor; report the descendant.
    if (subtype === 'Type0') continue;
    const base = name(obj, 'BaseFont');
    fonts.push({
      name: base.replace(/^[A-Z]{6}\+/, ''),
      subtype,
      // Type 3 fonts are drawn glyph by glyph inside the PDF: present, but not real fonts.
      embedded: subtype === 'Type3' ? false : (descriptors.get(base) ?? false),
    });
  }
  return fonts;
}

async function textOf(bytes: Uint8Array): Promise<string> {
  const task = getDocument({ data: bytes, useSystemFonts: false, verbosity: 0 });
  const pdf = await task.promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if ('str' in item) parts.push(item.str + (item.hasEOL ? '\n' : ''));
    }
    parts.push('\n');
  }
  await task.destroy();
  return parts.join('').replace(/\s+/g, ' ').trim();
}

export async function inspectPdf(bytes: Uint8Array): Promise<PdfInfo> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  // pdfjs takes ownership of the buffer it gets; hand it a copy.
  return { pages: doc.getPageCount(), fonts: fontsOf(doc), text: await textOf(bytes.slice()) };
}

export interface PdfExpectations {
  maxPages?: number;
  /** Phrases that must be found in the extracted text (whitespace-insensitive). */
  phrases?: string[];
}

/** Font families the brand allows in print (static instances of the brand fonts). */
const BRAND_FONT = /^(SchibstedGrotesk|JetBrainsMono)-/;

const squash = (s: string): string => s.replace(/\s+/g, '').toLowerCase();

/** Problems with a generated PDF; empty when it meets the expectations. */
export function pdfProblems(info: PdfInfo, expect: PdfExpectations): string[] {
  const problems: string[] = [];
  if (expect.maxPages !== undefined && info.pages > expect.maxPages) {
    problems.push(`${String(info.pages)} pages, limit ${String(expect.maxPages)}`);
  }
  if (info.fonts.length === 0) problems.push('no fonts — text may be missing');
  for (const f of info.fonts) {
    if (!f.embedded)
      problems.push(`font not embedded as a real font: ${f.name || '?'} (${f.subtype})`);
    else if (!BRAND_FONT.test(f.name))
      problems.push(`fallback font instead of the brand font: ${f.name}`);
  }
  const text = squash(info.text);
  for (const phrase of expect.phrases ?? []) {
    if (!text.includes(squash(phrase))) problems.push(`text not found in PDF: "${phrase}"`);
  }
  return problems;
}

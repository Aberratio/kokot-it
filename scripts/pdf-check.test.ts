import { describe, expect, it } from 'vitest';
import { pdfProblems, type PdfInfo } from './pdf-check.ts';

const good: PdfInfo = {
  pages: 2,
  fonts: [
    { name: 'SchibstedGrotesk-Regular', subtype: 'CIDFontType2', embedded: true },
    { name: 'JetBrainsMono-Medium', subtype: 'CIDFontType2', embedded: true },
  ],
  text: 'Agenci AI dla firm produkcyjnych 70 000–130 000 zł',
};

describe('pdfProblems', () => {
  it('accepts a PDF within limits, with brand fonts and the expected text', () => {
    expect(
      pdfProblems(good, { maxPages: 2, phrases: ['Agenci AI dla firm', '70 000–130 000'] }),
    ).toEqual([]);
  });

  it('reports too many pages, Type 3 or fallback fonts and missing text', () => {
    const bad: PdfInfo = {
      pages: 3,
      fonts: [
        { name: '', subtype: 'Type3', embedded: false },
        { name: 'TimesNewRomanPS-BoldMT', subtype: 'CIDFontType2', embedded: true },
      ],
      text: 'x',
    };
    expect(pdfProblems(bad, { maxPages: 2, phrases: ['Agenci'] })).toEqual([
      '3 pages, limit 2',
      'font not embedded as a real font: ? (Type3)',
      'fallback font instead of the brand font: TimesNewRomanPS-BoldMT',
      'text not found in PDF: "Agenci"',
    ]);
  });

  it('reports a PDF without fonts', () => {
    expect(pdfProblems({ ...good, fonts: [] }, {})).toEqual(['no fonts — text may be missing']);
  });
});

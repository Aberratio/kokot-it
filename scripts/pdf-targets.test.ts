import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { pdfTargets } from './pdf-targets.ts';

const templates = fileURLToPath(new URL('../docs-templates', import.meta.url));

describe('pdfTargets', () => {
  it('maps every document template to <document>-<lang>.pdf', () => {
    expect(pdfTargets(templates).map((t) => t.output)).toEqual([
      'cv-en.pdf',
      'cv-pl.pdf',
      'oferta-en.pdf',
      'oferta-pl.pdf',
    ]);
  });
});

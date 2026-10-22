import { describe, expect, it } from 'vitest';
import { repoTextFiles } from './repo-files.ts';

// D-028: no company data (name, NIP, address) or phone number in the repo — only {{FIELDS}}.

const scanned = repoTextFiles().filter(
  (f) => /^(docs-templates|tests|scripts)\//.test(f.path) && !f.path.endsWith('.test.ts'),
);

describe('documents and fixtures carry no private data', () => {
  it('scans the document sources', () => {
    expect(scanned.map((f) => f.path)).toEqual(
      expect.arrayContaining([
        'docs-templates/oferta-cenowa/data.template.json',
        'docs-templates/oferta-cenowa/data.example.json',
        'tests/fixtures/cv.sample.json',
      ]),
    );
  });

  it('has no phone number or tax id (9+ digits in a row, any grouping)', () => {
    const hits = scanned.flatMap((f) =>
      [...f.text.matchAll(/(?:\+|\b00)?\(?\d(?:[ .()-]{0,2}\d){8,}/g)].map(
        (m) => `${f.path}: ${m[0]}`,
      ),
    );
    expect(hits).toEqual([]);
  });

  it('never puts a number next to NIP, REGON or KRS', () => {
    const hits = scanned.flatMap((f) =>
      [...f.text.matchAll(/\b(?:NIP|REGON|KRS)\b\s*:?\s*\d/g)].map((m) => `${f.path}: ${m[0]}`),
    );
    expect(hits).toEqual([]);
  });
});

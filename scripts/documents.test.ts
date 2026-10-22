import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CvContent } from '../docs-templates/cv/cv.ts';
import { cvContentDir, loadCvSources } from './cv-source.ts';
import { planDocuments } from './documents.ts';

const sample = JSON.parse(
  readFileSync(new URL('../tests/fixtures/cv.sample.json', import.meta.url), 'utf8'),
) as CvContent;
const cv = { dir: 'fixture', pl: sample, en: { ...sample, lang: 'en' as const } };

describe('npm run pdf — document plan', () => {
  it('renders offer PL + EN, the quote template, the example and CV PL + EN in one run', () => {
    const plan = planDocuments({ mode: 'draft', cv, cvDir: 'fixture' });
    expect(plan.docs.map((d) => d.output)).toEqual([
      'oferta-pl.pdf',
      'oferta-en.pdf',
      'oferta-cenowa-szablon-pl.pdf',
      'oferta-cenowa-przyklad-pl.pdf',
      'cv-pl.pdf',
      'cv-en.pdf',
    ]);
    expect(plan.docs.find((d) => d.output === 'oferta-pl.pdf')?.maxPages).toBe(2);
    expect(plan.docs.find((d) => d.output === 'cv-pl.pdf')?.maxPages).toBe(2);
  });

  it('takes the contact e-mail from the CV content', () => {
    const plan = planDocuments({ mode: 'draft', cv, cvDir: 'fixture' });
    expect(plan.docs[0]?.html).toContain('ada@example.com');
  });

  it('skips the CV with a readable note when the content is not available (CI)', () => {
    const plan = planDocuments({ mode: 'draft', cv: null, cvDir: '/nowhere' });
    expect(plan.docs.some((d) => d.output.startsWith('cv-'))).toBe(false);
    expect(plan.notes).toContainEqual(
      expect.stringContaining('CV skipped: no cv.pl.json / cv.en.json in /nowhere'),
    );
  });

  it('warns about TODO_OWNER notes', () => {
    const plan = planDocuments({ mode: 'draft', cv, cvDir: 'fixture' });
    expect(plan.warnings).toContainEqual(
      expect.stringContaining('cv.pl.json skills[1]: TODO_OWNER'),
    );
  });

  it('in final mode warns about unfilled {{FIELDS}} and the draft price list', () => {
    const plan = planDocuments({ mode: 'final', cv: null, cvDir: '/nowhere' });
    expect(plan.docs.map((d) => d.output)).toEqual(['oferta-pl.pdf', 'oferta-en.pdf']);
    expect(plan.warnings).toContainEqual('oferta-pl.pdf: unfilled fields {{EMAIL}}');
    expect(plan.warnings).toContainEqual(expect.stringContaining('pricing.json status is "draft"'));
  });

  it('renders a private filled-in quote and warns about what is still empty', () => {
    const dir = mkdtempSync(join(tmpdir(), 'quote-'));
    const file = join(dir, 'firma-x.json');
    const example = JSON.parse(
      readFileSync(
        new URL('../docs-templates/price-quote/data.example.json', import.meta.url),
        'utf8',
      ),
    ) as Record<string, unknown>;
    writeFileSync(file, JSON.stringify({ ...example, example: undefined }));
    const plan = planDocuments({ mode: 'final', cv, cvDir: 'fixture', quoteFile: file });
    expect(plan.docs.map((d) => d.output)).toContain('oferta-cenowa-firma-x-pl.pdf');
    expect(plan.warnings).toContainEqual(
      'oferta-cenowa-firma-x-pl.pdf: unfilled fields {{ADRES}} {{NAZWA_FIRMY}} {{NIP}} {{OSOBA_PODPISUJACA}}',
    );
  });

  it('stops with a readable message when a private quote file is malformed', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'quote-')), 'broken.json');
    writeFileSync(file, JSON.stringify({ package: 'P2' }));
    expect(() => planDocuments({ mode: 'final', cv: null, cvDir: 'x', quoteFile: file })).toThrow(
      /broken\.json: offer missing; inquiry missing/,
    );
  });
});

describe('CV content location', () => {
  it('comes from CV_CONTENT_DIR, with no default', () => {
    expect(cvContentDir({})).toBeNull();
    expect(cvContentDir({ CV_CONTENT_DIR: '  ' })).toBeNull();
    expect(cvContentDir({ CV_CONTENT_DIR: ' /x ' })).toBe('/x');
  });

  it('is null without a folder or when the folder has no CV files', () => {
    expect(loadCvSources(null)).toBeNull();
    expect(loadCvSources(mkdtempSync(join(tmpdir(), 'cv-')))).toBeNull();
  });

  it('rejects content that breaks the schema', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cv-'));
    writeFileSync(join(dir, 'cv.pl.json'), JSON.stringify({ ...sample, schemaVersion: 3 }));
    writeFileSync(join(dir, 'cv.en.json'), JSON.stringify(sample));
    expect(() => loadCvSources(dir)).toThrow('schemaVersion must be 1');
  });
});

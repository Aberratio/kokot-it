import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { visibleText } from '../shared/html.ts';
import { cvProblems, todoOwnerNotes, type CvContent } from './cv.ts';
import { formatMonth, renderCv } from './render.ts';

// Fictional person: the real CV content never enters this repo.
const sample = JSON.parse(
  readFileSync(new URL('../../tests/fixtures/cv.sample.json', import.meta.url), 'utf8'),
) as CvContent;
const html = renderCv(sample);
const text = visibleText(html);

describe('CV template', () => {
  it('accepts the fixture as valid schemaVersion 1 content', () => {
    expect(cvProblems(sample)).toEqual([]);
  });

  it('reports schema problems', () => {
    expect(
      cvProblems({
        ...sample,
        schemaVersion: 2,
        experience: [{ role: 'x', org: 'y', start: '2020', end: null, highlights: [] }],
      }),
    ).toEqual(['schemaVersion must be 1', 'experience[0].start must be YYYY-MM']);
  });

  it('never renders TODO_OWNER notes, and collects them with their paths', () => {
    expect(text).not.toContain('Fikcyjne pytanie do właścicielki');
    expect(html).not.toContain('TODO_OWNER');
    expect(todoOwnerNotes(sample)).toEqual([
      { path: 'skills[1]', note: 'Fikcyjne pytanie do właścicielki — nie może pojawić się w PDF.' },
    ]);
  });

  it('renders the sections in reading order, as text', () => {
    const order = [
      'Ada Przykładowa',
      'Profil',
      'Kompetencje',
      'Doświadczenie',
      'Projekty',
      'Wykształcenie',
      'Certyfikaty',
      'Języki',
      'Poza pracą',
    ];
    const positions = order.map((s) => text.indexOf(s));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('shows contact by e-mail only, without a phone', () => {
    expect(text).toContain('ada@example.com');
    expect(html).not.toMatch(/tel:|telefon|phone/i);
  });

  it('formats periods, "present" and projects without a link', () => {
    expect(text).toContain('01.2022 – obecnie');
    expect(text).toContain('03.2019 – 12.2021');
    expect(text).toContain('example.com/projekt');
    expect(text).toContain('Projekt w toku w przygotowaniu');
    expect(formatMonth('2021-03', 'en')).toBe('Mar 2021');
  });

  it('can drop the optional section to fit two pages', () => {
    expect(visibleText(renderCv(sample, { omitAdditional: true }))).not.toContain('Poza pracą');
  });

  it('escapes content', () => {
    const evil = { ...sample, summary: ['<script>alert(1)</script>'] };
    expect(renderCv(evil)).not.toContain('<script>alert');
  });
});

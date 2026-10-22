import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cvProblems } from './cv.ts';

const sample = JSON.parse(
  readFileSync(new URL('../../tests/fixtures/cv.sample.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;

describe('cvProblems: education, certifications and languages', () => {
  it('accepts the fictional sample', () => {
    expect(cvProblems(sample)).toEqual([]);
  });

  it('checks every text field, with its path', () => {
    expect(
      cvProblems({
        ...sample,
        education: [{ degree: 'x', field: 'x', institution: 3, start: '2010', end: '2015' }],
        certifications: [{ name: null, issuer: 5 }, 'x'],
        languages: [{ language: 'x' }],
      }),
    ).toEqual([
      'education[0].institution must be a string',
      'certifications[0].name must be a string',
      'certifications[1] must be an object',
      'certifications[0].issuer must be a string or null',
      'certifications[1].issuer must be a string or null',
      'languages[0].level must be a string',
    ]);
  });

  it('still wants arrays', () => {
    expect(cvProblems({ ...sample, education: {}, languages: null })).toEqual([
      'education must be an array',
      'languages must be an array',
    ]);
  });
});

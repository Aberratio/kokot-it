import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CvContent } from '../docs-templates/cv/cv.ts';
import { cvContentDir } from '../scripts/cv-source.ts';
import { normalize, repoTextFiles } from './repo-files.ts';

// The repo will be public; the CV content stays in the private brain (T-06). When the brain
// is reachable, no distinctive CV text may appear in any file git would commit.
// Not checked: the name and the contact e-mail — they are the brand's public contact data
// (D-028) and the site shows them.

const dir = cvContentDir();
const files = ['cv.pl.json', 'cv.en.json'].map((f) => join(dir, f));
const available = files.every((f) => existsSync(f));

/** Distinctive strings from the CV: long sentences, employers, owner notes. */
function cvPhrases(cv: CvContent & Record<string, unknown>): string[] {
  const phrases = new Set<string>();
  const collect = (value: unknown, key = ''): void => {
    if (typeof value === 'string') {
      if (value.length >= 40 || key === 'TODO_OWNER') phrases.add(normalize(value));
    } else if (Array.isArray(value))
      value.forEach((v) => {
        collect(v, key);
      });
    else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value))
        if (k !== 'basics' && k !== 'labels') collect(v, k);
    }
  };
  collect(cv);
  for (const e of cv.experience) if (e.org !== 'kokot.it') phrases.add(normalize(e.org));
  return [...phrases];
}

describe.skipIf(!available)(`CV content stays out of the repo (source: ${dir})`, () => {
  it('no distinctive CV phrase appears in any committable file', () => {
    const phrases = [
      ...new Set(
        files.flatMap((f) =>
          cvPhrases(JSON.parse(readFileSync(f, 'utf8')) as CvContent & Record<string, unknown>),
        ),
      ),
    ];
    expect(phrases.length).toBeGreaterThan(20);
    const leaks: string[] = [];
    for (const file of repoTextFiles()) {
      const text = normalize(file.text);
      for (const phrase of phrases)
        if (text.includes(phrase)) leaks.push(`${file.path}: "${phrase.slice(0, 60)}"`);
    }
    expect(leaks).toEqual([]);
  });
});

it.runIf(!available)('CV content guard skipped: brain not available (CI)', () => {
  expect(available).toBe(false);
});

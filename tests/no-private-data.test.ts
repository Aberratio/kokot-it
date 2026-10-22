import { describe, expect, it } from 'vitest';
import { PHONE_OR_TAX_ID } from '../src/content/guards.ts';
import { repoTextFiles } from './repo-files.ts';

// No company data (name, NIP, address) or phone number in the repo — only {{FIELDS}}.
// Scanned: the README, the document sources, scripts and tests, test files included. Left out
// on purpose: the guard tests, whose job is to feed phone numbers and tax ids to the guards.

const GUARD_TESTS = new Set([
  'src/content/render.test.ts',
  'src/content/guards.test.ts',
  'scripts/dist-guard.test.ts',
]);

const scanned = repoTextFiles().filter(
  (f) =>
    (f.path === 'README.md' || /^(docs-templates|tests|scripts)\//.test(f.path)) &&
    !GUARD_TESTS.has(f.path),
);

/** IPv4 addresses (the DNS table in the README) are not phone numbers. */
const withoutIpAddresses = (text: string): string =>
  text.replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, ' ');

describe('documents and fixtures carry no private data', () => {
  it('scans the README, the document sources and the test files', () => {
    expect(scanned.map((f) => f.path)).toEqual(
      expect.arrayContaining([
        'README.md',
        'docs-templates/price-quote/data.template.json',
        'docs-templates/price-quote/data.example.json',
        'docs-templates/price-quote/requirements.test.ts',
        'tests/fixtures/cv.sample.json',
      ]),
    );
  });

  it('has no phone number or tax id (9+ digits in a row, any grouping)', () => {
    const rule = new RegExp(PHONE_OR_TAX_ID.source, 'g');
    const hits = scanned.flatMap((f) =>
      [...withoutIpAddresses(f.text).matchAll(rule)].map((m) => `${f.path}: ${m[0]}`),
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

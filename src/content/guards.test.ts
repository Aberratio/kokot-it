import { describe, expect, it } from 'vitest';
import { contentViolations, decodeEntities, readableText, standaloneViolations } from './guards.ts';

// Branches of the content rules not covered by the page-level tests in render.test.ts, with a
// near miss for each: a rule that cries wolf gets switched off.

const page = (body: string): string => `<html><body><p>${body}</p></body></html>`;
const rules = (body: string): string[] => contentViolations(page(body));

describe('phone number or tax id', () => {
  it('catches slash-separated numbers', () => {
    expect(rules('600/123/456')).toContain('phone number or tax id');
  });

  it('lets an 8-digit date with slashes through', () => {
    expect(rules('22/10/2026')).toEqual([]);
  });
});

describe('price', () => {
  it.each(['100 zl', '£40', '40 GBP', '1 200 CHF', '&#163;40', '&#x20AC;40'])(
    'catches %s',
    (value) => {
      expect(rules(value)).toContain('price');
    },
  );

  it.each(['zlecenia', 'Zlin', 'chfa'])('lets the word %s through', (value) => {
    expect(rules(value)).toEqual([]);
  });
});

describe('leftover placeholder', () => {
  it('catches TODO and TBD as words', () => {
    expect(rules('TODO: copy')).toContain('buzzword or leftover placeholder');
    expect(rules('TBD')).toContain('buzzword or leftover placeholder');
  });

  it('lets words that contain them through', () => {
    expect(rules('metodologia, TODOS, kontodo, TBDX')).toEqual([]);
  });
});

describe('wording and process references', () => {
  // Built from parts: the repository's own wording guard reads this file.
  const word = ['de', 'mo'].join('');

  it.each([word, `${word}s`, `w ${word.slice(0, 3)}ach`, word.toUpperCase()])(
    'catches %s',
    (value) => {
      expect(rules(value)).toContain('demo wording');
    },
  );

  it('lets demonstrate and similar words through', () => {
    expect(rules('demonstrates the flow, democratic, Demeter')).toEqual([]);
  });

  it.each([
    ['D', '042'],
    ['T', '09'],
    ['Q', '003'],
  ])('catches the planning id %s-%s', (prefix, number) => {
    expect(rules(`${prefix}-${number}`)).toContain('internal process reference');
  });

  it('catches process names and absolute local paths', () => {
    expect(rules(['orche', 'strator'].join(''))).toContain('internal process reference');
    expect(rules(['C:', 'Repos', 'x'].join('/'))).toContain('absolute local path');
    expect(rules(['C:', 'Users', 'x'].join('\\'))).toContain('absolute local path');
  });

  it('lets ticket keys, acceptance criteria and drive letters in prose through', () => {
    expect(rules('SHELF-12, AC1, P2, D-nnn, Q-nnn, plan A: B, c:/tmp')).toEqual([]);
  });
});

describe('private agent record path', () => {
  const claude = ['.cl', 'aude'].join('');

  it.each([
    `C:\\Users\\someone\\${claude}\\memory\\x.md`,
    `C:/Users/someone/${claude}/plans/x.md`,
    `%USERPROFILE%\\${claude}\\projects\\x`,
    `/home/someone/${claude}/qa-evidence/x`,
  ])('catches %s', (value) => {
    expect(rules(value)).toContain('private agent record path');
  });

  it('lets the public settings file and other folders through', () => {
    expect(rules(`~/${claude}/settings.json, ~/${claude}/skills/x`)).toEqual([]);
  });
});

describe('private harness path', () => {
  it('lets a public skill path and ordinary slashes through', () => {
    expect(rules('skills/flow-helm/SKILL.md')).toEqual([]);
    expect(rules('personal/professional development, profiles/teams')).toEqual([]);
  });

  it('catches a path below a real brain, profile or person', () => {
    expect(rules('see profiles/acme/profile.md')).toContain('private harness path');
    expect(rules('(personal/someone/notes.md)')).toContain('private harness path');
  });
});

describe('entities', () => {
  it('decodes named, decimal and hex entities, and leaves unknown ones', () => {
    expect(decodeEntities('&amp;&#160;&#x41;&apos;&bogus;&#0;')).toBe("&\u00a0A'&bogus;&#0;");
  });

  it('reads a phone number hidden behind numeric entities', () => {
    expect(readableText(page('600&#32;123&#32;456'))).toContain('600 123 456');
    expect(rules('600&#32;123&#32;456')).toContain('phone number or tax id');
  });
});

describe('standalone pages', () => {
  it('catch a phone number but not a grouped digit specimen', () => {
    expect(standaloneViolations(page('0123 · 4567 · 89 · € · zł'))).toEqual([]);
    expect(standaloneViolations(page('600 123 456'))).toEqual(['phone number or tax id']);
  });

  it('catch amounts in every listed currency', () => {
    for (const value of ['40 GBP', '£40', '12 zl', '9 CHF']) {
      expect(standaloneViolations(page(value)), value).toEqual(['price amount']);
    }
  });
});

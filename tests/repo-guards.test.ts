import { describe, expect, it } from 'vitest';
import {
  languageViolations,
  tsComments,
  unquoted,
  wordingViolations,
} from '../scripts/repo-guards.ts';
import { repoTextFiles } from './repo-files.ts';

// The words the wording rule rejects, built from parts so this file does not trip the rule.
const DEMO = ['de', 'mo'].join('');
const PLAN_ID = ['D', '-', '042'].join('');

describe('the repository', () => {
  const files = repoTextFiles();

  it('is written in English outside the Polish copy, templates and data', () => {
    expect(files.flatMap((f) => languageViolations(f.path, f.text))).toEqual([]);
  });

  it('has no demo wording, planning ids, process names or local paths', () => {
    expect(files.flatMap((f) => wordingViolations(f.path, f.text))).toEqual([]);
  });
});

describe('languageViolations', () => {
  it('flags Polish in a comment but not in a string literal', () => {
    const code = [
      "const label = 'Zażółć';",
      '// Komentarz po polsku: zażółć',
      '/** English, quoting "miesiąc" and `zł` */',
    ].join('\n');
    expect(languageViolations('src/x.ts', code)).toEqual(['src/x.ts:2: Polish in a comment']);
  });

  it('flags Polish prose in Markdown unless it is quoted code', () => {
    const md = ['# Title', 'Strona główna', 'The `Wypróbuj` heading'].join('\n');
    expect(languageViolations('docs/x.md', md)).toEqual(['docs/x.md:2: Polish in prose']);
  });

  it('flags any Polish in other files and skips the allowed ones', () => {
    expect(languageViolations('src/styles/x.css', 'a {}\n/* tło */')).toEqual([
      'src/styles/x.css:2: Polish text',
    ]);
    expect(languageViolations('src/content/pl.ts', '// treść')).toEqual([]);
    expect(languageViolations('tests/fixtures/x.json', '"Łódź"')).toEqual([]);
    expect(languageViolations('public/tools/a/index.html', 'Łódź')).toEqual([]);
  });

  it('finds comments anywhere in a module', () => {
    const code = 'const a = 1; // tail\nfunction f() {\n  /* inner */\n  return a;\n}\n// end';
    expect(tsComments('x.ts', code).map((c) => c.line)).toEqual([1, 3, 6]);
  });

  it('removes quoted spans', () => {
    expect(unquoted('see `zł` and "miesiąc" and „cudzysłów”')).not.toMatch(/[łąó]/);
  });
});

describe('wordingViolations', () => {
  it('flags demo wording in text, identifiers and file names', () => {
    expect(wordingViolations('src/x.ts', `const ${DEMO}Src = 1;`)).toEqual([
      `src/x.ts:1: demo wording "${DEMO}"`,
    ]);
    expect(wordingViolations(`src/${DEMO}.ts`, '')).toHaveLength(1);
    expect(wordingViolations('x.md', `Dwa ${DEMO.slice(0, 3)}a`)).toHaveLength(1);
    expect(wordingViolations('x.md', 'demonstrates the flow')).toEqual([]);
  });

  it('flags planning ids, process names and absolute local paths', () => {
    expect(wordingViolations('x.md', `see ${PLAN_ID}`)).toEqual([
      `x.md:1: internal planning id "${PLAN_ID}"`,
    ]);
    expect(wordingViolations('x.md', 'the orchestrator')).toHaveLength(1);
    expect(wordingViolations('x.ts', "const dir = 'C:/Repos/x';")).toHaveLength(1);
    expect(wordingViolations('x.md', 'SHELF-12, AC1, P2, Q-nnn')).toEqual([]);
  });

  it('exempts only the guard modules and their tests', () => {
    expect(wordingViolations('src/content/guards.ts', DEMO)).toEqual([]);
    expect(wordingViolations('src/content/guards.test.ts', DEMO)).toEqual([]);
    expect(wordingViolations('scripts/repo-guards.ts', DEMO)).toEqual([]);
    expect(wordingViolations('scripts/other.ts', DEMO)).toHaveLength(1);
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './color.ts';
import {
  CONTRAST_PAIRS,
  parseCustomProperties,
  parseDuration,
  readSceneTokens,
  resolvingReader,
} from './tokens.ts';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const base = parseCustomProperties(css, ':root');
const paper = parseCustomProperties(css, "[data-theme='paper']");
const themes = { dark: resolvingReader(base), paper: resolvingReader(base, paper) };

describe('parseCustomProperties', () => {
  it('reads only the exact top-level selector, not @media overrides', () => {
    const parsed = parseCustomProperties(
      ':root { --a: 1; --b: var(--a) } @media (x) { :root { --a: 2 } } .x { --a: 3 }',
    );
    expect(parsed.get('--a')).toBe('1');
    expect(parsed.get('--b')).toBe('var(--a)');
  });

  it('finds the brand tokens and the paper theme', () => {
    expect(base.get('--color-bg')).toBe('var(--ink-900)');
    expect(paper.get('--color-bg')).toBe('var(--paper-0)');
  });
});

describe('resolvingReader', () => {
  it('resolves nested var() and lets later layers win', () => {
    const read = resolvingReader(
      new Map([
        ['--a', '#000'],
        ['--b', 'var(--a)'],
      ]),
      new Map([['--a', '#fff']]),
    );
    expect(read('--b')).toBe('#fff');
    expect(read('--missing')).toBe('');
  });

  it('refuses circular references', () => {
    const read = resolvingReader(
      new Map([
        ['--a', 'var(--b)'],
        ['--b', 'var(--a)'],
      ]),
    );
    expect(() => read('--a')).toThrow(/Circular/);
  });
});

describe('parseDuration', () => {
  it('reads ms and s', () => {
    expect(parseDuration('1400ms')).toBe(1400);
    expect(parseDuration('0.2s')).toBe(200);
    expect(() => parseDuration('fast')).toThrow();
  });
});

describe('readSceneTokens', () => {
  it('gives the scene numeric colours from tokens.css', () => {
    const tokens = readSceneTokens(themes.dark);
    expect(tokens.colors.bg).toBe(0x07080b);
    expect(tokens.colors.pulseTask).toBe(0xffb547);
    expect(tokens.colors.pulseResult).toBe(0x8fb3ff);
    expect(tokens.motionScale).toBe(1);
    expect(tokens.transitionMs).toBe(1400);
  });

  it('names the missing token instead of rendering black', () => {
    expect(() => readSceneTokens(() => '')).toThrow(/--scene-bg/);
  });
});

describe.each(Object.entries(themes))('WCAG contrast — %s theme', (_, read) => {
  it.each(CONTRAST_PAIRS.map((p) => [p.fg, p.bg, p.min] as const))(
    '%s on %s ≥ %s',
    (fg, bg, min) => {
      expect(contrastRatio(read(fg), read(bg))).toBeGreaterThanOrEqual(min);
    },
  );
});

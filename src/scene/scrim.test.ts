import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hexToRgb } from '../styles/color.ts';
import { themeReaders } from '../styles/tokens.ts';

// The scrim under the text column is --scene-bg at partial opacity, written as plain rgb()
// tokens so that every browser draws it. A colour that needs color-mix() must sit inside an
// @supports block: a color-mix() with var() is accepted at parse time, wins the cascade over
// an earlier fallback, and then computes to nothing (transparent) where color-mix() is missing
// (Safari before 16.2).
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const theme = themeReaders(read('../styles/tokens.css')).dark;
const SITE_CSS = ['../styles/main.css', '../styles/content.css'];

const SCRIM_TOKENS = ['--scene-scrim-strong', '--scene-scrim-soft', '--scene-scrim-narrow'];

interface Declaration {
  /** The at-rules and selectors the declaration sits in, outermost first. */
  context: string[];
  text: string;
}

/** Every declaration of a stylesheet (comments dropped), with its context. */
function declarations(source: string): Declaration[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const found: Declaration[] = [];
  const stack: string[] = [];
  let buffer = '';
  for (const ch of text) {
    if (ch === '{') {
      stack.push(buffer.trim().replace(/\s+/g, ' '));
      buffer = '';
    } else if (ch === '}') {
      if (buffer.trim()) found.push({ context: [...stack], text: buffer.trim() });
      stack.pop();
      buffer = '';
    } else if (ch === ';' && stack.length > 0) {
      found.push({ context: [...stack], text: buffer.trim().replace(/\s+/g, ' ') });
      buffer = '';
    } else {
      buffer += ch;
    }
  }
  return found;
}

const guarded = (context: string[]): boolean =>
  context.some((c) => /^@supports\b.*color-mix\(/.test(c));
const unguarded = (source: string): Declaration[] =>
  declarations(source).filter((d) => d.text.includes('color-mix(') && !guarded(d.context));

describe('scene scrim tokens', () => {
  it.each(SCRIM_TOKENS)('%s is --scene-bg with an alpha', (token) => {
    const match = /^rgb\((\d+) (\d+) (\d+) \/ (0?\.\d+)\)$/.exec(theme(token));
    expect(match, `${token} = ${theme(token)}`).not.toBeNull();
    const [, r, g, b, alpha] = match ?? [];
    expect([Number(r), Number(g), Number(b)]).toEqual(hexToRgb(theme('--scene-bg')));
    expect(Number(alpha)).toBeGreaterThan(0);
    expect(Number(alpha)).toBeLessThan(1);
  });

  it('paints the scrim from the rgb() tokens only, wide and narrow', () => {
    const scrim = declarations(read('../styles/main.css')).filter(
      (d) => d.context.at(-1) === '.scene-scrim' && d.text.startsWith('background'),
    );
    expect(scrim.map((d) => d.text)).toEqual([
      'background: linear-gradient( 90deg, var(--scene-scrim-strong) 0%, var(--scene-scrim-soft) 42%, transparent 72% )',
      'background: var(--scene-scrim-narrow)',
    ]);
  });
});

describe('color-mix() in the site styles', () => {
  it.each(SITE_CSS)('%s uses color-mix() only inside @supports', (path) => {
    expect(unguarded(read(path)).map((d) => `${d.context.join(' > ')} { ${d.text} }`)).toEqual([]);
  });

  it('keeps an opaque card background for browsers without color-mix()', () => {
    const cards = declarations(read('../styles/content.css')).filter((d) =>
      d.context.at(-1)?.includes('.card'),
    );
    expect(cards).toContainEqual({
      context: ['.offer, .card'],
      text: 'background: var(--color-surface)',
    });
    expect(
      cards.some((d) => guarded(d.context) && d.text.startsWith('background: color-mix(')),
    ).toBe(true);
  });

  it('catches the pattern that left the scrim transparent', () => {
    const mix = 'background: color-mix(in srgb, var(--a) 50%, transparent)';
    const broken = `.x { background: red; ${mix}; }`;
    const fixed = `.x { background: red; } @supports (background: color-mix(in srgb, red, blue)) { .x { ${mix}; } }`;
    expect(unguarded(broken)).toHaveLength(1);
    expect(unguarded(fixed)).toHaveLength(0);
    // A comment that mentions color-mix() is not a declaration.
    expect(unguarded('.x { /* color-mix() */ background: red; }')).toHaveLength(0);
  });
});

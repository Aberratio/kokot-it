import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hexToRgb } from '../styles/color.ts';
import { themeReaders } from '../styles/tokens.ts';

// The scrim under the text column is --scene-bg at partial opacity. Browsers without
// color-mix() read the rgb() tokens instead, so those must stay the same colour as --scene-bg.
const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
const read = themeReaders(css).dark;
const mainCss = readFileSync(new URL('../styles/main.css', import.meta.url), 'utf8');

const SCRIM_TOKENS = ['--scene-scrim-strong', '--scene-scrim-soft', '--scene-scrim-narrow'];

describe('scene scrim tokens', () => {
  it.each(SCRIM_TOKENS)('%s is --scene-bg with an alpha', (token) => {
    const match = /^rgb\((\d+) (\d+) (\d+) \/ (0?\.\d+)\)$/.exec(read(token));
    expect(match, `${token} = ${read(token)}`).not.toBeNull();
    const [, r, g, b, alpha] = match ?? [];
    expect([Number(r), Number(g), Number(b)]).toEqual(hexToRgb(read('--scene-bg')));
    expect(Number(alpha)).toBeGreaterThan(0);
    expect(Number(alpha)).toBeLessThan(1);
  });

  it('main.css declares the rgb() fallback before every color-mix() scrim', () => {
    const rules = mainCss
      .split('.scene-scrim {')
      .slice(1)
      .filter((rule) => rule.slice(0, rule.indexOf('}')).includes('color-mix('));
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const body = rule.slice(0, rule.indexOf('}'));
      const fallback = body.indexOf('var(--scene-scrim-');
      const mixed = body.indexOf('color-mix(');
      expect(fallback, body).toBeGreaterThanOrEqual(0);
      expect(fallback, body).toBeLessThan(mixed);
    }
  });
});

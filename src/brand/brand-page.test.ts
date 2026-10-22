import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { discoverPages } from '../build/pages.ts';
import { contrastRatio } from '../styles/color.ts';
import { CONTRAST_PAIRS, themeReaders } from '../styles/tokens.ts';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('/brand/ preview page', () => {
  it('is never built for production', () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const pages = Object.values(discoverPages(root)).map((p) => p.split(sep).join('/'));
    expect(pages.some((p) => p.endsWith('brand/index.html'))).toBe(false);
    expect(pages.some((p) => p.endsWith('en/index.html'))).toBe(true);
  });

  it('stays out of search engines if it is ever served (dev server)', () => {
    expect(read('../../brand/index.html')).toMatch(
      /<meta name="robots" content="noindex, nofollow" \/>/,
    );
  });
});

describe('brand.md contrast tables', () => {
  const doc = read('../../brand.md');
  const themes = themeReaders(read('../styles/tokens.css'));

  it.each(Object.entries(themes))(
    'list every %s-theme ratio as computed from tokens.css',
    (_, t) => {
      for (const pair of CONTRAST_PAIRS) {
        const ratio = contrastRatio(t(pair.fg), t(pair.bg)).toFixed(2);
        expect(doc, `${pair.fg} on ${pair.bg} = ${ratio}`).toContain(ratio);
      }
    },
  );
});

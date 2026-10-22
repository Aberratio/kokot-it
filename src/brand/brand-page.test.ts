import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../styles/color.ts';
import { CONTRAST_PAIRS, themeReaders } from '../styles/tokens.ts';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('/brand/ preview page', () => {
  it('stays out of search engines (meta and Vercel header)', () => {
    expect(read('../../brand/index.html')).toMatch(
      /<meta name="robots" content="noindex, nofollow" \/>/,
    );
    const vercel = JSON.parse(read('../../vercel.json')) as {
      headers?: { source: string; headers: { key: string; value: string }[] }[];
    };
    const rule = vercel.headers?.find((h) => h.source.startsWith('/brand/'));
    expect(rule?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
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

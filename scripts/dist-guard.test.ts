import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { allRoutes, renderPage, routePath } from '../src/content/render.ts';
import { checkDist } from './dist-guard.ts';

describe('checkDist', () => {
  let dist = '';
  const write = (path: string, html: string): void => {
    const file = join(dist, ...path.split('/').filter(Boolean), 'index.html');
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, html);
  };
  const buildAll = (): void => {
    for (const route of allRoutes()) {
      const page = renderPage(route);
      write(
        routePath(route),
        `<html lang="${page.lang}"><head>${page.head}</head><body>${page.body}</body></html>`,
      );
    }
  };

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), 'dist-'));
  });
  afterEach(() => {
    rmSync(dist, { recursive: true, force: true });
  });

  it('passes a complete, clean build', () => {
    buildAll();
    expect(checkDist(dist)).toEqual({ pages: allRoutes().length, failures: [] });
  });

  it('fails a missing dist, a missing page and an unrendered shell', () => {
    expect(checkDist(join(dist, 'nope')).failures).toEqual(['dist/ does not exist']);
    buildAll();
    rmSync(join(dist, 'en', 'projects', 'tiller'), { recursive: true });
    write('/projekty/tiller/', '<html><body><!-- kokot:body --></body></html>');
    expect(checkDist(dist).failures).toEqual([
      '/en/projects/tiller/: page missing from the build',
      'projekty/tiller/index.html: unrendered page shell',
    ]);
  });

  it('fails a content page that leaks a phone number', () => {
    buildAll();
    write('/projekty/tiller/', '<html><body><p>tel. 600 123 456</p></body></html>');
    expect(checkDist(dist).failures).toEqual([
      'projekty/tiller/index.html: phone number or tax id',
    ]);
  });

  it('holds any unlisted page to the full content rules', () => {
    buildAll();
    write('/landing/', '<html><body><p>0123456789</p></body></html>');
    expect(checkDist(dist).failures).toEqual(['landing/index.html: phone number or tax id']);
  });

  it('holds listed standalone pages to contact and amount rules (type specimens show digits)', () => {
    buildAll();
    write(
      '/brand/',
      '<html><body><p>0123 · 4567 · 89 · € · zł</p><p>result · 14 dni</p></body></html>',
    );
    expect(checkDist(dist).failures).toEqual([]);
    for (const price of ['2 400 zł / dzień', '€ 120', '10 tys. netto']) {
      write('/brand/', `<html><body><p>${price}</p></body></html>`);
      expect(checkDist(dist).failures, price).toEqual(['brand/index.html: price amount']);
    }
    write('/brand/', '<html><body><a href="tel:600123456">x</a> biuro@example.pl</body></html>');
    expect(checkDist(dist).failures).toEqual([
      'brand/index.html: tel: link',
      'brand/index.html: unexpected e-mail',
    ]);
  });

  it('requires every reference application and skips its own pages', () => {
    buildAll();
    expect(checkDist(dist, ['tool-a']).failures).toEqual([
      '/tools/tool-a/: reference application missing from the build',
    ]);
    // Sample data inside an application may show amounts and long numbers.
    write('/tools/tool-a/', '<html><body><p>Order 1234567890 · 2 400 zł</p></body></html>');
    expect(checkDist(dist, ['tool-a'])).toEqual({ pages: allRoutes().length, failures: [] });
  });

  it('holds a page under tools/ that is not a locked application to the full rules', () => {
    buildAll();
    write('/tools/stray/', '<html><body><p>2 400 zł</p></body></html>');
    expect(checkDist(dist, ['tool-a']).failures).toContain('tools/stray/index.html: price');
  });

  it('holds the brand preview to the phone and tax id rule', () => {
    buildAll();
    write('/brand/', '<html><body><p>0123456789</p></body></html>');
    expect(checkDist(dist).failures).toEqual(['brand/index.html: phone number or tax id']);
  });

  it('holds route pages to the price rule that type specimens are spared', () => {
    buildAll();
    write('/', '<html lang="pl"><body><p>0123 · 4567 · 89 · 2 400 zł</p></body></html>');
    expect(checkDist(dist).failures).toEqual(['index.html: price']);
  });

  it('fails the wording rules on a route page', () => {
    buildAll();
    // Built from parts: the repository's own wording guard reads this file too.
    const text = ['Recorded', ['de', 'mo'].join(''), 'see', ['D', '042'].join('-')].join(' ');
    write('/en/', `<html lang="en"><body><p>${text}</p></body></html>`);
    expect(checkDist(dist).failures).toEqual([
      ['en/index.html: ', 'de', 'mo wording'].join(''),
      'en/index.html: internal process reference',
    ]);
  });
});

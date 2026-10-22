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
    write('/brand/', '<html><body><p>0123456789 · € · zł</p><p>result · 14 dni</p></body></html>');
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
});

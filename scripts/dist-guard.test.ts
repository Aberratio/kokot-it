import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { allRoutes, renderPage, routePath } from '../src/content/render.ts';
import { checkDist } from './dist-guard.ts';
import { readLock } from './tools-lock.ts';

describe('checkDist', () => {
  let dist = '';
  // Case studies link to their applications; the fixture ships a stub page for each.
  const linkedTools = readLock().map((tool) => tool.slug);
  const sitePages = allRoutes().length + linkedTools.length;
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
    for (const slug of linkedTools) write(`/tools/${slug}/`, '<html><body></body></html>');
  };

  // Content tests replace a real page with a stub, which drops the anchors other pages link to.
  const contentFailures = (): string[] =>
    checkDist(dist).failures.filter((failure) => !failure.includes(': link to a missing '));

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), 'dist-'));
  });
  afterEach(() => {
    rmSync(dist, { recursive: true, force: true });
  });

  it('passes a complete, clean build', () => {
    buildAll();
    expect(checkDist(dist)).toEqual({ pages: sitePages, failures: [] });
  });

  it('fails a missing dist, a missing page and an unrendered shell', () => {
    expect(checkDist(join(dist, 'nope')).failures).toEqual(['dist/ does not exist']);
    buildAll();
    rmSync(join(dist, 'en', 'projects', 'tiller'), { recursive: true });
    write('/projekty/tiller/', '<html><body><!-- kokot:body --></body></html>');
    expect(contentFailures()).toEqual([
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
    expect(checkDist(dist, ['tool-a'])).toEqual({ pages: sitePages, failures: [] });
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
    expect(contentFailures()).toEqual(['index.html: price']);
  });

  it('fails the wording rules on a route page', () => {
    buildAll();
    // Built from parts: the repository's own wording guard reads this file too.
    const text = ['Recorded', ['de', 'mo'].join(''), 'see', ['D', '042'].join('-')].join(' ');
    write('/en/', `<html lang="en"><body><p>${text}</p></body></html>`);
    expect(contentFailures()).toEqual([
      ['en/index.html: ', 'de', 'mo wording'].join(''),
      'en/index.html: internal process reference',
    ]);
  });
  it('fails inline scripts, styles and handlers and external resources (CSP: nothing inline, nothing external)', () => {
    buildAll();
    write(
      '/en/',
      [
        '<html lang="en"><head><style>p{}</style>',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">',
        '<script>console.log(1)</script><script src="//cdn.example.com/x.js"></script>',
        '<script type="application/ld+json">{}</script><link rel="canonical" href="https://kokot.it/en/">',
        '</head><body><p style="color:red">x</p><button onclick="go()">y</button>',
        '<img src="https://example.com/a.png" alt=""><a href="https://github.com/x">ok</a></body></html>',
      ].join(''),
    );
    expect(contentFailures()).toEqual([
      'en/index.html: inline <style>',
      'en/index.html: external resource https://fonts.googleapis.com/css2?family=Inter',
      'en/index.html: inline <script>',
      'en/index.html: external resource //cdn.example.com/x.js',
      'en/index.html: inline style attribute',
      'en/index.html: inline event handler',
      'en/index.html: external resource https://example.com/a.png',
    ]);
  });

  it('reads srcset, poster, data and action, and does not stop at a quoted ">"', () => {
    buildAll();
    write(
      '/landing/',
      [
        '<html><body><img alt="a > b" style="color:red" src="/a.png">',
        '<img src="/a.png" srcset="/a.png 1x, https://e.com/a.png 2x" alt="">',
        '<video poster="https://e.com/p.jpg"></video><object data="https://e.com/o"></object>',
        '<form action="https://e.com/f"></form><meta content="a style=b onclick=c">',
        '<script type="application/LD+JSON">{}</script></body></html>',
      ].join(''),
    );
    expect(checkDist(dist).failures).toEqual([
      'landing/index.html: inline style attribute',
      'landing/index.html: external resource https://e.com/a.png',
      'landing/index.html: external resource https://e.com/p.jpg',
      'landing/index.html: external resource https://e.com/o',
      'landing/index.html: external resource https://e.com/f',
    ]);
  });

  it('resolves a folder link without its slash to its index page and fails javascript: links', () => {
    buildAll();
    write(
      '/landing/',
      [
        '<html><body><a href="/en">a</a><a href="/en#content">b</a><a href="/en#nope">c</a>',
        '<a href="/en/projects">d</a><a href="javascript:void(0)">e</a></body></html>',
      ].join(''),
    );
    expect(checkDist(dist).failures).toEqual([
      'landing/index.html: link to a missing anchor /en#nope',
      'landing/index.html: link to a missing page /en/projects',
      'landing/index.html: javascript: link javascript:void(0)',
    ]);
  });

  it('fails internal links to missing pages and anchors to missing ids', () => {
    buildAll();
    write(
      '/landing/',
      [
        '<html><body><h2 id="here">x</h2><a href="#here">a</a><a href="/#nope">b</a>',
        '<a href="/en/projects/nonexistent/">c</a><a href="/en/?lang=en#content">d</a>',
        '<a href="#gone">e</a><a href="mailto:joanna@kokot.it">f</a><a href="x/">g</a></body></html>',
      ].join(''),
    );
    expect(checkDist(dist).failures).toEqual([
      'landing/index.html: link to a missing anchor /#nope',
      'landing/index.html: link to a missing page /en/projects/nonexistent/',
      'landing/index.html: link to a missing anchor #gone',
      'landing/index.html: relative link x/',
    ]);
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverPages } from '../build/pages.ts';
import { en } from './en.ts';
import { pl } from './pl.ts';
import {
  allRoutes,
  escapeHtml,
  fillShell,
  routeFromFile,
  routePath,
  type Route,
} from './render.ts';
import { contentViolations } from './guards.ts';
import { CONTACT_EMAIL, PROJECT_SLUGS, REPOS } from './types.ts';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Every key path in an object tree, with array lengths, e.g. `hero.title`, `steps[5]`. */
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) {
    return [
      `${path}[${String(value.length)}]`,
      ...value.flatMap((v, i) => shape(v, `${path}[${String(i)}]`)),
    ];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k));
  }
  return [path];
}

function shellPath(route: Route): string {
  return join(ROOT, ...routePath(route).split('/').filter(Boolean), 'index.html');
}

function built(route: Route): string {
  return fillShell(readFileSync(shellPath(route), 'utf8'), route);
}

const pages = allRoutes().map((route) => ({ route, html: built(route) }));

describe('content dictionaries', () => {
  it('have the same keys and list lengths in PL and EN', () => {
    expect(shape(en)).toEqual(shape(pl));
  });

  it('have no empty strings', () => {
    const empty = (v: unknown, path: string): string[] =>
      typeof v === 'string'
        ? v.trim() === '' && !path.endsWith('.code')
          ? [path]
          : []
        : v && typeof v === 'object'
          ? Object.entries(v).flatMap(([k, x]) => empty(x, `${path}.${k}`))
          : [];
    expect(empty(pl, 'pl')).toEqual([]);
    expect(empty(en, 'en')).toEqual([]);
  });
});

describe('routes and page shells', () => {
  it('covers the home page and every case study in both locales', () => {
    expect(allRoutes().map(routePath).sort()).toEqual(
      [
        '/',
        '/en/',
        ...PROJECT_SLUGS.map((s) => `/projekty/${s}/`),
        ...PROJECT_SLUGS.map((s) => `/en/projects/${s}/`),
      ].sort(),
    );
  });

  it('has a shell for every route and no page outside the routes', () => {
    for (const route of allRoutes())
      expect(existsSync(shellPath(route)), routePath(route)).toBe(true);
    const discovered = Object.values(discoverPages(ROOT)).map((file) =>
      routeFromFile(file.slice(ROOT.length)),
    );
    expect(discovered).not.toContain(undefined);
    expect(discovered).toHaveLength(allRoutes().length);
  });

  it('maps shell files to routes', () => {
    expect(routeFromFile('index.html')).toEqual({ locale: 'pl', page: 'home' });
    expect(routeFromFile('en\\index.html')).toEqual({ locale: 'en', page: 'home' });
    expect(routeFromFile('projekty/tiller/index.html')).toEqual({
      locale: 'pl',
      page: 'project',
      slug: 'tiller',
    });
    expect(routeFromFile('en/projects/tiller/index.html')).toEqual({
      locale: 'en',
      page: 'project',
      slug: 'tiller',
    });
    expect(routeFromFile('en/projekty/tiller/index.html')).toBeUndefined();
    expect(routeFromFile('projekty/unknown/index.html')).toBeUndefined();
    expect(routeFromFile('docs-templates/cv/pl.html')).toBeUndefined();
  });

  it('refuses a shell without markers', () => {
    expect(() => fillShell('<html lang="pl"></html>', { locale: 'pl', page: 'home' })).toThrow(
      /kokot:head/,
    );
  });
});

describe('rendered pages', () => {
  it.each(pages)(
    '$route.locale $route.page has lang, canonical and hreflang alternates',
    ({ route, html }) => {
      const pair = (locale: 'pl' | 'en'): string =>
        `https://kokot.it${routePath({ ...route, locale })}`;
      expect(html).toContain(`<html lang="${route.locale}">`);
      expect(html).toContain(`<link rel="canonical" href="https://kokot.it${routePath(route)}" />`);
      expect(html).toContain(`<link rel="alternate" hreflang="pl" href="${pair('pl')}" />`);
      expect(html).toContain(`<link rel="alternate" hreflang="en" href="${pair('en')}" />`);
      expect(html).toContain(`<link rel="alternate" hreflang="x-default" href="${pair('pl')}" />`);
      const other = route.locale === 'pl' ? 'en' : 'pl';
      expect(html).toContain(
        `href="${routePath({ ...route, locale: other })}" hreflang="${other}"`,
      );
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
      expect(html).not.toContain('kokot:head');
      expect(html).not.toContain('kokot:body');
    },
  );

  it('puts the copy into static HTML, without needing JavaScript', () => {
    const home = pages.find((p) => p.route.page === 'home' && p.route.locale === 'pl');
    expect(home?.html).toContain(escapeHtml(pl.hero.title));
    expect(home?.html).toContain(
      '<div id="scene-root" class="hero__scene" aria-hidden="true"></div>',
    );
    for (const slug of PROJECT_SLUGS) expect(home?.html).toContain(`href="/projekty/${slug}/"`);
    const enHome = pages.find((p) => p.route.page === 'home' && p.route.locale === 'en');
    for (const slug of PROJECT_SLUGS)
      expect(enHome?.html).toContain(`href="/en/projects/${slug}/"`);
  });

  it('gives every case study a lazy recorded demo slot with a text fallback', () => {
    for (const { route, html } of pages) {
      if (route.page !== 'project') continue;
      expect(html).toContain(`data-demo-src="/demos/${route.slug}/index.html?embed=1"`);
      expect(html).toContain('class="demo__fallback"');
      expect(html).not.toContain('<iframe');
    }
  });

  it('marks unpublished repositories as placeholders and links only public ones', () => {
    for (const { route, html } of pages) {
      if (route.page !== 'project') continue;
      const repo = REPOS[route.slug];
      if (repo.public) {
        expect(html).toContain(`href="https://github.com/${repo.name}"`);
        expect(html).not.toContain('data-placeholder');
      } else {
        expect(html).toContain('data-placeholder="repo-link"');
        expect(html).not.toContain(`href="https://github.com/${repo.name}"`);
      }
    }
  });
});

describe('content guards', () => {
  it.each(pages)('$route.locale $route.page breaks no content rule', ({ html }) => {
    expect(contentViolations(html)).toEqual([]);
    expect(new Set(html.match(/mailto:[^"]+/g))).toEqual(new Set([`mailto:${CONTACT_EMAIL}`]));
  });

  it('catches phone numbers, tax ids, prices, other e-mails and buzzwords', () => {
    const page = (body: string): string => `<html><body><p>${body}</p></body></html>`;
    expect(contentViolations(page('tel. +48 600 123 456'))).toContain('phone number');
    expect(contentViolations(page('NIP 123-456-78-90'))).toContain('company registry id');
    expect(contentViolations(page('1234567890'))).toContain('10-digit number');
    expect(contentViolations(page('od 10 000 zł netto'))).toContain('price');
    expect(contentViolations(page('przed złożeniem wniosku'))).toEqual([]);
    expect(contentViolations('<a href="mailto:x@example.com">x</a>')).toContain(
      'unexpected e-mail',
    );
    expect(contentViolations('<a href="tel:600123456">call</a>')).toContain('tel: link');
    expect(contentViolations(page('rewolucja AI'))).toContain('buzzword or leftover placeholder');
  });

  it('keeps anchor ids URL-safe', () => {
    for (const c of [pl, en]) {
      for (const id of Object.values(c.anchors)) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('always states under a case-study demo that it is recorded and makes no API calls', () => {
    for (const { route, html } of pages) {
      if (route.page !== 'project') continue;
      const note = escapeHtml(
        route.locale === 'pl' ? pl.caseStudy.demoNote : en.caseStudy.demoNote,
      );
      expect(html).toMatch(new RegExp(`<figcaption>[^]*${note}[^]*</figcaption>`));
    }
  });
});

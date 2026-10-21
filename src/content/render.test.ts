import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverPages } from '../build/pages.ts';
import { LOCALES } from '../i18n/index.ts';
import { en } from './en.ts';
import { pl } from './pl.ts';
import {
  allRoutes,
  content,
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

  it('sets <html lang> from the route, whatever the shell says', () => {
    const shell = (tag: string): string =>
      `<!doctype html>\n${tag}<head><!-- kokot:head --></head><body><!-- kokot:body --></body></html>`;
    const en = { locale: 'en', page: 'home' } as const;
    expect(fillShell(shell('<html lang="pl">'), en)).toMatch(/^<!doctype html>\n<html lang="en">/);
    expect(fillShell(shell('<html>'), en)).toMatch(/^<!doctype html>\n<html lang="en">/);
    expect(fillShell(shell('<html lang="pl" class="x">'), en)).toMatch(
      /^<!doctype html>\n<html lang="en">/,
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

describe('required sections', () => {
  const html = (route: Route): string =>
    pages.find((p) => JSON.stringify(p.route) === JSON.stringify(route))?.html ?? '';

  it.each(LOCALES)('%s home page has every section and its copy', (locale) => {
    const c = content(locale);
    const page = html({ locale, page: 'home' });
    for (const id of Object.values(c.anchors)) expect(page).toContain(`id="${id}"`);
    const required = [
      c.services.title,
      c.services.manufacturing.title,
      c.services.devTeams.title,
      ...c.services.manufacturing.offers.map((o) => o.title),
      ...c.services.devTeams.offers.map((o) => o.title),
      c.process.title,
      ...c.process.steps.map((s) => s.title),
      c.process.grants.title,
      // The honest grant wording is the point of the section: pin every line of it.
      ...c.process.grants.does.points,
      ...c.process.grants.doesNot.points,
      c.process.grants.asOf,
      c.projects.title,
      c.about.title,
      ...c.about.principles.map((p) => p.title),
      c.contact.title,
    ];
    for (const text of required) expect(page).toContain(escapeHtml(text));
    expect(page).toContain(`href="${escapeHtml(c.process.grants.source.href)}"`);
    expect(['P1', 'P2', 'P3'].every((code) => page.includes(`>${code}</span>`))).toBe(true);
  });

  it.each(LOCALES.flatMap((locale) => PROJECT_SLUGS.map((slug) => ({ locale, slug }))))(
    '$locale $slug case study has problem, solution, demo, stack and repository',
    ({ locale, slug }) => {
      const route: Route = { locale, page: 'project', slug };
      const c = content(route.locale);
      const study = c.caseStudies[slug];
      const page = html(route);
      for (const heading of [
        c.caseStudy.problem,
        c.caseStudy.solution,
        c.caseStudy.demo,
        c.caseStudy.stack,
        c.caseStudy.repo,
      ]) {
        expect(page).toMatch(new RegExp(`<h2 id="[a-z]+-title">${escapeHtml(heading)}</h2>`));
      }
      for (const text of [...study.problem, ...study.solution.points, ...study.stack]) {
        expect(page).toContain(escapeHtml(text));
      }
      // The note must sit inside the figcaption, so it stays when the iframe replaces the fallback.
      const caption = /<figcaption>([\s\S]*?)<\/figcaption>/.exec(page)?.[1] ?? '';
      expect(caption).toContain(escapeHtml(c.caseStudy.demoNote));
    },
  );
});

describe('content guards', () => {
  it.each(pages)('$route.locale $route.page breaks no content rule', ({ html }) => {
    expect(contentViolations(html)).toEqual([]);
    expect(new Set(html.match(/mailto:[^"]+/g))).toEqual(new Set([`mailto:${CONTACT_EMAIL}`]));
  });

  const page = (body: string): string => `<html><body><p>${body}</p></body></html>`;

  it.each([
    '+48 600 123 456',
    '+48600123456',
    '0048 600 123 456',
    '600 123 456',
    '600-123-456',
    '600 12 34 56',
    '71 123 45 67',
    '(71) 123 45 67',
    '600&nbsp;123&nbsp;456',
    '123-456-78-90',
    '123-45-67-890',
    '123 456 78 90',
    '1234567890',
    '123456789',
  ])('catches the phone or tax id %s', (value) => {
    expect(contentViolations(page(value))).toContain('phone number or tax id');
  });

  it('catches registry labels and EU VAT ids', () => {
    expect(contentViolations(page('NIP: do uzupełnienia'))).toContain('company registry id');
    expect(contentViolations(page('REGON'))).toContain('company registry id');
    expect(contentViolations(page('PL1234567890'))).toContain('company registry id');
  });

  it('reads attributes too, not only visible text', () => {
    expect(contentViolations('<meta name="description" content="Tel. 600 123 456" />')).toContain(
      'phone number or tax id',
    );
    expect(contentViolations('<img alt="NIP" src="x.png" />')).toContain('company registry id');
  });

  it('lets dates, ranges and ordinary numbers through', () => {
    expect(contentViolations(page('Nabór: 2–30 listopada 2026, stan na 21.10.2026'))).toEqual([]);
    expect(contentViolations(page('30.11.2026, 3–5 procesów, 2–3 przypadki, 50%'))).toEqual([]);
    expect(contentViolations(page('przed złożeniem wniosku'))).toEqual([]);
  });

  it('catches prices', () => {
    for (const value of ['od 10 000 zł netto', '70 tys. zł', '16 PLN', '€200', '$5', '120 tys.']) {
      expect(contentViolations(page(value)), value).toContain('price');
    }
  });

  it('allows only the contact address, in links and in text', () => {
    expect(contentViolations(`<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`)).toEqual([]);
    expect(contentViolations('<a href="mailto:x@example.com">x</a>')).toContain(
      'unexpected e-mail',
    );
    expect(contentViolations(page('biuro@example.pl'))).toContain('unexpected e-mail');
    expect(contentViolations('<a href="tel:600123456">call</a>')).toContain('tel: link');
  });

  it.each(['rewolucja AI', 'AI magic', 'Strona w budowie.', 'Wkrótce', 'Coming soon', 'TODO'])(
    'catches the buzzword or placeholder %s',
    (value) => {
      expect(contentViolations(page(value))).toContain('buzzword or leftover placeholder');
    },
  );

  it('keeps anchor ids URL-safe', () => {
    for (const c of [pl, en]) {
      for (const id of Object.values(c.anchors)) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});

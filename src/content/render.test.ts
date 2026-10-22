import { existsSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverPages } from '../build/pages.ts';
import { LOCALES } from '../i18n/index.ts';
import { en } from './en.ts';
import { pl } from './pl.ts';
import { allRoutes, content, fillShell, routeFromFile, routePath, type Route } from './render.ts';
import { contentViolations } from './guards.ts';
import { escapeHtml } from './html.ts';
import { CONTACT_EMAIL, isToolSlug, PROJECT_SLUGS, REPOS } from './types.ts';

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

  it('has a shell for every route and no unknown page', () => {
    for (const route of allRoutes())
      expect(existsSync(shellPath(route)), routePath(route)).toBe(true);
    const files = Object.values(discoverPages(ROOT)).map((file) =>
      file.slice(ROOT.length).split(sep).join('/'),
    );
    // Every built page is a route; the brand preview (brand/index.html) is a dev-only page.
    expect(files.map(routeFromFile)).not.toContain(undefined);
    expect(files).toHaveLength(allRoutes().length);
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
    expect(fillShell(shell("<html lang='pl'>"), en)).toMatch(/^<!doctype html>\n<html lang="en">/);
    expect(fillShell(shell('<html lang=pl>'), en)).toMatch(/^<!doctype html>\n<html lang="en">/);
    expect(fillShell(shell('<html lang="pl" class="x">'), en)).toMatch(
      /^<!doctype html>\n<html lang="en" class="x">/,
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

  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });

  it.each(LOCALES)('%s home page leaves the scene container empty for the scene', (locale) => {
    const home = pages.find((p) => p.route.page === 'home' && p.route.locale === locale);
    expect(home?.html).toContain(
      '<div id="scene-root" class="hero__scene" aria-hidden="true"></div>',
    );
    expect(home?.html).not.toContain('<canvas');
  });

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

  it('gives every tool case study a lazy application slot with a text fallback, the rest a static transcript', () => {
    for (const { route, html } of pages) {
      if (route.page !== 'project') continue;
      // The iframe is added by src/embed.ts; the static page carries only the fallback.
      expect(html).not.toContain('<iframe');
      if (!isToolSlug(route.slug)) {
        // The illustrative log is text in the page: no slot to fill, nothing to fetch.
        expect(content(route.locale).caseStudies[route.slug].transcript).toBeDefined();
        expect(html).toContain('<figure class="transcript">');
        expect(html).not.toContain('data-tool-src');
        continue;
      }
      const c = content(route.locale).caseStudy;
      expect(html).toContain(
        `data-tool-src="/tools/${route.slug}/?embed=1&amp;lang=${route.locale}"`,
      );
      expect(html).toContain(`data-tool="${route.slug}"`);
      expect(html).toContain(`<p class="tool__fallback">${escapeHtml(c.toolFallback)}</p>`);
      // The application also opens on its own page, announced as a new tab.
      expect(html).toContain(
        `<a href="/tools/${route.slug}/?lang=${route.locale}" target="_blank" rel="noopener">${escapeHtml(c.toolOpen)}<span class="visually-hidden"> (${escapeHtml(c.newTab)})</span></a>`,
      );
    }
  });

  it('sets rel="noopener" only on links that open a new tab', () => {
    for (const { html } of pages) {
      for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
        expect(tag.includes('rel="noopener"'), tag).toBe(tag.includes('target="_blank"'));
      }
    }
  });

  it('marks unpublished repositories as placeholders and links only public ones', () => {
    for (const { route, html } of pages) {
      if (route.page !== 'project') continue;
      const repo = REPOS[route.slug];
      const labels = content(route.locale).caseStudy;
      if (repo.public) {
        expect(html).toContain(`href="https://github.com/${repo.name}"`);
        expect(html).toContain(`(${escapeHtml(labels.repoPublic)})`);
        expect(html).not.toContain('data-placeholder');
      } else {
        expect(html).toMatch(
          new RegExp(
            `<p class="repo repo--pending" data-placeholder="repo-link"><span class="repo__name">github\\.com/${repo.name}</span> \\(${labels.repoPending}\\)</p>`,
          ),
        );
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
    '$locale $slug case study has problem, solution, preview, stack and repository',
    ({ locale, slug }) => {
      const route: Route = { locale, page: 'project', slug };
      const c = content(route.locale);
      const study = c.caseStudies[slug];
      const page = html(route);
      for (const heading of [
        c.caseStudy.problem,
        c.caseStudy.solution,
        isToolSlug(slug) ? c.caseStudy.tryIt : study.preview.title,
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
      // A static transcript is not a recording, so it carries its own note instead.
      expect(caption).toContain(escapeHtml(study.transcript?.note ?? c.caseStudy.toolNote));
    },
  );
});

describe('repository labels', () => {
  // The deliberately marked placeholder for a repository that is still private.
  it('say the repositories will be made public', () => {
    expect(pl.caseStudy.repoPending).toBe('repo zostanie upublicznione po przeglądzie');
    expect(en.caseStudy.repoPending).toBe('the repository will be made public after review');
  });
});

describe('about kokot.it', () => {
  // No team or subcontractor promise: kokot.it runs the project directly.
  it('promises neither a team nor subcontractors', () => {
    for (const text of [...pl.about.text, ...en.about.text]) {
      expect(text).not.toMatch(
        /specjali|zespó|podwykonaw|osoba prowadząca|specialist|team|subcontract|one lead/i,
      );
    }
    expect(pl.about.text.join(' ')).toContain('Projekt prowadzi bezpośrednio kokot.it');
    expect(en.about.text.join(' ')).toContain('kokot.it runs each project directly');
  });
});

describe('grant wording', () => {
  // The honest framing agreed for the Dig.IT section, pinned as phrases: the copy may be
  // reworded around them, but not lose them.
  it('says what kokot.it does and does not do, in both languages', () => {
    const plText = [...pl.process.grants.does.points, ...pl.process.grants.doesNot.points].join(
      ' ',
    );
    expect(plText).toContain('przygotowuje ofertę wykonawcy do wniosku');
    expect(plText).toContain('nie pisze wniosków o dotację');
    expect(plText).toContain('nie obiecuje uzyskania dotacji');
    expect(plText).toContain('nie zaczyna prac objętych projektem przed złożeniem wniosku');
    const enText = [...en.process.grants.does.points, ...en.process.grants.doesNot.points].join(
      ' ',
    );
    expect(enText).toContain('prepares the contractor’s quote for the application');
    expect(enText).toContain('does not write grant applications');
    expect(enText).toContain('does not promise that the grant will be awarded');
    expect(enText).toContain('does not start work covered by the project before the application');
  });
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

  it('reads single-quoted and data-* attributes and JSON-LD', () => {
    expect(contentViolations("<meta name='description' content='NIP' />")).toContain(
      'company registry id',
    );
    expect(contentViolations('<div data-phone="600 123 456"></div>')).toContain(
      'phone number or tax id',
    );
    expect(
      contentViolations(
        '<script type="application/ld+json">{"telephone":"+48 600 123 456"}</script>',
      ),
    ).toContain('phone number or tax id');
    expect(contentViolations("<a href='tel:600123456'>x</a>")).toContain('tel: link');
  });

  it('does not mistake asset names for e-mail addresses', () => {
    expect(contentViolations(page('logo@2x.png'))).toEqual([]);
  });

  it('catches prices', () => {
    for (const value of [
      'od 10 000 zł netto',
      '70 tys. zł',
      '16 PLN',
      '€200',
      '$5',
      '120 tys.',
      'sto złotych',
      'około 70k',
      'cena netto',
    ]) {
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

  it.each([
    'rewolucja AI',
    'AI magic',
    'Strona w budowie.',
    'Wkrótce',
    'Coming soon',
    'TODO',
    'TBA',
    'XXX',
    'Adres: do uzupełnienia',
  ])('catches the buzzword or placeholder %s', (value) => {
    expect(contentViolations(page(value))).toContain('buzzword or leftover placeholder');
  });

  // The public pattern sets of tiller’s lib/leak-guard.sh and the private harness paths.
  it('catches the credential shapes and private paths of tiller’s leak guard', () => {
    for (const value of [
      'ghp_' + 'A'.repeat(24),
      'github_pat_' + 'a'.repeat(22),
      'sk-ant-' + 'x'.repeat(12),
      'AKIA' + 'A'.repeat(16),
      ['-----BEGIN', 'RSA PRIVATE KEY-----'].join(' '),
    ]) {
      expect(contentViolations(page(value)), value).toContain('credential shape');
    }
    // Built from parts, so this file does not itself match the shapes it tests.
    const claude = ['', '.claude', ''].join('/');
    for (const value of [`~${claude}memory/x.md`, `/Users/someone${claude}plans/a.md`]) {
      expect(contentViolations(page(value)), value).toContain('private agent record path');
    }
  });

  it('catches a tiller path that names a real profile, brain, person or the helm', () => {
    for (const value of [
      'profiles/acme/profile.md',
      'brains/acme/decisions.md',
      'personal/someone/leak-terms.txt',
      'helm/events/x.md',
    ]) {
      expect(contentViolations(page(value)), value).toContain('private harness path');
    }
    for (const value of [
      'profiles/_template/profile.md',
      'brains/_template/README.md',
      'personal/_templates/README.md',
      'profiles/&lt;name&gt;/',
      'flow-helm',
    ]) {
      expect(contentViolations(page(value)), value).not.toContain('private harness path');
    }
  });

  it('keeps anchor ids URL-safe', () => {
    for (const c of [pl, en]) {
      for (const id of Object.values(c.anchors)) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});

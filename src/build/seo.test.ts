import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  allRoutes,
  OG_IMAGE,
  ogImagePath,
  renderPage,
  routePath,
  type Route,
} from '../content/render.ts';
import { CONTACT_EMAIL } from '../content/types.ts';
import { LOCALES } from '../i18n/index.ts';
import { robotsTxt, sitemapXml } from './seo.ts';

describe('sitemap.xml', () => {
  const xml = sitemapXml();

  it('lists every page once, with absolute URLs', () => {
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(allRoutes().map((route) => `https://kokot.it${routePath(route)}`));
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('gives every page its PL, EN and x-default alternates', () => {
    const entries = xml.split('<url>').slice(1);
    expect(entries).toHaveLength(allRoutes().length);
    for (const entry of entries) {
      expect(entry.match(/hreflang="pl"/g)).toHaveLength(1);
      expect(entry.match(/hreflang="en"/g)).toHaveLength(1);
      expect(entry.match(/hreflang="x-default"/g)).toHaveLength(1);
    }
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://kokot.it/en/projects/tiller/"/>',
    );
  });

  it('is a sitemap document', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset')).toBe(true);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });
});

describe('robots.txt', () => {
  it('allows the whole site and names the sitemap', () => {
    expect(robotsTxt()).toBe('User-agent: *\nAllow: /\n\nSitemap: https://kokot.it/sitemap.xml\n');
  });
});

describe('social preview images', () => {
  it.each(LOCALES)('%s image is a 1200 × 630 PNG in public/og/', (locale) => {
    const png = readFileSync(new URL(`../../public${ogImagePath(locale)}`, import.meta.url));
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([OG_IMAGE.width, OG_IMAGE.height]);
  });
});

describe('page head', () => {
  const head = (route: Route): string => renderPage(route).head;

  it.each(allRoutes())('$locale $page has Open Graph and Twitter card tags', (route) => {
    const h = head(route);
    const image = `https://kokot.it/og/kokot-it-${route.locale}.png`;
    expect(h).toContain(`<meta property="og:image" content="${image}" />`);
    expect(h).toContain('<meta property="og:image:width" content="1200" />');
    expect(h).toContain('<meta property="og:image:height" content="630" />');
    expect(h).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(h).toContain(`<meta name="twitter:image" content="${image}" />`);
    expect(h).toMatch(/<meta property="og:image:alt" content="[^"]{20,}" \/>/);
    expect(h).toMatch(/<link rel="canonical" href="https:\/\/kokot\.it\/[^"]*" \/>/);
  });

  it('gives every page a title and description of its own, per locale', () => {
    const titles = allRoutes().map((r) => /<title>([^<]+)<\/title>/.exec(head(r))?.[1]);
    const descriptions = allRoutes().map(
      (r) => /<meta name="description" content="([^"]+)"/.exec(head(r))?.[1],
    );
    expect(new Set(titles).size).toBe(allRoutes().length);
    expect(new Set(descriptions).size).toBe(allRoutes().length);
    for (const d of descriptions) expect(d?.length ?? 0).toBeLessThanOrEqual(160);
  });

  it.each(LOCALES)(
    '%s home page describes the business in JSON-LD, without address or phone',
    (locale) => {
      const h = head({ locale, page: 'home' });
      const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '';
      const data = JSON.parse(json) as { '@graph': Record<string, unknown>[] };
      const org = data['@graph'].find((n) => n['@type'] === 'ProfessionalService');
      expect(org).toMatchObject({
        name: 'kokot.it',
        url: 'https://kokot.it/',
        email: CONTACT_EMAIL,
        knowsLanguage: ['pl', 'en'],
      });
      for (const key of ['address', 'telephone', 'taxID', 'vatID', 'faxNumber', 'geo']) {
        expect(json).not.toContain(`"${key}"`);
      }
      expect(data['@graph'].find((n) => n['@type'] === 'WebSite')).toMatchObject({
        inLanguage: locale,
      });
    },
  );

  it('puts JSON-LD on the home pages only', () => {
    for (const route of allRoutes()) {
      expect(head(route).includes('application/ld+json')).toBe(route.page === 'home');
    }
  });
});

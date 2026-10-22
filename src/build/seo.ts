import { DEFAULT_LOCALE, LOCALES } from '../i18n/index.ts';
import { allRoutes, counterpart, routePath, type Route } from '../content/render.ts';
import { SITE_ORIGIN } from '../content/types.ts';

// sitemap.xml and robots.txt, emitted into dist/ by the content plugin. Every page is listed
// with its language alternates. The embedded applications under /tools/ are not listed;
// their standalone pages carry `X-Robots-Tag: noindex` (vercel.json) instead of a robots.txt
// block, so a crawler that follows a link to them learns not to index them.

const absolute = (path: string): string => `${SITE_ORIGIN}${path}`;

function alternates(route: Route): string[] {
  const links = LOCALES.map(
    (locale) =>
      `    <xhtml:link rel="alternate" hreflang="${locale}" href="${absolute(routePath(counterpart(route, locale)))}"/>`,
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(routePath(counterpart(route, DEFAULT_LOCALE)))}"/>`,
  );
  return links;
}

export function sitemapXml(routes: readonly Route[] = allRoutes()): string {
  const urls = routes.map((route) =>
    [
      `  <url>`,
      `    <loc>${absolute(routePath(route))}</loc>`,
      ...alternates(route),
      `  </url>`,
    ].join('\n'),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function robotsTxt(): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${absolute('/sitemap.xml')}`, ''].join('\n');
}

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { contentViolations, standaloneViolations } from '../src/content/guards.ts';
import { allRoutes, routePath } from '../src/content/render.ts';

// Checks a built dist/ directory: every route page exists and was rendered; route pages pass
// every content guard (phone, tax id, prices, e-mails, placeholders, wording), and so does any
// other page except STANDALONE_PAGES (the brand preview and its type specimens: contact, phone
// and amount rules) and the embedded reference applications under tools/<slug>/. Those site
// pages also keep to the CSP (nothing inline, nothing external) and their links resolve.

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

export interface DistReport {
  pages: number;
  failures: string[];
}

/** Pages that are not site content and may show digits: the brand preview, should it be built. */
export const STANDALONE_PAGES: readonly string[] = ['brand/index.html'];

const routeFile = (path: string): string =>
  [...path.split('/').filter(Boolean), 'index.html'].join('/');

/**
 * `tools` are the slugs of the reference applications (tools.lock.json). Each must ship its
 * `tools/<slug>/index.html`; their pages are the applications' own builds, held to their own
 * repositories' wording checks (sample data there legitimately shows amounts and numbers).
 */
export function checkDist(dist: string, tools: readonly string[] = []): DistReport {
  if (!existsSync(dist)) return { pages: 0, failures: ['dist/ does not exist'] };
  const failures: string[] = [];
  const routeFiles = new Set(allRoutes().map((route) => routeFile(routePath(route))));
  for (const route of allRoutes()) {
    if (!existsSync(join(dist, routeFile(routePath(route))))) {
      failures.push(`${routePath(route)}: page missing from the build`);
    }
  }
  for (const slug of tools) {
    if (!existsSync(join(dist, 'tools', slug, 'index.html'))) {
      failures.push(`/tools/${slug}/: reference application missing from the build`);
    }
  }
  const pages = new Map<string, string>();
  for (const file of htmlFiles(dist)) {
    const name = relative(dist, file).split(sep).join('/');
    if (tools.some((slug) => name.startsWith(`tools/${slug}/`))) continue;
    pages.set(name, readFileSync(file, 'utf8'));
  }
  for (const [name, html] of pages) {
    // A shell the content plugin did not fill would ship an empty page.
    if (html.includes('<!-- kokot:')) failures.push(`${name}: unrendered page shell`);
    const standalone = STANDALONE_PAGES.includes(name) && !routeFiles.has(name);
    const rules = standalone ? standaloneViolations : contentViolations;
    for (const violation of rules(html)) failures.push(`${name}: ${violation}`);
    for (const violation of cspViolations(html)) failures.push(`${name}: ${violation}`);
  }
  const ids = new Map([...pages].map(([name, html]) => [name, idsOf(html)]));
  for (const [name, html] of pages) {
    for (const violation of linkViolations(dist, name, html, ids)) {
      failures.push(`${name}: ${violation}`);
    }
  }
  return { pages: pages.size, failures };
}

const TAG = /<([a-zA-Z][\w-]*)\b([^>]*)>/g;

const attr = (attrs: string, key: string): string | undefined => {
  const match = new RegExp(`\\s${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs);
  return match === null ? undefined : (match[1] ?? match[2] ?? match[3]);
};

const isExternal = (url: string): boolean => /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(url);

/** Links that only name the page, not load anything into it. */
const NAVIGATION_RELS = new Set(['canonical', 'alternate']);

/**
 * The site's CSP allows nothing inline and nothing external (headers.test.ts holds the header),
 * and a violation fails only in the browser console, so the built pages are held to it here:
 * no `<style>`, no inline `<script>` (JSON-LD data blocks are not executed), no `style=` or
 * `on*=` attributes, and no `src` or loaded `<link>` from another origin.
 */
export function cspViolations(html: string): string[] {
  const found: string[] = [];
  for (const [, tag = '', attrs = ''] of html.matchAll(TAG)) {
    const name = tag.toLowerCase();
    const src = attr(attrs, 'src');
    if (name === 'style') found.push('inline <style>');
    if (name === 'script' && src === undefined && attr(attrs, 'type') !== 'application/ld+json') {
      found.push('inline <script>');
    }
    if (/\sstyle\s*=/i.test(attrs)) found.push('inline style attribute');
    if (/\son[a-z]+\s*=/i.test(attrs)) found.push('inline event handler');
    if (src !== undefined && isExternal(src)) found.push(`external resource ${src}`);
    const href = attr(attrs, 'href');
    const rels = (attr(attrs, 'rel') ?? '').toLowerCase().split(/\s+/);
    if (name === 'link' && href !== undefined && isExternal(href)) {
      if (!rels.every((rel) => NAVIGATION_RELS.has(rel))) found.push(`external resource ${href}`);
    }
  }
  return found;
}

const idsOf = (html: string): Set<string> =>
  new Set([...html.matchAll(TAG)].flatMap(([, , attrs = '']) => attr(attrs, 'id') ?? []));

/**
 * Every `<a href>` inside the site resolves: root-relative paths to a built file (`/x/` to
 * `x/index.html`), `#id` to an element of the target page. Other schemes are not checked.
 */
function linkViolations(
  dist: string,
  page: string,
  html: string,
  ids: ReadonlyMap<string, Set<string>>,
): string[] {
  const found: string[] = [];
  for (const [, tag = '', attrs = ''] of html.matchAll(TAG)) {
    const href = attr(attrs, 'href')?.replaceAll('&amp;', '&');
    if (tag.toLowerCase() !== 'a' || href === undefined) continue;
    if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) continue;
    const [path = '', hash = ''] = href.split('#');
    const bare = path.split('?')[0] ?? '';
    if (bare !== '' && !bare.startsWith('/')) {
      found.push(`relative link ${href}`);
      continue;
    }
    const target = bare === '' ? page : bare.endsWith('/') ? routeFile(bare) : bare.slice(1);
    if (!existsSync(join(dist, ...target.split('/')))) {
      found.push(`link to a missing page ${href}`);
    } else if (hash !== '' && ids.has(target) && !ids.get(target)?.has(hash)) {
      found.push(`link to a missing anchor ${href}`);
    }
  }
  return found;
}

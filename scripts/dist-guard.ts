import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { contentViolations, standaloneViolations } from '../src/content/guards.ts';
import { allRoutes, routePath } from '../src/content/render.ts';

// Checks a built dist/ directory: every route page exists and was rendered; route pages pass
// every content guard (phone, tax id, prices, e-mails, placeholders, wording), and so does any
// other page except STANDALONE_PAGES (the brand preview and its type specimens: contact, phone
// and amount rules) and the embedded reference applications under tools/<slug>/.

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

/** Built pages that are not site content and may show digits (the brand preview). */
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
  const files = htmlFiles(dist);
  let checked = 0;
  for (const file of files) {
    const name = relative(dist, file).split(sep).join('/');
    if (tools.some((slug) => name.startsWith(`tools/${slug}/`))) continue;
    checked += 1;
    const html = readFileSync(file, 'utf8');
    // A shell the content plugin did not fill would ship an empty page.
    if (html.includes('<!-- kokot:')) failures.push(`${name}: unrendered page shell`);
    const standalone = STANDALONE_PAGES.includes(name) && !routeFiles.has(name);
    const rules = standalone ? standaloneViolations : contentViolations;
    for (const violation of rules(html)) failures.push(`${name}: ${violation}`);
  }
  return { pages: checked, failures };
}

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { contactViolations, contentViolations } from '../src/content/guards.ts';
import { allRoutes, routePath } from '../src/content/render.ts';

// Checks a built dist/ directory: every route page exists and was rendered; route pages pass
// every content guard (phone, tax id, prices, e-mails, placeholders), and any other HTML page
// (e.g. the brand preview with its type specimens) passes the contact guards (D-028).

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

const routeFile = (path: string): string =>
  [...path.split('/').filter(Boolean), 'index.html'].join('/');

export function checkDist(dist: string): DistReport {
  if (!existsSync(dist)) return { pages: 0, failures: ['dist/ does not exist'] };
  const failures: string[] = [];
  const routeFiles = new Set(allRoutes().map((route) => routeFile(routePath(route))));
  for (const route of allRoutes()) {
    if (!existsSync(join(dist, routeFile(routePath(route))))) {
      failures.push(`${routePath(route)}: page missing from the build`);
    }
  }
  const files = htmlFiles(dist);
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const name = relative(dist, file).split(sep).join('/');
    // A shell the content plugin did not fill would ship an empty page.
    if (html.includes('<!-- kokot:')) failures.push(`${name}: unrendered page shell`);
    const rules = routeFiles.has(name) ? contentViolations : contactViolations;
    for (const violation of rules(html)) failures.push(`${name}: ${violation}`);
  }
  return { pages: files.length, failures };
}

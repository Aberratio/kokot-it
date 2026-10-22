import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Directories that never hold site pages. `brand` is the brand system preview: served by the
 * dev server at /brand/ for review, never built for production.
 */
const IGNORED = new Set([
  'brand',
  'node_modules',
  'dist',
  'out',
  'public',
  'src',
  'scripts',
  'docs-templates',
]);

/**
 * Turns a page's path relative to the project root into a Rollup entry name:
 * `index.html` → `main`, `en/index.html` → `en`, `projekty/foo/index.html` → `projekty/foo`.
 */
export function entryName(relativePath: string): string {
  const posix = relativePath.split(sep).join('/');
  const dir = posix.replace(/\/?index\.html$/, '');
  return dir === '' ? 'main' : dir;
}

/** Walks `root` and returns every `index.html` page as a Rollup input map. */
export function discoverPages(root: string): Record<string, string> {
  const pages: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (dir === root && IGNORED.has(entry.name)) continue;
        walk(full);
      } else if (entry.name === 'index.html') {
        pages[entryName(relative(root, full))] = full;
      }
    }
  };
  walk(root);
  return pages;
}

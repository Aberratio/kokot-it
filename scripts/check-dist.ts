import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { contentViolations } from '../src/content/guards.ts';

// Runs after `vite build` (npm `postbuild`): every HTML page in dist/ must pass the
// content guards, so a phone number or tax id cannot ship even if it bypasses src/content.
const dist = join(import.meta.dirname, '..', 'dist');

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

const files = htmlFiles(dist);
const failures = files.flatMap((file) =>
  contentViolations(readFileSync(file, 'utf8')).map((v) => `${relative(dist, file)}: ${v}`),
);
if (failures.length > 0) {
  console.error(`Content guard failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Content guard: ${String(files.length)} HTML pages in dist/ are clean.`);

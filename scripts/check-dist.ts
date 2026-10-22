import { join } from 'node:path';
import { checkDist } from './dist-guard.ts';
import { readLock } from './tools-lock.ts';

// Runs after `vite build` (npm `postbuild`): a broken or leaking build fails the build step.
const tools = readLock().map((tool) => tool.slug);
const { pages, failures } = checkDist(join(import.meta.dirname, '..', 'dist'), tools);
if (failures.length > 0) {
  console.error(`Content guard failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(
  `Content guard: ${String(pages)} site pages in dist/ are clean; ${String(tools.length)} reference applications present.`,
);

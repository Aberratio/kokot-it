import { join } from 'node:path';
import { checkDist } from './dist-guard.ts';

// Runs after `vite build` (npm `postbuild`): a broken or leaking build fails the build step.
const { pages, failures } = checkDist(join(import.meta.dirname, '..', 'dist'));
if (failures.length > 0) {
  console.error(`Content guard failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Content guard: ${String(pages)} HTML pages in dist/ are clean.`);

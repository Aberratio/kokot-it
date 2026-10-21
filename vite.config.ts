import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { discoverPages } from './src/build/pages.ts';

const root = fileURLToPath(new URL('.', import.meta.url));

// Multi-page build: every index.html outside src/, docs-templates/ etc. is an entry
// (/, /en/, /projekty/<slug>/, /en/projects/<slug>/). All pages share src/main.ts.
export default defineConfig({
  appType: 'mpa',
  build: {
    target: 'es2023',
    // three.js alone is ~500 kB; the scene task will code-split it.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      input: discoverPages(root),
    },
  },
});

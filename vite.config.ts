import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { contentPlugin } from './src/build/content-plugin.ts';
import { readSiteHeaders } from './src/build/headers.ts';
import { discoverPages } from './src/build/pages.ts';

const root = fileURLToPath(new URL('.', import.meta.url));

// Multi-page build: every index.html outside src/, docs-templates/ etc. is an entry
// (/, /en/, /projekty/<slug>/, /en/projects/<slug>/). All pages share src/main.ts.
// contentPlugin renders the copy from src/content/ into each page shell as static HTML.
export default defineConfig({
  appType: 'mpa',
  plugins: [contentPlugin(root)],
  // The production response headers (vercel.json), so local checks run under the same CSP.
  preview: { headers: readSiteHeaders(root) },
  build: {
    target: 'es2023',
    // three.js (~500 kB) lives only in the lazily imported scene chunk (src/scene/app.ts).
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      input: discoverPages(root),
    },
  },
});

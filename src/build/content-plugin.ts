import { relative } from 'node:path';
import type { Plugin } from 'vite';
import { fillShell, routeFromFile } from '../content/render.ts';

/**
 * Renders the site's copy into every page shell (`index.html` with `<!-- kokot:head -->`
 * and `<!-- kokot:body -->` markers) in dev and build, so the output HTML carries the
 * full content without JavaScript. Pages outside the known routes are left untouched.
 */
export function contentPlugin(root: string): Plugin {
  return {
    name: 'kokot-content',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const route = routeFromFile(relative(root, ctx.filename));
        return route ? fillShell(html, route) : html;
      },
    },
  };
}

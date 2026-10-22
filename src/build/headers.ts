import { readFileSync } from 'node:fs';

// The response headers every page gets on Vercel (vercel.json, the unconditional rule "/(.*)").
// `vite preview` sends the same ones, so local checks (Lighthouse, screenshots) run under the
// production Content-Security-Policy. Rules with `has`/`missing` apply only to some requests
// (for example the vercel.app host), so they are not part of this set.

interface VercelConfig {
  headers?: {
    source: string;
    has?: unknown[];
    missing?: unknown[];
    headers: { key: string; value: string }[];
  }[];
}

export function siteHeaders(vercelJson: string): Record<string, string> {
  const config = JSON.parse(vercelJson) as VercelConfig;
  const rule = config.headers?.find((h) => h.source === '/(.*)' && !h.has && !h.missing);
  return Object.fromEntries((rule?.headers ?? []).map((h) => [h.key, h.value]));
}

export function readSiteHeaders(root: string): Record<string, string> {
  return siteHeaders(readFileSync(`${root}/vercel.json`, 'utf8'));
}

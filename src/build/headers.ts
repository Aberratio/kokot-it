import { readFileSync } from 'node:fs';

// The response headers every page gets on Vercel (vercel.json, rule "/(.*)"). `vite preview`
// sends the same ones, so local checks (Lighthouse, screenshots) run under the production
// Content-Security-Policy.

interface VercelConfig {
  headers?: { source: string; headers: { key: string; value: string }[] }[];
}

export function siteHeaders(vercelJson: string): Record<string, string> {
  const config = JSON.parse(vercelJson) as VercelConfig;
  const rule = config.headers?.find((h) => h.source === '/(.*)');
  return Object.fromEntries((rule?.headers ?? []).map((h) => [h.key, h.value]));
}

export function readSiteHeaders(root: string): Record<string, string> {
  return siteHeaders(readFileSync(`${root}/vercel.json`, 'utf8'));
}

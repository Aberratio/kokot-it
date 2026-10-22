import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { siteHeaders } from './headers.ts';

const vercelJson = readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8');
const headers = siteHeaders(vercelJson);
const csp = Object.fromEntries(
  (headers['Content-Security-Policy'] ?? '').split(';').map((d) => {
    const [name = '', ...values] = d.trim().split(/\s+/);
    return [name, values];
  }),
);

describe('security headers (vercel.json)', () => {
  it('sends the basic hardening headers on every path', () => {
    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Strict-Transport-Security']).toMatch(/^max-age=\d{8}$/);
  });

  it('allows only the site itself to run scripts, with no inline or eval escape hatch', () => {
    expect(csp['script-src']).toEqual(["'self'"]);
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(headers['Content-Security-Policy']).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'self'"]);
  });

  it('lets the case studies frame the reference applications, and nobody else frame the site', () => {
    expect(csp['frame-src']).toEqual(["'self'"]);
    expect(csp['frame-ancestors']).toEqual(["'self'"]);
  });

  it('keeps every page on trailing-slash URLs', () => {
    expect((JSON.parse(vercelJson) as { trailingSlash: boolean }).trailingSlash).toBe(true);
  });

  it('keeps the standalone application pages out of search results', () => {
    const rules = (JSON.parse(vercelJson) as { headers: { source: string; headers: unknown[] }[] })
      .headers;
    expect(rules.find((r) => r.source === '/tools/(.*)')?.headers).toContainEqual({
      key: 'X-Robots-Tag',
      value: 'noindex',
    });
  });
});

describe('siteHeaders', () => {
  it('reads only the catch-all rule', () => {
    expect(
      siteHeaders(
        JSON.stringify({
          headers: [
            { source: '/x/(.*)', headers: [{ key: 'A', value: '1' }] },
            { source: '/(.*)', headers: [{ key: 'B', value: '2' }] },
          ],
        }),
      ),
    ).toEqual({ B: '2' });
    expect(siteHeaders('{}')).toEqual({});
  });

  it('ignores conditional catch-all rules, whatever their order', () => {
    expect(
      siteHeaders(
        JSON.stringify({
          headers: [
            {
              source: '/(.*)',
              has: [{ type: 'host', value: '.*' }],
              headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
            },
            { source: '/(.*)', headers: [{ key: 'B', value: '2' }] },
          ],
        }),
      ),
    ).toEqual({ B: '2' });
  });
});

describe('vercel.app hosts', () => {
  const rules = (
    JSON.parse(vercelJson) as {
      headers: { source: string; has?: { type: string; value: string }[]; headers: unknown[] }[];
    }
  ).headers;
  const hostRule = rules.find((r) => r.has?.some((c) => c.type === 'host'));
  const hostPattern = new RegExp(
    `^${(hostRule?.has?.find((c) => c.type === 'host')?.value ?? '').replace(/\(\?<\w+>/g, '(')}$`,
  );

  it('are kept out of search results', () => {
    expect(hostRule?.source).toBe('/(.*)');
    expect(hostRule?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex' });
  });

  it('match vercel.app deployments but never the custom domain', () => {
    expect(hostPattern.test('kokot-it.vercel.app')).toBe(true);
    expect(hostPattern.test('kokot-bl1hzmq9u-aberratios-projects.vercel.app')).toBe(true);
    expect(hostPattern.test('kokot.it')).toBe(false);
    expect(hostPattern.test('www.kokot.it')).toBe(false);
  });
});

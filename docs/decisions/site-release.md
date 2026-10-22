# Site release — SEO, accessibility, headers, analytics

Decisions taken while preparing kokot.it for production.

## Analytics

- 2026-10-22 — **No analytics.** The site sets no cookies, loads no third-party script and shows
  no consent banner. Cookieless analytics (for example Vercel Web Analytics) was the other
  option; it was left out because the site's job is to be read and to lead to one e-mail
  address, so the inbox is the measure that matters, and every script added to the page costs
  performance and a line in the privacy story. Adding cookieless analytics later is a small,
  reversible change: one script and one `connect-src` entry in the Content-Security-Policy.

## Search and social

- 2026-10-22 — Every page has its own title and description per locale (descriptions ≤ 160
  characters, a test holds the limit), a canonical URL, `hreflang` alternates for PL, EN and
  `x-default`, Open Graph and a `summary_large_image` Twitter card
- 2026-10-22 — The social image is generated, one per locale (`npm run og:image`,
  `public/og/kokot-it-<locale>.png`, 1200 × 630): the Relay network still from
  `src/scene/still.ts` on the scene background, the logo and the locale's headline — a
  screenshot of the live WebGL scene would depend on the GPU and the moment it was taken
- 2026-10-22 — JSON-LD on the two home pages only: a `ProfessionalService` (name, URL, e-mail,
  logo, image, description, `areaServed`, `knowsLanguage`, a sales `ContactPoint`, GitHub) and a
  `WebSite`. No street address, tax id or phone number — a test fails if one appears. Google may
  flag the missing address of a local business type; that is accepted
- 2026-10-22 — `sitemap.xml` and `robots.txt` are generated at build time from the same route
  list as the pages (`src/build/seo.ts`), so a new case study is listed with its alternates
  without touching them
- 2026-10-22 — The brand preview (`/brand/`) is no longer built for production: it stays a
  development page (`npm run dev` → `/brand/`) with `noindex`. Blocking it in `robots.txt` was
  the alternative, but `/brand/` also holds the logo and icons that the site uses
- 2026-10-22 — The standalone pages of the reference applications (`/tools/<slug>/`) carry
  `X-Robots-Tag: noindex` rather than a `robots.txt` block: a crawler that follows the "open in
  a new tab" link learns not to index them, and the case-study page stays the page to find

## Headers

- 2026-10-22 — Content-Security-Policy `default-src 'self'` with `script-src 'self'` and
  `style-src 'self'` (no inline or eval escape hatch), `img-src` adding `data:` and `blob:`,
  `frame-src 'self'` for the embedded applications and `frame-ancestors 'self'` (with
  `X-Frame-Options: SAMEORIGIN` for older browsers). Checked in Chromium: the site, the 3D
  scene and all three applications render with no violation except one — Production docs agent
  bundles Zod 4, which probes for `eval` once (`Function('')` in a try/catch) and then runs
  without it. Lighthouse lists that probe as a browser issue (Best Practices 96 on that case
  study); setting Zod's `jitless` option in that application removes it
- 2026-10-22 — `Strict-Transport-Security: max-age=63072000` without `includeSubDomains` or
  `preload`: both commit every subdomain of kokot.it to HTTPS for years, which is the owner's
  decision, not the site's
- 2026-10-22 — `vite preview` sends the same headers as Vercel (read from `vercel.json`), so
  Lighthouse and screenshots run under the production CSP
- 2026-10-22 — Hashed assets (`/assets/`, `/tools/<slug>/assets/`) are cached for a year as
  immutable

## Accessibility

- 2026-10-22 — The scene scrim is painted from the rgb() scrim tokens only, and the translucent
  cards use `color-mix()` inside `@supports`: a `color-mix()` with `var()` is accepted at parse
  time, overrides the earlier fallback and computes to transparent where `color-mix()` is
  missing (Safari before 16.2). The old test checked declaration order inside the rule text,
  comments included, so it passed on CSS that was broken in those browsers; the new one parses
  declarations and fails on any `color-mix()` outside `@supports`

## Measuring

- 2026-10-22 — Lighthouse 13.5.0 runs against `vite preview` in headless Chromium with its
  default flags. Forcing SwiftShader through `--use-angle=swiftshader` slowed Lighthouse's own
  page evaluation on the English home page and cost about 10 Performance points that do not
  reproduce without the flag; WebGL runs in software in headless Chromium either way

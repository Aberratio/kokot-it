# kokot.it

The website of kokot.it — AI agents for manufacturing companies and software teams. A static,
bilingual (Polish and English) site with a live 3D backdrop, case studies that embed working
reference applications, and the print templates for the offer and the CV.

![Home page with the Relay scene behind the hero](docs/screenshots/scene-desktop-hero.png)

- **Static and readable without JavaScript.** Every page is rendered to HTML at build time;
  scripts only add the 3D scene and the embedded applications.
- **"Relay" 3D scene.** Vanilla Three.js with custom GLSL shaders, loaded lazily, with adaptive
  quality, reduced-motion and no-WebGL fallbacks.
- **Embedded applications.** Four case studies embed a working application built from its own
  public repository at a pinned commit: three reference applications and the Heartwood game (slug relay-defense).
- **Guarded content.** The build fails on a phone number, a tax id, a price, a stray e-mail
  address or wording that must not ship; the test suite keeps the repository in English.

## Stack

Vite 8 (multi-page build), TypeScript (strict), Three.js, Vitest, Playwright (PDF rendering and
checks), ESLint + Prettier. No UI framework. Node 24 (`.nvmrc`).

## Quick start

```bash
npm ci
npm run dev        # http://localhost:5173/ (PL), http://localhost:5173/en/ (EN)
```

## Scripts

| Script                 | What it does                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `npm run dev`          | Vite dev server                                                                               |
| `npm run build`        | production build to `dist/`, then the content guard (`scripts/check-dist.ts`)                 |
| `npm run preview`      | serves the built `dist/`                                                                      |
| `npm run typecheck`    | `tsc --noEmit`                                                                                |
| `npm run lint`         | ESLint + `prettier --check`                                                                   |
| `npm run format`       | Prettier `--write` + `eslint --fix`                                                           |
| `npm test`             | Vitest, once; `npm run test:watch` to watch                                                   |
| `npm run tools:sync`   | rebuilds the reference applications in `public/tools/` from `tools.lock.json`                 |
| `npm run og:image`     | renders the social preview images (`public/og/kokot-it-<pl\|en>.png`, 1200 × 630)             |
| `npm run pdf`          | offer PL/EN, price quote PL (template + example), CV PL/EN → `out/pdf/`, then checks the PDFs |
| `npm run pdf:preview`  | renders the pages of the PDFs in `out/pdf/` to PNG in `out/preview/` for a visual check       |
| `npm run pdf:install`  | downloads Chromium for Playwright once (needed by `pdf` and `brand:assets`)                   |
| `npm run brand:assets` | generates the logo, sign and favicons (`public/brand/`, `public/favicon*`) from `tokens.css`  |

`out/`, `dist/` and `tmp/` are git-ignored. CI installs Chromium only for the PDF tests, which
run on a fictional CV.

## Project structure

```
index.html                     Polish home page (/)
en/index.html                  English home page (/en/)
projekty/<slug>/index.html     Polish case study (/projekty/<slug>/)
en/projects/<slug>/index.html  English case study (/en/projects/<slug>/)
src/main.ts                    shared entry point of every page
src/content/                   site copy (pl.ts, en.ts), the renderer to static HTML, content guards
src/build/                     Vite plugin that pours the copy into the page shells; page discovery
src/embed.ts                   lazy, sandboxed embedding of the reference applications
src/i18n/                      UI strings and per-locale paths
src/scene/                     Relay scene: pure logic (graph, layouts, routing, quality) + renderer
src/styles/                    brand tokens (tokens.css), base styles, content layout
src/assets/fonts/              brand fonts (woff2, OFL) and their licences
public/tools/<slug>/           built reference applications (generated, see below)
brand/index.html               brand system preview (dev server only: /brand/); rules in brand.md
docs/                          scene concept, design decisions, screenshots
docs-templates/                document templates (TypeScript → HTML): offer/, price-quote/, cv/
scripts/                       build guards, tool sync, PDF rendering and checks, brand assets
tests/                         repository guards (private data, CV content, language, wording)
```

Pages are thin `index.html` shells with `<!-- kokot:head -->` and `<!-- kokot:body -->` markers;
`src/content/render.ts` renders the copy into them in dev and in the build. A new case study is a
slug in `PROJECT_SLUGS` and `REPOS` (`src/content/types.ts`), its copy in `pl.ts` and `en.ts`
(the types require both), and the two shells `projekty/<slug>/index.html` and
`en/projects/<slug>/index.html` (a test checks that every route has its shell).

## Reference applications

The case studies of [factory-twin](https://github.com/Aberratio/factory-twin),
[production-docs-agent](https://github.com/Aberratio/production-docs-agent),
[grant-assistant](https://github.com/Aberratio/grant-assistant) and
[relay-defense](https://github.com/Aberratio/relay-defense) embed the application itself.
Each one is a static build from its public repository at the commit pinned in
`tools.lock.json`, committed under `public/tools/<slug>/`, so the site's build and deploy never
fetch or build anything else.

- **Embedding** (`src/embed.ts`): the static page carries a text fallback and a link that opens
  the application in a new tab. When the figure nears the viewport, an iframe loads
  `/tools/<slug>/?embed=1&lang=<pl|en>` with
  `sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"` and
  `loading="lazy"`. Applications that post `{ type: '<slug>:height', height }` get an iframe
  sized to their content; messages count only from the site's own origin and from an embedded
  frame. Factory Twin reports no height and keeps a fixed proportion.
- **Updating**: put the new commit SHA in `tools.lock.json`, run `npm run tools:sync` (or
  `npm run tools:sync -- <slug>`) and commit the lock file with the rebuilt directory. See
  `public/tools/README.md`.
- The applications make no API calls: the reference applications replay recorded runs on sample
  data, and Heartwood is a game that runs entirely in the browser. A case study can replace
  the site-wide note under its application (`toolNote` in the copy) when that note does not fit.

## Search, social, privacy and accessibility

- **Head of every page** (`src/content/render.ts`): its own title and description per locale, a
  canonical URL, `hreflang` alternates (PL, EN, `x-default`), Open Graph and a
  `summary_large_image` Twitter card with the locale's image from `public/og/`. The home pages
  also carry JSON-LD: a `ProfessionalService` reachable by e-mail (no address, tax id or phone)
  and a `WebSite`.
- **`sitemap.xml` and `robots.txt`** are generated by the build from the route list
  (`src/build/seo.ts`). The brand preview is not built for production; the standalone pages of
  the reference applications send `X-Robots-Tag: noindex`.
- **No analytics, no cookies, no consent banner** (`docs/decisions/site-release.md`).
- **Headers** (`vercel.json`): a Content-Security-Policy with scripts and styles from the site
  only and framing limited to the site itself, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, HSTS, and a year of
  immutable caching for hashed assets. `npm run preview` sends the same headers.
- **Accessibility** (WCAG 2.2 AA): brand tokens meet AA contrast (`brand.md`), a skip link,
  keyboard-reachable navigation with a visible focus ring, `lang` on every page and on the
  language switch, a `title` on every embedded application, `prefers-reduced-motion` respected
  by the scene and the transitions, and a scrim that every browser can draw.

## Content guards

- **Build** (`scripts/check-dist.ts`, after `vite build`): every route is rendered; the site's
  pages contain no phone number, tax or registry id, price, e-mail address other than the
  contact one, placeholder, prototype wording, internal process reference or local path; every
  reference application is present. The applications' own pages are checked by their
  repositories.
- **Repository** (`tests/repo-guards.test.ts`): code, comments and docs are in English (Polish
  only in the Polish copy, the Polish document templates and sample data, and as quoted
  strings), and carry no prototype wording, planning ids or absolute local paths.
- **Private data** (`tests/no-private-data.test.ts`, `tests/cv-content-guard.test.ts`): no
  company data or phone number in the repository, and no distinctive text of the real CV.

## Documents: offer, price quote, CV

`npm run pdf` generates in one command (`out/pdf/`):

| File                             | What it is                                                               |
| -------------------------------- | ------------------------------------------------------------------------ |
| `oferta-pl.pdf`, `oferta-en.pdf` | general presentation offer, 2 A4 pages                                   |
| `oferta-cenowa-szablon-pl.pdf`   | price-quote template for a Dig.IT application, with `{{...}}` fields     |
| `oferta-cenowa-przyklad-pl.pdf`  | the same template filled with a fictional company (marked as `PRZYKŁAD`) |
| `cv-pl.pdf`, `cv-en.pdf`         | CV, 1–2 pages; skipped with a notice when the CV content is unavailable  |

The file names stay Polish: these are the documents sent to Polish companies.

After rendering, the script checks each PDF: the page limit (general offer and CV ≤ 2), brand
fonts embedded as real TrueType fonts (`docs-templates/shared/print-fonts.css`: static instances
from `@fontsource/*`, because Chromium writes variable woff2 as Type 3) and the presence of key
phrases in the extracted text (readability for applicant tracking systems).

- **Prices** have one source: `docs-templates/offer/pricing.json` (`pricing.test.ts` holds the
  ranges). While `"status": "draft"`, every document carries a "preliminary pricing" badge. Once
  the price list is approved, set `"status": "approved"`.
- **Contractor data** (name, tax id, address) never enters the repository: the template has the
  fields `{{NAZWA_FIRMY}}`, `{{NIP}}`, `{{ADRES}}`. A real price quote is prepared from a copy of
  `docs-templates/price-quote/data.template.json` (package P2) or `data.template-p3.json` (P3)
  kept **outside the repository**: `npm run pdf -- --quote <file.json> --final`. Prices are
  computed from `pricing.json` (person-days × rate); a file with a broken structure stops the
  run with a list of errors. Each PDF in `out/pdf/` has its HTML next to it for a browser preview.
- **Dig.IT requirements:** `docs-templates/price-quote/requirements.ts` lists the 32
  requirements; each has an element with `data-req="<n>"` in the template
  (`requirements.test.ts`).
- **CV:** the template is in the repository, the content is not. The script reads `cv.pl.json` /
  `cv.en.json` from the folder in `CV_CONTENT_DIR`; without it the CV is skipped. `TODO_OWNER`
  fields are not rendered and are listed as warnings. Tests use a fictional person from
  `tests/fixtures/cv.sample.json`; with `CV_CONTENT_DIR` set, `tests/cv-content-guard.test.ts`
  checks that no distinctive CV phrase made it into the repository.
- **`--final`** (the version to send): warns about unfilled `{{...}}` fields, `TODO_OWNER` and a
  draft price list ("NOT READY TO SEND").

## 3D scene ("Relay")

Concept and rationale: `docs/concept.md`; deviations: `docs/decisions/relay-scene.md`. The scene
is the fixed backdrop of the home page: a sparse graph of agents whose links carry task pulses
(warm) and result pulses (cool); the network re-forms between sections (hero → 3 service
clusters → 4 project constellations → convergence next to the e-mail address).

- Loading: `src/scene/index.ts` (main bundle, no three.js) waits for `load` and an idle browser,
  then dynamically imports `src/scene/app.ts` with three.js in a separate chunk.
- Modes: WebGL2 → live scene; `prefers-reduced-motion` → one still frame; no WebGL, a lost context
  or a device too slow even at the lowest quality → static SVG still (`src/scene/still.ts`).
- Adaptive quality (`src/scene/quality.ts`): the start level comes from the device, then a mean
  frame time above 20 ms for 2 s lowers the level (node count, DPR, glow); it never goes back up.
  The current level is exposed as `data-level` on `canvas.scene`.
- The animation loop stops while the tab is hidden; colours and durations come only from the
  tokens (`src/styles/tokens.css`).
- The logic (graph, layouts, routing, quality, input) is pure and unit-tested with Vitest; the
  renderer and shaders (`renderer.ts`, `shaders.ts`) are checked in the browser — screenshots in
  `docs/screenshots/scene-*.png`.

## CI

`.github/workflows/ci.yml` runs on every pull request and every push to `main`: lint,
typecheck, test, build. Changes reach `main` through pull requests.

## Deploy (Vercel)

`.github/workflows/deploy.yml` deploys with the Vercel CLI: a **preview** for every pull request
(its URL is in the job summary) and **production** after every push to `main`. It is the only
deploy path: the repository is also connected to Vercel's Git integration, but its automatic
deployments are turned off in `vercel.json` (`"git": { "deploymentEnabled": false }`), so
nothing is deployed twice. Project settings (Vite, `npm run build`, output `dist`, trailing
slashes, headers) are in `vercel.json`. If a secret is missing, the job ends green with a
"Deploy skipped" notice instead of failing.

| Host                        | Serves                                                  |
| --------------------------- | ------------------------------------------------------- |
| https://kokot.it            | production, the canonical host (sitemap, canonical, OG) |
| https://www.kokot.it        | `308` redirect to `https://kokot.it`, path kept         |
| https://kokot-it.vercel.app | production too, with `X-Robots-Tag: noindex`            |

Every `*.vercel.app` host (production and previews) answers with `X-Robots-Tag: noindex`, so
only `kokot.it` gets indexed. Both custom domains belong to the Vercel project `kokot-it`
(team `aberratios-projects`). Until 2026-10-23 they pointed to the older project `news-client`,
which is kept and still answers at https://news-client-ten.vercel.app. The other `*.kokot.it`
subdomains belong to other projects and are not affected by this site.

### Secrets

All three are set in GitHub: repository → **Settings → Secrets and variables → Actions**.

| Secret              | Where it comes from                                                                |
| ------------------- | ---------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | vercel.com → Account Settings → **Tokens** → Create (scope: `aberratios-projects`) |
| `VERCEL_ORG_ID`     | `orgId` in `.vercel/project.json` after `npx vercel@65.0.0 link`                   |
| `VERCEL_PROJECT_ID` | `projectId` in `.vercel/project.json` after `npx vercel@65.0.0 link`               |

The Vercel CLI cannot create tokens; a new one comes from the dashboard. When the token expires,
create a new one and replace the secret. `.vercel/` is git-ignored.

### Commit authors

Vercel refuses a deploy whose git commit author it does not know ("commit author doesn't have
permission"). This applies to the GitHub Actions deploy as well, because the CLI sends the
checked-out commit with it. The author email of the commits (`git config user.email`) must
therefore be one of the emails on the Vercel account (Account Settings → **Emails**). A commit
by a new author needs that email added first.

### Manual deploy

Only needed if GitHub Actions is unavailable. From a clean checkout of `main`:

```bash
npx vercel@65.0.0 login
npx vercel@65.0.0 link      # links the existing project kokot-it
npx vercel@65.0.0 deploy --prod
```

### Domains and DNS for kokot.it

The domain is registered outside Vercel and its DNS is at the registrar (nameservers
`ns1.seohost.pl`, `ns2.seohost.pl`). The records pointing to Vercel:

| Type    | Name       | Value                  |
| ------- | ---------- | ---------------------- |
| `A`     | `@` (apex) | `76.76.21.21`          |
| `CNAME` | `www`      | `cname.vercel-dns.com` |

These are Vercel's general values, not tied to one project, so moving the domains between Vercel
projects needs no DNS change. Mail `MX`/`TXT` records stay as they are; there are no `CAA`
records (if any are added, they must allow Let's Encrypt).

To move both domains to another project in the team (run in a linked checkout, PowerShell or
any shell; in Git Bash prefix the `api` call with `MSYS_NO_PATHCONV=1`):

```bash
npx vercel@65.0.0 domains add kokot.it <project> --force
npx vercel@65.0.0 domains add www.kokot.it <project> --force
npx vercel@65.0.0 api /v9/projects/<project>/domains/www.kokot.it -X PATCH -f redirect=kokot.it -F redirectStatusCode=308
```

`--force` detaches the domain from its current project first, so the site can answer with an
error for a few seconds in between. Sources (as of 2026-10-23):
[Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain),
[A record and CAA with Vercel](https://vercel.com/kb/guide/a-record-and-caa-with-vercel).

# kokot.it — brand system

One visual language for the site, the 3D scene, the offer, the CV and the reference projects.
Source of every value: [`src/styles/tokens.css`](src/styles/tokens.css) (CSS custom properties).
Review preview: `/brand/` on the dev server (`npm run dev` → http://localhost:5173/brand/, a `noindex` page that is not part of the production build).
3D scene concept: [`docs/concept.md`](docs/concept.md).

## The concept in brief

**"Relay" — intelligence in motion.** A network of agents handing work to each other: a warm
pulse is a task going out, a cool one is a result coming back. The visitor's cursor is an order
the network routes. A dark, quiet base; motion that is rare, deliberate and directional. The logo
carries the same motif: the two dots in "kokot.it" are two network nodes, and the sign is the
letter "k" drawn as a graph.

## Colour

A dark "ink" base with a slightly cool tint, one warm accent (**Signal**, amber) and one cool
accent (**Ion**, blue). Signal = action (calls to action, focus, the task in the scene); Ion =
information (links, data, the result in the scene). No other hues except for states.

### Screen theme (default, dark)

| Token                    | Value     | Role                                       |
| ------------------------ | --------- | ------------------------------------------ |
| `--color-bg`             | `#0b0d12` | page background                            |
| `--color-bg-deep`        | `#07080b` | deepest background, scene background       |
| `--color-surface`        | `#11141b` | cards, panels                              |
| `--color-surface-raised` | `#181c25` | elements above a card, hover               |
| `--color-line`           | `#2a303c` | dividers, decorative borders               |
| `--color-line-strong`    | `#3d4452` | control borders, scene edges               |
| `--color-text`           | `#eceef3` | text                                       |
| `--color-text-muted`     | `#a3a9b7` | secondary text                             |
| `--color-text-subtle`    | `#7f8697` | captions, metadata                         |
| `--color-accent`         | `#ffb547` | Signal — call to action, focus, task pulse |
| `--color-accent-hover`   | `#ffc66e` | call-to-action hover                       |
| `--color-on-accent`      | `#0b0d12` | text on Signal                             |
| `--color-accent-2`       | `#8fb3ff` | Ion — links, data, result pulse            |
| `--color-success`        | `#4fd1a1` | state: success                             |
| `--color-warning`        | `#ffd166` | state: warning                             |
| `--color-danger`         | `#ff7a7a` | state: error                               |

### `paper` print theme (PDF: offer, CV)

Printed documents have a **light background**. The offer and the CV go to companies and advisers
who print them (often on office printers, sometimes in greyscale) and read them at length; a fully
dark A4 page wastes toner, shows banding and stains on every sheet, and light print reads better.
The brand stays in the typography, the grid and the accents. The templates set
`<html data-theme="paper">`; the same attribute works on any element (a light panel on a dark
page).

| Token                 | Value     | Role                        |
| --------------------- | --------- | --------------------------- |
| `--color-bg`          | `#ffffff` | paper                       |
| `--color-surface`     | `#f4f5f7` | highlighted blocks          |
| `--color-line`        | `#d9dde4` | dividers                    |
| `--color-text`        | `#0b0d12` | text                        |
| `--color-text-muted`  | `#4b5262` | secondary text              |
| `--color-text-subtle` | `#5f6676` | captions                    |
| `--color-accent`      | `#9a5300` | dark Signal (labels, rules) |
| `--color-accent-2`    | `#2d56c9` | dark Ion (links)            |
| `--color-success`     | `#0f7a52` | state: success              |
| `--color-warning`     | `#7a5a00` | state: warning              |
| `--color-danger`      | `#b42318` | state: error                |

### WCAG 2.x contrast

Every text/background pair meets **AA (≥ 4.5 : 1)** in both themes; focus meets 1.4.11
(≥ 3 : 1). The ratios are computed by `src/styles/color.ts`; the tests
(`src/styles/tokens.test.ts`) hold the thresholds on every palette change, and `/brand/` shows
them live.

Screen (dark):

| Text \ background                | bg                   | surface | surface-raised |
| -------------------------------- | -------------------- | ------- | -------------- |
| text                             | 16.74                | 15.87   | 14.69          |
| text-muted                       | 8.25                 | 7.82    | 7.24           |
| text-subtle                      | 5.33                 | 5.05    | 4.68           |
| accent (Signal)                  | 11.06                | 10.49   | 9.70           |
| accent-2 (Ion)                   | 9.31                 | 8.83    | 8.17           |
| on-accent on accent              | 11.06                |         |                |
| success / warning / danger on bg | 10.15 / 13.48 / 7.70 |         |                |
| focus on bg (1.4.11)             | 11.06                |         |                |

Print (`paper`):

| Text \ background                | bg                 | surface | surface-raised |
| -------------------------------- | ------------------ | ------- | -------------- |
| text                             | 19.43              | 17.82   | 19.43          |
| text-muted                       | 7.83               | 7.18    | 7.83           |
| text-subtle                      | 5.76               | 5.28    | 5.76           |
| accent (dark Signal)             | 5.82               | 5.33    | 5.82           |
| accent-2 (dark Ion)              | 6.39               | 5.86    | 6.39           |
| on-accent on accent              | 5.82               |         |                |
| success / warning / danger on bg | 5.35 / 6.38 / 6.57 |         |                |
| focus on bg (1.4.11)             | 5.82               |         |                |

Lines: in the dark theme `--color-line` (1.47 : 1) and `--color-line-strong` (1.99 : 1) are
decorative — not for text, nor as the only boundary of a form field; controls have a
`surface-raised` background and a Signal focus. In `paper`, `--color-line` is 1.36 : 1
(dividers) and `--color-line-strong` 5.76 : 1 (it may outline controls).

## Typography

| Role               | Font                                                                                       | Licence     | Files                                        |
| ------------------ | ------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------- |
| Headings and text  | [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk), variable 400–900 | SIL OFL 1.1 | `src/assets/fonts/schibsted-grotesk-*.woff2` |
| Labels, data, code | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), variable 400–700       | SIL OFL 1.1 | `src/assets/fonts/jetbrains-mono-*.woff2`    |

- **Self-hosted** (`src/styles/fonts.css`): `latin` + `latin-ext` subsets (Polish characters),
  about 110 kB in total, loaded by `unicode-range`. Works offline in PDFs (Chromium reads the
  files over `file://`), with no request to Google and no cookie consent. The OFL licences sit
  next to the files.
- Why these: Schibsted Grotesk is technical and distinctive in headings and calm in body text,
  and less overused than Inter or Space Grotesk. JetBrains Mono has legible digits and
  punctuation in data and prices.
- Scale (rem at 16 px; fluid headings from 360 to 1280 px):

| Token            | Size       | Use                         |
| ---------------- | ---------- | --------------------------- |
| `--text-display` | 46 → 88 px | one line per page (hero)    |
| `--text-3xl`     | 38 → 60 px | `h1`                        |
| `--text-2xl`     | 30 → 44 px | `h2`                        |
| `--text-xl`      | 24 → 30 px | `h3`                        |
| `--text-lg`      | 22 px      | emphasis                    |
| `--text-md`      | 18 px      | lead                        |
| `--text-base`    | 16 px      | text                        |
| `--text-sm`      | 14 px      | captions, buttons           |
| `--text-xs`      | 12 px      | metadata                    |
| `--text-2xs`     | 11 px      | upper-case mono labels only |

- Headings: weight 600, line height 1.05–1.2, tracking −0.02 em (display −0.035 em).
  Text: 400, line height 1.55, line length ≤ 66 characters (`--measure`).
  Labels: mono, upper case, tracking +0.08 em, colour `text-subtle` or Signal.
- PDF: `docs.css` sets a 10.5 pt base; the rem scale follows it.

## Spacing, shape, shadows, motion

- **Spacing** — 4 px base: `--space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 24 · `-6` 32 ·
  `-7` 48 · `-8` 64 · `-9` 96 · `-10` 128 px. Container `--container` 76 rem, side margin
  `--gutter` 16 → 32 px.
- **Radii** — `--radius-sm` 4 px (fields, chips), `-md` 8 px (square buttons, icons), `-lg` 14 px
  (cards), `-pill` (calls to action). A technical character: no large roundings.
- **Shadows and glows** — `--shadow-1/2` only to separate layers; `--glow-accent` /
  `--glow-accent-2` only for an active state (call-to-action hover, a selected element) — a glow
  is a signal, not decoration. The `paper` theme turns shadows and glows off.
- **Motion** — `--duration-fast` 140 ms (hover), `-base` 220 ms (states), `-slow` 420 ms
  (entrances), `-scene` 1400 ms (the scene re-forming); curves `--ease-out`, `--ease-in-out`,
  `--ease-signal` (fast start, soft arrival — like a pulse). Under `prefers-reduced-motion` the
  durations drop to 1 ms and `--motion-scale` to 0 (the scene stands still).

## Icons

A 1.75 px stroke on a 24 × 24 grid, round caps and joins — the same line as the logo; no fills,
colour `currentColor`. The only ornament is the node (a filled dot, may be Signal). No 3D icons,
gradients, emoji or "robot" illustrations. If a ready-made set is needed: Lucide (ISC) with
`stroke-width` 1.75.

## Logo

`npm run brand:assets` (`scripts/brand-assets.ts` + `scripts/brand-geometry.ts`) generates the
files in `public/brand/` with the colours from `tokens.css`. The letters are SVG paths (a
monoline on a grid, not a font), so the logo depends on no font.

| File                                                                             | Use                                                 |
| -------------------------------------------------------------------------------- | --------------------------------------------------- |
| `logo.svg`                                                                       | logotype on a dark background (default)             |
| `logo-on-light.svg`                                                              | on a light background and in print                  |
| `logo-mono.svg`                                                                  | one colour (`currentColor`) — inline or as a mask   |
| `mark.svg` / `mark-on-light.svg` / `mark-mono.svg`                               | the "k-graph" sign: avatars, favicon, small formats |
| `/favicon.svg`, `/favicon-32.png`, `/apple-touch-icon.png`, `brand/icon-512.png` | browser and device icons                            |

Rules:

- **Clear space:** the height of the letter "o" (x-height = 0.59 of the logotype height) on every
  side; for the sign, ¼ of its side.
- **Minimum size:** logotype 18 px high on screen / 5 mm in print; below that use the sign
  (at least 16 px).
- **Colours:** letters always in the theme's text colour, nodes (dots) in Signal. The
  one-colour version only where the technique allows no second colour (engraving, embroidery,
  fax, stamp).
- **Background:** dark `ink` or white; on photos only over a calm, dark area.
- **Never:** change proportions or spacing, set the logotype in a font, swap the colours of nodes
  and letters, add shadows, outlines or gradients, rotate it, place it on Signal or Ion.
- In running text: always lower case — "kokot.it".

## Visual tone

Dark, quiet, precise. Plenty of air, a grid and mono labels like a well-made engineering tool;
one warm accent that appears where action happens. Motion is rare and deliberate — every
animation carries something (a task, a result, a state).

## What to avoid

- Purple-pink "AI" gradients, neon cyan on black, glassmorphism, particle brains, robots and
  hands holding circuit boards.
- More than two accents at once; Signal and Ion are not backgrounds for large areas.
- Text in `--color-line*`; light grey text on `surface-raised` below `text-subtle`.
- Animation without a reason (pulsing, endless rotation), motion that ignores
  `prefers-reduced-motion`.
- Colours and durations hard-coded in code — always tokens (`var(--…)` in CSS,
  `sceneTokensFromDocument()` in the scene). The only exception: `<meta name="theme-color">` in
  HTML (it cannot read CSS variables) — it holds the value of `--color-bg` (`#0b0d12`) with a
  comment next to it.

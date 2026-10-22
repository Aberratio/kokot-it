# kokot.it

Strona kokot.it: Vite + vanilla Three.js + TypeScript (strict), bez frameworka UI.
Wersje PL (`/`) i EN (`/en/`) jako wielostronicowy build Vite ze wspólnym kodem.

## Uruchomienie

Wymagany Node 24 (`.nvmrc`).

```bash
npm ci
npm run dev        # http://localhost:5173/ (PL), /en/ (EN)
```

## Skrypty

| Skrypt                 | Co robi                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`          | serwer deweloperski Vite                                                                  |
| `npm run build`        | build do `dist/` + strażnik treści (`scripts/check-dist.ts`)                              |
| `npm run preview`      | podgląd zbudowanego `dist/`                                                               |
| `npm run typecheck`    | `tsc --noEmit`                                                                            |
| `npm run lint`         | ESLint + `prettier --check`                                                               |
| `npm run format`       | Prettier `--write` + `eslint --fix`                                                       |
| `npm test`             | Vitest (jednorazowo); `npm run test:watch` w trybie watch                                 |
| `npm run pdf`          | oferta PL/EN, oferta cenowa PL (szablon + przykład), CV PL/EN → `out/pdf/` + kontrola PDF |
| `npm run pdf:preview`  | renderuje strony PDF-ów z `out/pdf/` do PNG w `out/preview/` (kontrola wzrokowa)          |
| `npm run pdf:install`  | jednorazowo pobiera Chromium dla Playwright (potrzebny do `pdf` i `brand:assets`)         |
| `npm run brand:assets` | generuje logo, sygnet i favicony (`public/brand/`, `public/favicon*`) z `tokens.css`      |

`out/` i `dist/` są w `.gitignore`. CI instaluje Chromium tylko dla testów PDF (na fikcyjnym CV).

## Dokumenty: oferta, oferta cenowa, CV

`npm run pdf` generuje jedną komendą (`out/pdf/`):

| Plik                             | Co to jest                                                               |
| -------------------------------- | ------------------------------------------------------------------------ |
| `oferta-pl.pdf`, `oferta-en.pdf` | oferta ogólna / prezentacyjna, 2 strony A4                               |
| `oferta-cenowa-szablon-pl.pdf`   | szablon oferty cenowej do wniosku Dig.IT, z polami `{{...}}` (tylko PL)  |
| `oferta-cenowa-przyklad-pl.pdf`  | ten sam szablon wypełniony danymi fikcyjnej firmy (oznaczony „PRZYKŁAD”) |
| `cv-pl.pdf`, `cv-en.pdf`         | CV, 1–2 strony; pomijane z komunikatem, gdy treści CV nie ma (np. w CI)  |

Po wygenerowaniu skrypt sprawdza każdy PDF: limit stron (oferta ogólna i CV ≤ 2), fonty marki
osadzone jako prawdziwe fonty TrueType (`docs-templates/shared/print-fonts.css`: statyczne
instancje z `@fontsource/*`, bo zmienne woff2 Chromium zapisuje jako Type 3) i obecność fraz w
tekście wyciągniętym z PDF (czytelność dla ATS).

- **Ceny** mają jedno źródło: `docs-templates/oferta/pricing.json` (zgodne z cennikiem w
  brainie; `pricing.test.ts` pilnuje widełek). Dopóki `"status": "draft"`, każdy dokument ma
  znacznik „Cennik wstępny — do zatwierdzenia”. Po zatwierdzeniu cennika: `"status": "approved"`.
- **Dane wykonawcy** (nazwa, NIP, adres) nigdy nie trafiają do repo: w szablonie są polami
  `{{NAZWA_FIRMY}}`, `{{NIP}}`, `{{ADRES}}`. Konkretną ofertę cenową przygotowuje się z kopii
  `docs-templates/oferta-cenowa/data.template.json` (pakiet P2) albo `data.template-p3.json` (P3)
  trzymanej **poza repo** (np. w brainie): `npm run pdf -- --quote <plik.json> --final`. Ceny
  liczą się z `pricing.json` (osobodni × stawka); plik o złej strukturze zatrzymuje generowanie
  z listą błędów. Obok każdego PDF-a w `out/pdf/` leży jego HTML (podgląd w przeglądarce).
- **Wymogi Dig.IT:** `docs-templates/oferta-cenowa/requirements.ts` to 32 wymogi z researchu;
  każdy ma w szablonie element z `data-req="<nr>"` (`requirements.test.ts`).
- **CV:** szablon jest w repo, treść nie. Skrypt czyta `cv.pl.json` / `cv.en.json` z
  `$CV_CONTENT_DIR` (domyślnie `C:/Repos/tiller/brains/personal-brand/cv`). Pola `TODO_OWNER`
  nie są renderowane, a skrypt wypisuje je jako ostrzeżenia. Testy używają fikcyjnej osoby z
  `tests/fixtures/cv.sample.json`; `tests/cv-content-guard.test.ts` (gdy brain jest dostępny)
  sprawdza, że żadna charakterystyczna fraza z CV nie trafiła do repo.
- **`--final`** (wersja do wysyłki): ostrzega o niewypełnionych polach `{{...}}`, `TODO_OWNER`
  i cenniku w statusie `draft` („NOT READY TO SEND”).

## Struktura

```
index.html                  strona PL (/)
en/index.html               strona EN (/en/)
projekty/<slug>/index.html  case study PL (/projekty/<slug>/)
en/projects/<slug>/index.html  case study EN (/en/projects/<slug>/)
src/main.ts                 wspólny punkt wejścia wszystkich stron
src/content/                treść strony PL/EN (słowniki) i renderer do statycznego HTML
src/build/content-plugin.ts plugin Vite: wlewa treść do szkieletów index.html (znaczniki kokot:head/body)
src/demo.ts                 leniwe osadzanie nagranych dem z public/demos/<slug>/ (iframe, fallback; katalog dodają T-10/11/13)
src/i18n/                   teksty interfejsu PL/EN, ścieżki stron per język
src/scene/                  scena „Relay”: logika (graf, układy, trasy, jakość) + renderer Three.js i shadery GLSL
src/styles/tokens.css       tokeny marki — jedyne źródło kolorów, typografii, odstępów, ruchu
src/styles/tokens.ts        tokeny dla JS/sceny (czyta CSS vars), color.ts — kontrast WCAG
src/styles/content.css      układ sekcji treści, wyłącznie na tokenach z tokens.css
src/assets/fonts/           fonty marki woff2 (OFL) + licencje
brand/index.html            podgląd systemu marki (/brand/, noindex)
brand.md                    zasady marki; docs/concept.md — koncept sceny 3D
src/build/pages.ts          wykrywanie stron do buildu (każdy index.html poza src/, docs-templates/ …)
docs-templates/             szablony dokumentów (TS → HTML): oferta/, oferta-cenowa/, cv/, shared/
scripts/pdf.ts              HTML → PDF (Playwright Chromium) i kontrola PDF (pdf-check.ts)
tests/                      strażnicy danych prywatnych w repo i fikcyjne fixture'y
public/                     pliki statyczne kopiowane bez zmian (logo: public/brand/)
```

Strony to cienkie szkielety `index.html` ze znacznikami `<!-- kokot:head -->` i `<!-- kokot:body -->`;
treść renderuje `src/content/render.ts` w dev i w buildzie, więc HTML jest czytelny bez JavaScriptu.
Nowe case study = slug w `PROJECT_SLUGS` i `REPOS` (`src/content/types.ts`), treść w `pl.ts` i `en.ts`
oraz szkielety `projekty/<slug>/index.html` i `en/projects/<slug>/index.html` (test sprawdza, że każda trasa ma szkielet; typy pilnują kompletu treści PL/EN).

## Scena 3D („Relay”)

Koncept i uzasadnienie: `docs/concept.md`. Scena to stałe tło strony głównej: rzadki graf agentów,
po którego krawędziach biegną impulsy zadań (ciepłe) i wyników (chłodne); sieć przebudowuje się
między sekcjami (hero → 3 klastry usług → 4 konstelacje projektów → zbieżność przy adresie e-mail).

- Ładowanie: `src/scene/index.ts` (w głównym bundlu, bez three.js) czeka na `load` i bezczynność
  przeglądarki, potem dynamicznie importuje `src/scene/app.ts` z three.js w osobnym chunku.
- Tryby: WebGL2 → scena na żywo; `prefers-reduced-motion` → jedna nieruchoma klatka; brak WebGL,
  utrata kontekstu albo zbyt wolne urządzenie → statyczny kadr SVG (`src/scene/still.ts`).
- Jakość adaptacyjna (`src/scene/quality.ts`): poziom startowy z urządzenia, potem średni czas
  klatki > 20 ms przez 2 s obniża poziom (liczba węzłów, DPR, poświata); nigdy nie podnosi.
  Bieżący poziom widać w atrybucie `data-level` na `canvas.scene`.
- Pauza w ukrytej karcie i poza ekranem; kolory i czasy tylko z tokenów (`src/styles/tokens.css`).
- Logika (graf, układy, trasy, jakość, wejście) jest czysta i testowana w Vitest; renderer i
  shadery (`renderer.ts`, `shaders.ts`) sprawdza się w przeglądarce — zrzuty w `docs/screenshots/scene-*.png`.

## CI

`.github/workflows/ci.yml` — na każdym PR i pushu do `main`: lint, typecheck, test, build.
Zmiany trafiają na `main` przez PR.

## Deploy (Vercel)

`.github/workflows/deploy.yml` używa Vercel CLI: **preview** dla każdego PR, **produkcja** po
pushu do `main`. Dopóki sekretów nie ma, job kończy się na zielono z komunikatem „Deploy skipped”.

### Sekrety

Dodaj w GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Sekret              | Skąd                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | vercel.com → Account Settings → **Tokens** → Create (zakres: konto/zespół z projektem) |
| `VERCEL_ORG_ID`     | `orgId` z `.vercel/project.json` po `vercel link`                                      |
| `VERCEL_PROJECT_ID` | `projectId` z `.vercel/project.json` po `vercel link`                                  |

Jak zdobyć ID:

```bash
npx vercel@65.0.0 login
npx vercel@65.0.0 link      # w katalogu repo; tworzy projekt albo podpina istniejący
cat .vercel/project.json    # {"projectId":"...","orgId":"..."}
```

`.vercel/` jest w `.gitignore`. Ustawienia projektu (framework Vite, build `npm run build`,
output `dist`) są też w `vercel.json`. Jeśli projekt na Vercel jest połączony z repo przez
integrację Git, wyłącz automatyczne deploye Vercel (Project → Settings → Git), żeby nie
dublować tych z GitHub Actions.

### DNS dla kokot.it

1. Vercel → projekt → **Settings → Domains → Add Domain**: `kokot.it` (Vercel zaproponuje też
   `www.kokot.it`; dodaj oba i ustaw przekierowanie na wybraną wersję).
2. U rejestratora / dostawcy DNS domeny ustaw:

| Typ     | Nazwa      | Wartość                                                                                                                                    |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `A`     | `@` (apex) | wartość z karty domeny w Vercel; ogólna wartość z dokumentacji: `76.76.21.21` (nowsze projekty mogą dostać inny adres, np. `216.198.79.1`) |
| `CNAME` | `www`      | wartość z karty domeny w Vercel — unikalna dla projektu, np. `xxxxxxxxxxxxxxxx.vercel-dns-017.com`                                         |

3. Usuń stare, konfliktujące rekordy `A`/`AAAA`/`CNAME` dla `@` i `www`. Rekordy `MX`/`TXT`
   poczty zostają bez zmian. Jeśli domena ma rekordy `CAA`, muszą dopuszczać Let's Encrypt.

Zawsze wpisuj wartości pokazane w karcie domeny projektu — Vercel podaje je per projekt.
Źródła (stan: 2026-10-21):
[Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain),
[A record and CAA with Vercel](https://vercel.com/kb/guide/a-record-and-caa-with-vercel).

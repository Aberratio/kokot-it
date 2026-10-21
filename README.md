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

| Skrypt                | Co robi                                                                                |
| --------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`         | serwer deweloperski Vite                                                               |
| `npm run build`       | build produkcyjny do `dist/`                                                           |
| `npm run preview`     | podgląd zbudowanego `dist/`                                                            |
| `npm run typecheck`   | `tsc --noEmit`                                                                         |
| `npm run lint`        | ESLint + `prettier --check`                                                            |
| `npm run format`      | Prettier `--write` + `eslint --fix`                                                    |
| `npm test`            | Vitest (jednorazowo); `npm run test:watch` w trybie watch                              |
| `npm run pdf`         | renderuje `docs-templates/<dokument>/<pl\|en>.html` do `out/pdf/<dokument>-<lang>.pdf` |
| `npm run pdf:install` | jednorazowo pobiera Chromium dla Playwright (potrzebny tylko do `pdf`)                 |

`out/` i `dist/` są w `.gitignore`. CI nie instaluje przeglądarki — `pdf` uruchamia się lokalnie.

## Struktura

```
index.html                  strona PL (/)
en/index.html               strona EN (/en/)
projekty/<slug>/index.html  case study PL (/projekty/<slug>/)
en/projects/<slug>/index.html  case study EN (/en/projects/<slug>/)
src/main.ts                 wspólny punkt wejścia wszystkich stron
src/i18n/                   słowniki PL/EN i mapowanie ścieżek między językami
src/scene/                  scena Three.js (na razie zaślepka)
src/build/pages.ts          wykrywanie stron do buildu (każdy index.html poza src/, docs-templates/ …)
docs-templates/             szablony HTML dokumentów: oferta/, cv/ (pl.html, en.html), shared/docs.css
scripts/pdf.ts              HTML → PDF (Playwright Chromium)
public/                     pliki statyczne kopiowane bez zmian
```

Nowa podstrona = nowy `index.html` w odpowiednim folderze; konfiguracja Vite jej nie wymienia.

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

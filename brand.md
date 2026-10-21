# kokot.it — system marki

Jeden język wizualny dla strony, sceny 3D, oferty, CV i projektów pokazowych.
Źródło wartości: [`src/styles/tokens.css`](src/styles/tokens.css) (CSS custom properties).
Podgląd do review: `/brand/` (`npm run dev` → http://localhost:5173/brand/, strona `noindex`).
Koncept sceny 3D: [`docs/concept.md`](docs/concept.md).

## Koncept w skrócie

**„Relay” — inteligencja w ruchu.** Sieć agentów, która przekazuje sobie pracę: ciepły impuls to
zadanie, które wychodzi, chłodny — wynik, który wraca. Kursor odwiedzającego jest zleceniem, do
którego sieć wyznacza trasę. Ciemna, cicha baza; ruch rzadki, celowy, z kierunkiem. Ten sam motyw
niesie logo: dwie kropki w „kokot.it” to dwa węzły sieci, a sygnet to litera „k” narysowana jako graf.

## Kolor

Ciemna baza „ink” z lekko chłodnym odcieniem, jeden ciepły akcent (**Signal**, bursztyn) i jeden
chłodny (**Ion**, błękit). Signal = działanie (CTA, fokus, zadanie w scenie); Ion = informacja
(linki, dane, wynik w scenie). Nie używamy innych barw poza stanami.

### Motyw ekranowy (domyślny, ciemny)

| Token                    | Wartość   | Rola                                     |
| ------------------------ | --------- | ---------------------------------------- |
| `--color-bg`             | `#0b0d12` | tło strony                               |
| `--color-bg-deep`        | `#07080b` | najgłębsze tło, tło sceny (`--scene-bg`) |
| `--color-surface`        | `#11141b` | karty, panele                            |
| `--color-surface-raised` | `#181c25` | elementy nad kartą, hover                |
| `--color-line`           | `#2a303c` | podziały, obramowania dekoracyjne        |
| `--color-line-strong`    | `#3d4452` | obramowania kontrolek, krawędzie sceny   |
| `--color-text`           | `#eceef3` | tekst                                    |
| `--color-text-muted`     | `#a3a9b7` | tekst drugorzędny                        |
| `--color-text-subtle`    | `#7f8697` | podpisy, metadane                        |
| `--color-accent`         | `#ffb547` | Signal — CTA, fokus, impuls zadania      |
| `--color-accent-hover`   | `#ffc66e` | hover CTA                                |
| `--color-on-accent`      | `#0b0d12` | tekst na Signal                          |
| `--color-accent-2`       | `#8fb3ff` | Ion — linki, dane, impuls wyniku         |
| `--color-success`        | `#4fd1a1` | stan: sukces                             |
| `--color-warning`        | `#ffd166` | stan: uwaga                              |
| `--color-danger`         | `#ff7a7a` | stan: błąd                               |

### Motyw druku `paper` (PDF: oferta, CV)

Dokumenty drukowane mają **jasne tło**. Powód: oferta i CV trafiają do firm i doradców, którzy je
drukują (często na biurowych drukarkach, także w skali szarości) i czytają długo; pełna ciemna
strona A4 marnuje toner, pasy i przebarwienia wychodzą na każdej kartce, a jasny druk jest
czytelniejszy. Marka zostaje w typografii, siatce i akcentach. Szablony ustawiają
`<html data-theme="paper">`; ten sam atrybut działa na dowolnym elemencie (jasny panel w ciemnej
stronie).

| Token                 | Wartość   | Rola                            |
| --------------------- | --------- | ------------------------------- |
| `--color-bg`          | `#ffffff` | papier                          |
| `--color-surface`     | `#f4f5f7` | wyróżnione bloki                |
| `--color-line`        | `#d9dde4` | podziały                        |
| `--color-text`        | `#0b0d12` | tekst                           |
| `--color-text-muted`  | `#4b5262` | tekst drugorzędny               |
| `--color-text-subtle` | `#5f6676` | podpisy                         |
| `--color-accent`      | `#9a5300` | Signal ciemny (etykiety, linie) |
| `--color-accent-2`    | `#2d56c9` | Ion ciemny (linki)              |
| `--color-success`     | `#0f7a52` | stan: sukces                    |
| `--color-warning`     | `#7a5a00` | stan: uwaga                     |
| `--color-danger`      | `#b42318` | stan: błąd                      |

### Kontrast WCAG 2.x

Wszystkie pary tekst/tło spełniają **AA (≥ 4,5 : 1)** w obu motywach; fokus spełnia 1.4.11
(≥ 3 : 1). Współczynniki liczy `src/styles/color.ts`; testy (`src/styles/tokens.test.ts`) pilnują
progów przy każdej zmianie palety, a strona `/brand/` pokazuje je na żywo.

Ekran (ciemny):

| Tekst \ tło                      | bg                   | surface | surface-raised |
| -------------------------------- | -------------------- | ------- | -------------- |
| text                             | 16,74                | 15,87   | 14,69          |
| text-muted                       | 8,25                 | 7,82    | 7,24           |
| text-subtle                      | 5,33                 | 5,05    | 4,68           |
| accent (Signal)                  | 11,06                | 10,49   | 9,70           |
| accent-2 (Ion)                   | 9,31                 | 8,83    | 8,17           |
| on-accent na accent              | 11,06                |         |                |
| success / warning / danger na bg | 10,15 / 13,48 / 7,70 |         |                |
| focus na bg (1.4.11)             | 11,06                |         |                |

Druk (`paper`):

| Tekst \ tło                      | bg                 | surface | surface-raised |
| -------------------------------- | ------------------ | ------- | -------------- |
| text                             | 19,43              | 17,82   | 19,43          |
| text-muted                       | 7,83               | 7,18    | 7,83           |
| text-subtle                      | 5,76               | 5,28    | 5,76           |
| accent (Signal ciemny)           | 5,82               | 5,33    | 5,82           |
| accent-2 (Ion ciemny)            | 6,39               | 5,86    | 6,39           |
| on-accent na accent              | 5,82               |         |                |
| success / warning / danger na bg | 5,35 / 6,38 / 6,57 |         |                |
| focus na bg (1.4.11)             | 5,82               |         |                |

`--color-line` i `--color-line-strong` są dekoracyjne (1,5–2 : 1) — nie nadają się na tekst ani
jako jedyna granica pola formularza; kontrolki mają tło `surface-raised` i fokus Signal.

## Typografia

| Rola                | Font                                                                                      | Licencja    | Pliki                                        |
| ------------------- | ----------------------------------------------------------------------------------------- | ----------- | -------------------------------------------- |
| Nagłówki i tekst    | [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk), zmienny 400–900 | SIL OFL 1.1 | `src/assets/fonts/schibsted-grotesk-*.woff2` |
| Etykiety, dane, kod | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), zmienny 400–700       | SIL OFL 1.1 | `src/assets/fonts/jetbrains-mono-*.woff2`    |

- **Self-hosting** (`src/styles/fonts.css`): podzbiory `latin` + `latin-ext` (polskie znaki),
  razem ~110 kB, ładowane wg `unicode-range`. Działa offline w PDF (Chromium czyta pliki przez
  `file://`), bez połączenia z Google i bez zgody na cookies. Licencje OFL leżą obok plików.
- Dlaczego te: Schibsted Grotesk jest techniczny i wyrazisty w nagłówkach, a
  spokojny w tekście; nie jest tak ograny jak Inter czy Space Grotesk. JetBrains Mono — czytelne
  cyfry i znaki interpunkcyjne w danych i cenach.
- Skala (rem przy 16 px; nagłówki płynne 360 → 1280 px):

| Token            | Rozmiar    | Użycie                          |
| ---------------- | ---------- | ------------------------------- |
| `--text-display` | 46 → 88 px | jedno hasło na stronę (hero)    |
| `--text-3xl`     | 38 → 60 px | `h1`                            |
| `--text-2xl`     | 30 → 44 px | `h2`                            |
| `--text-xl`      | 24 → 30 px | `h3`                            |
| `--text-lg`      | 22 px      | wyróżnienia                     |
| `--text-md`      | 18 px      | lead                            |
| `--text-base`    | 16 px      | tekst                           |
| `--text-sm`      | 14 px      | podpisy, przyciski              |
| `--text-xs`      | 12 px      | metadane                        |
| `--text-2xs`     | 11 px      | tylko etykiety mono WERSALIKAMI |

- Nagłówki: waga 600, interlinia 1,05–1,2, światło −0,02 em (display −0,035 em).
  Tekst: 400, interlinia 1,55, szerokość wiersza ≤ 66 znaków (`--measure`).
  Etykiety: mono, wersaliki, światło +0,08 em, kolor `text-subtle` albo Signal.
- PDF: `docs.css` ustawia bazę 10,5 pt; skala rem skaluje się z nią.

## Odstępy, kształt, cienie, ruch

- **Odstępy** — baza 4 px: `--space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 24 · `-6` 32 ·
  `-7` 48 · `-8` 64 · `-9` 96 · `-10` 128 px. Kontener `--container` 76 rem, margines boczny
  `--gutter` 16 → 32 px.
- **Promienie** — `--radius-sm` 4 px (pola, chipy), `-md` 8 px (przyciski kwadratowe, ikony),
  `-lg` 14 px (karty), `-pill` (CTA). Techniczny charakter: bez dużych zaokrągleń.
- **Cienie i poświaty** — `--shadow-1/2` tylko do oddzielenia warstw; `--glow-accent` /
  `--glow-accent-2` wyłącznie dla stanu aktywnego (hover CTA, wybrany element) — poświata = sygnał,
  nie dekoracja. W motywie `paper` cienie i poświaty są wyłączone.
- **Ruch** — `--duration-fast` 140 ms (hover), `-base` 220 ms (stany), `-slow` 420 ms (wejścia),
  `-scene` 1400 ms (przebudowa sceny); krzywe `--ease-out`, `--ease-in-out`, `--ease-signal`
  (szybki start, miękkie dojście — jak impuls). Przy `prefers-reduced-motion` czasy spadają do
  1 ms, a `--motion-scale` do 0 (scena stoi).

## Ikony

Obrys 1,75 px na siatce 24 × 24, zaokrąglone końce i łączenia — ta sama linia co logo; bez
wypełnień, kolor `currentColor`. Jedyny ozdobnik to węzeł (wypełnione kółko, może być w Signal).
Bez ikon 3D, gradientów, emoji i ilustracji „robotów”. Jeśli trzeba gotowego zestawu: Lucide (ISC)
ze `stroke-width` 1,75.

## Logo

Pliki w `public/brand/` generuje `npm run brand:assets` (`scripts/brand-assets.ts` +
`scripts/brand-geometry.ts`) z kolorami z `tokens.css`. Litery to ścieżki SVG (monolinia na siatce,
nie font), więc logo nie zależy od żadnego fontu.

| Plik                                                                             | Użycie                                                         |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `logo.svg`                                                                       | logotyp na ciemnym tle (domyślny)                              |
| `logo-on-light.svg`                                                              | na jasnym tle i w druku                                        |
| `logo-mono.svg`                                                                  | jeden kolor (`currentColor`) — wstawiany inline lub jako maska |
| `mark.svg` / `mark-on-light.svg` / `mark-mono.svg`                               | sygnet „k-graf”: awatary, favicon, małe formaty                |
| `/favicon.svg`, `/favicon-32.png`, `/apple-touch-icon.png`, `brand/icon-512.png` | ikony przeglądarki i urządzeń                                  |

Zasady:

- **Pole ochronne:** wysokość litery „o” (x-height = 0,59 wysokości logotypu) z każdej strony;
  dla sygnetu — ¼ jego boku.
- **Minimalny rozmiar:** logotyp 18 px wysokości na ekranie / 5 mm w druku; poniżej używaj sygnetu
  (min. 16 px).
- **Kolory:** litery zawsze w kolorze tekstu motywu, węzły (kropki) w Signal. Wersja jednokolorowa
  tylko tam, gdzie technika nie pozwala na dwa kolory (grawer, haft, faks, pieczątka).
- **Tło:** ciemne `ink` albo białe; na zdjęciach tylko na spokojnym, ciemnym fragmencie.
- **Nie wolno:** zmieniać proporcji ani odstępów, pisać logotypu fontem, zamieniać kolorów węzłów
  i liter, dodawać cieni, obrysów i gradientów, obracać, umieszczać na Signal lub Ion.
- Zapis w tekście: zawsze małymi literami — „kokot.it”.

## Ton wizualny

Ciemno, cicho, precyzyjnie. Dużo powietrza, siatka i etykiety mono jak w dobrze zrobionym
narzędziu inżynierskim; jeden ciepły akcent, który pojawia się tam, gdzie dzieje się działanie.
Ruch rzadki i celowy — każda animacja coś przekazuje (zadanie, wynik, stan).

## Czego unikać

- Fioletowo-różowych gradientów „AI”, neonowego cyjanu na czerni, glassmorphismu, mózgów z
  cząsteczek, robotów i dłoni z płytką drukowaną.
- Więcej niż dwóch akcentów naraz; Signal i Ion nie są tłem dużych powierzchni.
- Tekstu w `--color-line*`; jasnoszarego tekstu na `surface-raised` poniżej `text-subtle`.
- Animacji bez przyczyny (pulsowanie, wieczne obroty), ruchu ignorującego `prefers-reduced-motion`.
- Kolorów i czasów wpisanych na sztywno w kodzie — zawsze tokeny (`var(--…)` w CSS,
  `sceneTokensFromDocument()` w scenie).

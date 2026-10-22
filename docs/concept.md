# Koncept sceny 3D — „Relay”

Stan: 2026-10-21 · decyzja: _proposed_ (do potwierdzenia przez właścicielkę) · wykonanie: T-08.
Kierunek z decyzji D-026: ciemny, techniczny, generatywny, „inteligencja w ruchu”.

## Cel

Odwiedzający zapamiętuje kokot.it jako „inteligencję w ruchu” — agentów AI, którzy współpracują
jak sieć — a treść pozostaje szybka i czytelna na średnim telefonie (budżet T-08: 60 fps na
średnim laptopie, płynnie na telefonie, Lighthouse mobile ≥ 85, scena nie jest LCP).

## Opcje (sesja flow-brainstorm)

| Opcja                               | Na czym polega                                                                                                                                                                                                 | Najmocniejszy argument przeciw                                                                                                                                                  | Koszt wydajnościowy                                                                                                                                                      | Koszt odwrotu                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **A. Relay: sieć przekazań** ✅     | Rzadki graf 3D węzłów-agentów; ciepłe impulsy (zadania) biegną krawędziami, chłodne (wyniki) wracają; kursor to zlecenie klienta, do którego sieć wyznacza trasę; scroll przebudowuje graf pod kolejne sekcje. | Sieć węzłów i linii to najczęstsze „techniczne” tło (plexus z particles.js); jeśli ruch impulsów będzie zbyt subtelny, scena zapadnie się dokładnie w ten banał.                | Niski: ~1–1,5 tys. instancjonowanych węzłów, ~3–4 tys. odcinków, kilkadziesiąt impulsów; 3 draw calle, bez render targetów. CPU: trasowanie BFS na małym grafie, rzadko. | Teraz: 1 dokument. Po T-08: przepisanie `src/scene` (ok. 6 plików, 1,5 dnia); tokeny i strona bez zmian. |
| **B. Rój: GPGPU swarm** (runner-up) | 30–60 tys. cząsteczek jako boidy na GPU (ping-pong FBO), kursor to cel, do którego lecą; sekcje układają rój w formacje.                                                                                       | Rój formujący kształty to najczęściej klonowany pokaz WebGL; pokazuje ruch, nie współpracę; tekstury float jako render target to pierwsze, na czym dławią się średnie telefony. | Wysoki: fill-rate przy addytywnym mieszaniu, 2 symulacje na klatkę; na mobile trzeba ciąć do ~8–16 tys., a i tak ryzyko < 45 fps.                                        | Teraz: 1 dokument. Po T-08: przepisanie `src/scene` + pomocniki GPGPU (ok. 8 plików, 2 dni).             |
| **C. Grzybnia: rosnąca sieć**       | Agenci jako końcówki eksplorujące przestrzeń (space colonisation) — sieć rośnie od kursora; scroll dokańcza wzrost aż do pełnego grafu przy kontakcie.                                                         | Wzrost to historia jednokierunkowa, zużyta po pierwszym przewinięciu; organiczny wygląd ciągnie markę w biologię zamiast inżynierii; geometria rośnie co klatkę na CPU.         | Średni, rosnący: bufory geometrii powiększane w locie, algorytm wzrostu na CPU (lub w workerze).                                                                         | Teraz: 1 dokument. Po T-08: przepisanie `src/scene` i workera (ok. 7 plików, 2 dni).                     |
| **D. Statyczny diagram** (minimum)  | Bez WebGL: jeden wygenerowany SVG sieci za hero, paralaksa CSS i podświetlenie za kursorem.                                                                                                                    | Łamie D-010 i D-012: strona ma być pokazem rzemiosła frontendowego z prawdziwym 3D, a statyczny diagram ma każdy szablon agencji.                                               | Minimalny.                                                                                                                                                               | Teraz: 1 dokument. Później: 1 SVG + 1 CSS, 1 godzina.                                                    |

**Wybór: A — Relay.** A pokazuje _współpracę_ (przekazanie pracy między agentami), nie sam ruch,
i mieści się w budżecie telefonu kilkoma tysiącami instancji zamiast symulacji GPGPU.
**Runner-up: B — Rój**: efektowniejszy na desktopie, ale to bardziej sklonowany efekt i droższy na
mobile. Kolejność ważenia: wierność celowi → odwracalność → siła dowodów → konwencje repo → tempo.

### Pomiary i założenia

- Zmierzone: scena to wciąż zaślepka (`src/scene/index.ts` przed tym PR: 37 linii, pusta `Scene`) — nic nie
  jest jeszcze utopione w żadnej opcji.
- Zmierzone: ścieżka bez WebGL istnieje (`canvas.hidden = true`, gdy renderer rzuca wyjątek).
- Zmierzone: `prefers-reduced-motion` nie był obsłużony w `src/` (teraz: tokeny ruchu i
  `--motion-scale` w `src/styles/tokens.css`).
- Zmierzone: three.js 0.186.1 (instancing, `ShaderMaterial`, WebGL2).
- **Założenie (odwraca decyzję):** średni telefon rysuje ~1,5 tys. węzłów + ~4 tys. odcinków z
  impulsami w 60 fps, a 30 tys.+ cząsteczek GPGPU spada poniżej 45 fps. Sprawdzić w T-08: sonda
  wydajności (DevTools CPU 4×, profil telefonu klasy Moto G), czasy klatek obu budżetów.
- **Założenie (odwraca decyzję):** rzadki graf ze skierowanymi, trasowanymi impulsami czyta się
  jako „agenci przekazują sobie pracę”, a nie jako generyczny plexus. Sprawdzić w T-08: test
  5 sekund prototypu na 3 osobach spoza projektu („co pokazuje tło?”).

## Relay — opis

### Elementy

| Element        | Znaczenie                  | Wygląd (tokeny)                                                                                 |
| -------------- | -------------------------- | ----------------------------------------------------------------------------------------------- |
| Węzeł          | agent                      | punkt, rozmiar i jasność wg „obciążenia” (`--scene-node`)                                       |
| Krawędź        | kanał przekazania          | cienka linia, prawie niewidoczna w spoczynku (`--scene-edge`)                                   |
| Impuls zadania | praca wychodzi do agenta   | ciepły punkt z krótką smugą; krawędź za nim się rozświetla (`--scene-pulse-task`)               |
| Impuls wyniku  | wynik wraca do zlecającego | chłodny punkt, wolniejszy (`--scene-pulse-result`)                                              |
| Kursor / dotyk | klient zlecający pracę     | słaba poświata (`--scene-cursor`); najbliższy węzeł staje się „wejściem”, sieć trasuje do niego |
| Głębia         | skala organizacji          | 3 plany głębi, mgła liniowa do `--scene-bg`, lekka paralaksa przy ruchu kursora                 |

Co odróżnia to od plexusa (kotwice oryginalności, obowiązkowe w T-08):

1. **Graf jest stały, nie odległościowy.** Krawędzie nie migają, gdy punkty się zbliżają — to
   topologia organizacji (k najbliższych sąsiadów w 3D, z kilkoma „hubami”), a nie efekt.
2. **Ruch ma kierunek i przyczynę.** Każdy impuls jedzie trasą (BFS) od zlecającego do agenta i
   wraca z wynikiem innego koloru. Nic nie pulsuje „dla ozdoby”.
3. **Kursor jest klientem, nie magnesem.** Kursor nie odpycha punktów; po zatrzymaniu (~300 ms)
   sieć wysyła do niego wynik — strona „odpowiada”.
4. **Cisza jako stan bazowy.** W spoczynku ruch jest rzadki (kilka impulsów na sekundę), krawędzie
   ledwo widoczne. Ma to być tło dla treści, nie wygaszacz ekranu.

### Scena a sekcje strony (scroll)

Przejścia trwają `--duration-scene` (1400 ms) z `--ease-in-out`; stan sekcji wyznacza
`IntersectionObserver`, nie surowy scroll (bez pracy co zdarzenie scroll).

| Sekcja    | Stan sieci                                                                                                                            | Przekaz                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Hero      | Pełna, swobodna sieć w głębi; pierwsze impulsy startują po ~1 s od załadowania; kursor = zlecenie.                                    | „inteligencja w ruchu”                  |
| Usługi    | Sieć ściąga się w 3 klastry (pakiety P1 / P2 / P3, D-033); impulsy krążą wewnątrz klastra podświetlonego przy aktywnej karcie usługi. | jeden proces → kilka procesów → program |
| Portfolio | 4 konstelacje (4 projekty pokazowe, D-019); hover nad kartą projektu odpala serię przekazań w jego konstelacji.                       | działające przebiegi, nie slajdy        |
| Kontakt   | Wszystkie trasy zbiegają się w jeden węzeł przy adresie e-mail; sieć wycisza się do kilku impulsów.                                   | jeden punkt kontaktu (D-028)            |

Na treściach (podstrony projektów) scena działa w trybie „tła”: niższa jasność, bez interakcji.

### Wydajność (budżet T-08)

- Węzły: `InstancedMesh` z quadami w shaderze (okrąg i poświata w fragment shaderze), krawędzie:
  jeden `LineSegments` z atrybutem „aktywności”, impulsy: pula instancji. Razem 3 draw calle.
- Ruch liczony w vertex shaderze z `uTime` (dryf węzłów szumem); CPU tylko planuje trasy impulsów
  (BFS na grafie ~1,5 tys. węzłów, kilka razy na sekundę).
- Jakość adaptacyjna: start od poziomu wg `hardwareConcurrency` i szerokości ekranu (mobile:
  ~600 węzłów, DPR ≤ 1,5), potem pomiar średniego czasu klatki — powyżej 20 ms przez 2 s obniża
  poziom (liczba węzłów, DPR, poświata), nigdy nie podnosi w trakcie sesji (bez „pompowania”).
- Pauza poza ekranem (`IntersectionObserver` na canvasie) i w ukrytej karcie
  (`visibilitychange`); `requestAnimationFrame` zatrzymany, nie tylko pusty.
- Leniwe ładowanie: three.js i scena w osobnym chunku przez dynamiczny `import()` po pierwszym
  renderze treści (`requestIdleCallback`); do tego czasu tło = statyczny kadr (niżej).

### Fallbacki

- **Brak WebGL** (renderer rzuca wyjątek lub `webglcontextlost` bez powrotu): canvas ukryty, w tle
  statyczny kadr sieci — ten sam graf (`src/scene/relay-graph.ts`, deterministyczny seed)
  narysowany jako SVG tokenami sceny. Podgląd kadru: `/brand/`.
- **`prefers-reduced-motion: reduce`**: `--motion-scale` = 0 — brak dryfu i impulsów
  autonomicznych; scena renderuje jedną klatkę statycznie, przejścia sekcji to krótkie przenikanie
  zamiast przebudowy grafu; kursor nie uruchamia animacji. Treść i nawigacja bez zmian.
- **Słaby sprzęt** (najniższy poziom jakości nadal > 20 ms/klatkę): przejście na statyczny kadr
  jak przy braku WebGL.
- **Druk / PDF**: scena nie istnieje (`display: none` w druku); dokumenty używają motywu `paper`.

### Kolory i ruch tylko z tokenów

Scena nie ma literałów kolorów. Czyta `sceneTokensFromDocument()` z `src/styles/tokens.ts`
(`--scene-bg`, `--scene-node`, `--scene-edge`, `--scene-pulse-task`, `--scene-pulse-result`,
`--scene-cursor`, `--motion-scale`, `--duration-scene`). Zmiana palety w `tokens.css` zmienia
scenę, stronę, logo (`npm run brand:assets`) i PDF-y naraz.

## Koszt odwrotu

Dziś: ten dokument. Po T-08: przepisanie `src/scene` (ok. 6 plików, 1,5 dnia); `tokens.css`,
`relay-graph.ts` (kadr fallbacku) i treść strony zostają bez zmian. Runner-up B wymagałby nowego
modułu GPGPU i osobnej ścieżki mobile.

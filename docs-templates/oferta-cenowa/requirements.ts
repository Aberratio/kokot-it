// What a price quote attached to a Dig.IT 2/2026 application has to carry, numbered as in the
// research note (brain: research/digit-wymogi-oferty.md, T-05). Sources: Regulamin Konkursu
// 2/2026 (Reg.), zał. 1, 2, 3, 8, 9 — https://digit.arp.pl/eventy/nabory/digit-konkurs-22026/.
// Every number must be placed in the template with a `data-req` attribute; a test checks it.
//
// Kind: `explicit` — written in the source; `derived` — follows from it; `practice` — good
// practice not found in the primary source.

export interface Requirement {
  n: number;
  kind: 'explicit' | 'derived' | 'practice';
  title: string;
  source: string;
}

export const requirements: Requirement[] = [
  {
    n: 1,
    kind: 'explicit',
    title: 'Co najmniej 3 oferty cenowe dołączone do wniosku',
    source: 'Reg. § 6 ust. 3; zał. 9 pkt 6 lit. b',
  },
  { n: 2, kind: 'explicit', title: 'Szacowanie od 20 000 zł netto', source: 'zał. 9 pkt 2' },
  {
    n: 3,
    kind: 'explicit',
    title: 'Data oferty (ważność szacowania 3 miesiące od pierwszej oferty)',
    source: 'Reg. § 6 ust. 4; zał. 9 pkt 4',
  },
  {
    n: 4,
    kind: 'explicit',
    title: 'Ponowne rozeznanie rynku na etapie realizacji',
    source: 'Reg. § 6 ust. 4; zał. 8 § 9',
  },
  {
    n: 5,
    kind: 'derived',
    title: 'Odpowiedź na konkretne zapytanie (data, temat)',
    source: 'zał. 9 pkt 6 lit. h; zał. 8 § 9 ust. 6 lit. h',
  },
  {
    n: 6,
    kind: 'derived',
    title: 'Opis przedmiotu: zakres, funkcje, produkty, integracje',
    source: 'zał. 9 pkt 6 lit. a',
  },
  {
    n: 7,
    kind: 'derived',
    title: 'Elementy porównywalne: cena, termin, funkcjonalności, gwarancja, wsparcie',
    source: 'zał. 9 pkt 6 lit. d; zał. 8 § 9 ust. 10',
  },
  { n: 8, kind: 'derived', title: 'Przewagi techniczne oferty', source: 'zał. 9 pkt 5' },
  {
    n: 9,
    kind: 'explicit',
    title: 'Podział ceny: technologia cyfrowa / wdrożenie / szkolenie',
    source: 'zał. 9 pkt 7',
  },
  {
    n: 10,
    kind: 'derived',
    title: 'Przypisanie pozycji do kategorii kosztów wniosku',
    source: 'zał. 2 pkt 20.1.1.3',
  },
  {
    n: 11,
    kind: 'derived',
    title: 'Cena netto, VAT i brutto w PLN',
    source: 'zał. 3 pkt 20.1.1.3; Reg. § 6 ust. 25 lit. a',
  },
  {
    n: 12,
    kind: 'derived',
    title: 'Harmonogram etapów od podpisania umowy',
    source: 'zał. 3 pkt 20',
  },
  {
    n: 13,
    kind: 'derived',
    title: 'Sposób kalkulacji ceny (osobodni × stawka)',
    source: 'zał. 3 pkt 20.1.1.3 pkt 6; zał. 1',
  },
  {
    n: 14,
    kind: 'explicit',
    title: 'Przeniesienie całości autorskich praw majątkowych',
    source: 'Reg. § 1 pkt 24 lit. c; § 6 ust. 11 lit. g',
  },
  {
    n: 15,
    kind: 'explicit',
    title: 'Brak opłat licencyjnych za oprogramowanie na zamówienie',
    source: 'Reg. § 6 ust. 12',
  },
  {
    n: 16,
    kind: 'explicit',
    title: 'Możliwość rozbudowy rozwiązania',
    source: 'Reg. § 6 ust. 11 lit. a',
  },
  {
    n: 17,
    kind: 'explicit',
    title: 'Zgodność z AI Act (rozp. 2024/1689)',
    source: 'Reg. § 6 ust. 10 lit. b',
  },
  {
    n: 18,
    kind: 'explicit',
    title: 'Wdrożenie: integracja i doradztwo dostawcy, bez obsługi ciągłej',
    source: 'Reg. § 6 ust. 17',
  },
  {
    n: 19,
    kind: 'explicit',
    title: 'Szkolenie wyłącznie z używania wdrażanej technologii',
    source: 'Reg. § 6 ust. 24',
  },
  {
    n: 20,
    kind: 'explicit',
    title: 'Chmura i API tylko w okresie kwalifikowalności, zaufany dostawca',
    source: 'Reg. § 6 ust. 16, ust. 20 lit. c',
  },
  {
    n: 21,
    kind: 'explicit',
    title: 'Technologia nowa dla firmy, nie aktualizacja',
    source: 'Reg. § 4 ust. 10',
  },
  {
    n: 22,
    kind: 'explicit',
    title: 'Wykonawca niepowiązany z wnioskodawcą',
    source: 'zał. 9 pkt 1, pkt 6 lit. c; Reg. § 1 pkt 17–18',
  },
  {
    n: 23,
    kind: 'explicit',
    title: 'Samodzielna realizacja usługi programistycznej, potencjał i doświadczenie',
    source: 'Reg. § 6 ust. 11 lit. d–e',
  },
  {
    n: 24,
    kind: 'practice',
    title: 'Dane identyfikujące wykonawcę',
    source: 'zał. 9 pkt 6 lit. b (pośrednio)',
  },
  { n: 25, kind: 'practice', title: 'Dane odbiorcy oferty', source: 'dobra praktyka' },
  { n: 26, kind: 'explicit', title: 'Język polski', source: 'Reg. § 8 ust. 4' },
  {
    n: 27,
    kind: 'practice',
    title: 'Miejsce na podpis wykonawcy',
    source: 'Reg. § 8 ust. 6–8 (podpis wnioskodawcy)',
  },
  {
    n: 28,
    kind: 'practice',
    title: 'Termin ważności oferty (≥ 90 dni) i aktualizacja ceny',
    source: 'wynika z Reg. § 6 ust. 4',
  },
  { n: 29, kind: 'practice', title: 'Format pliku: PDF', source: 'Reg. § 8 ust. 2' },
  {
    n: 30,
    kind: 'derived',
    title: 'Płatność przelewem, w transzach',
    source: 'Reg. § 6 ust. 25 lit. i; § 5 ust. 5',
  },
  {
    n: 31,
    kind: 'explicit',
    title: 'Brak założeń ograniczających konkurencję',
    source: 'zał. 9 pkt 3 i 8; zał. 3 pkt 20.1.1.3 lit. g',
  },
  {
    n: 32,
    kind: 'explicit',
    title: 'Brak rozpoczęcia przed złożeniem wniosku; oferta niewiążąca',
    source: 'Reg. § 5 ust. 6; zał. 3 pkt 4.1',
  },
];

/** Requirement numbers referenced by `data-req="…"` attributes in rendered HTML. */
export function requirementsInHtml(html: string): Map<number, string[]> {
  const found = new Map<number, string[]>();
  const opening = /<([a-z0-9]+)\b[^>]*\bdata-req="([^"]+)"[^>]*>/gi;
  for (const m of html.matchAll(opening)) {
    const tagName = (m[1] ?? '').toLowerCase();
    const start = m.index + m[0].length;
    // Find the matching closing tag, counting nested elements with the same name.
    const tags = new RegExp(`<(/?)${tagName}\\b[^>]*>`, 'gi');
    tags.lastIndex = start;
    let depth = 1;
    let end = html.length;
    for (let t = tags.exec(html); t; t = tags.exec(html)) {
      depth += t[1] === '/' ? -1 : 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    const inner = html
      .slice(start, end)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    for (const n of (m[2] ?? '').split(/\s+/).map(Number)) {
      found.set(n, [...(found.get(n) ?? []), inner]);
    }
  }
  return found;
}

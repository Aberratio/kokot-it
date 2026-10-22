import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findPackage, pricing } from '../oferta/pricing.ts';
import { findPlaceholders, visibleText } from '../shared/html.ts';
import { priceQuote, quoteProblems, type QuoteData } from './quote.ts';
import { renderQuote } from './render.ts';
import { requirements, requirementsInHtml } from './requirements.ts';

const load = (name: string): QuoteData =>
  JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8')) as QuoteData;

const blank = load('data.template.json');
const example = load('data.example.json');
const blankHtml = renderQuote({ data: blank, email: null });
const exampleHtml = renderQuote({ data: example, email: 'kontakt@example.com' });

describe('Dig.IT requirements (research/digit-wymogi-oferty.md)', () => {
  it('lists the 32 numbered requirements', () => {
    expect(requirements.map((r) => r.n)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1));
  });

  it.each([
    ['blank template', blankHtml],
    ['example', exampleHtml],
  ])('every requirement has a place with content in the %s', (_, html) => {
    const placed = requirementsInHtml(html);
    const missing = requirements
      .filter((r) => !placed.has(r.n))
      .map((r) => `${String(r.n)}. ${r.title}`);
    expect(missing).toEqual([]);
    for (const [n, texts] of placed) {
      expect(
        requirements.some((r) => r.n === n),
        `unknown requirement ${String(n)}`,
      ).toBe(true);
      expect(
        texts.some((t) => t.length > 0),
        `requirement ${String(n)} has an empty element`,
      ).toBe(true);
    }
  });

  it('finds nested data-req elements too', () => {
    const placed = requirementsInHtml(
      '<section data-req="6"><p>a</p><p data-req="21">b</p></section>',
    );
    expect(placed.get(6)).toEqual(['a b']);
    expect(placed.get(21)).toEqual(['b']);
  });
});

describe('price quote template', () => {
  it('is Polish (D-035)', () => {
    expect(blankHtml).toContain('<html lang="pl"');
  });

  it('keeps contractor data as fields: name, NIP, address (D-028)', () => {
    const fields = findPlaceholders(visibleText(blankHtml));
    expect(fields).toEqual(
      expect.arrayContaining([
        '{{NAZWA_FIRMY}}',
        '{{NIP}}',
        '{{ADRES}}',
        '{{EMAIL}}',
        '{{NAZWA_KLIENTA}}',
      ]),
    );
    expect(findPlaceholders(visibleText(exampleHtml))).toEqual(
      expect.arrayContaining(['{{NAZWA_FIRMY}}', '{{NIP}}', '{{ADRES}}']),
    );
  });

  it('never stores contractor data in the repo data files', () => {
    expect(blank.contractor).toBeUndefined();
    expect(example.contractor).toBeUndefined();
  });

  it('splits the price into technology, implementation and training with net, VAT and gross', () => {
    const text = visibleText(exampleHtml);
    expect(text).toContain('Technologia cyfrowa — oprogramowanie na zamówienie');
    expect(text).toContain('Komponent obligatoryjny – zakup usług programistycznych');
    expect(text).toContain('Komponent obligatoryjny – wdrożenie Technologii cyfrowych');
    expect(text).toContain('Komponent fakultatywny – przeszkolenie pracowników');
    expect(text).toMatch(/Netto VAT 23% Brutto/);
  });

  it('marks the example as fictional and keeps the preliminary-pricing badge', () => {
    expect(visibleText(exampleHtml)).toContain('PRZYKŁAD — fikcyjna firma');
    expect(exampleHtml).toContain('data-draft');
    expect(blankHtml).not.toContain('data-example');
  });

  it('shows validity of 90 days and the start-after-application clause', () => {
    const text = visibleText(blankHtml);
    expect(text).toContain('Oferta jest ważna 90 dni');
    expect(text).toContain('najwcześniej po złożeniu wniosku');
  });
});

describe('pricing a quote from pricing.json', () => {
  it('prices the example within the P2 range, days × rate, VAT 23%', () => {
    const priced = priceQuote(example);
    expect(priced.days).toBe(51);
    expect(priced.services).toEqual({ net: 10_200_000, vat: 2_346_000, gross: 12_546_000 });
    expect(priced.byCategory?.programming.net).toBe(24 * 2000 * 100);
    expect(priced.byCategory?.training.net).toBe(3 * 2000 * 100);
    expect(priced.external).toEqual({ net: 550_000, vat: 126_500, gross: 676_500 });
    expect(priced.total?.gross).toBe(13_222_500);
    expect(quoteProblems(example)).toEqual([]);
  });

  it('leaves the blank template unpriced', () => {
    const priced = priceQuote(blank);
    expect(priced.total).toBeNull();
    expect(priced.stages.every((s) => s.net === null)).toBe(true);
  });

  it('lists every stage of the package in the blank template', () => {
    expect(blank.stages.map((s) => s.id)).toEqual(
      findPackage(blank.package).stages.map((s) => s.id),
    );
  });

  it('reports days outside a stage range, a total outside the package and short validity', () => {
    const bad: QuoteData = {
      ...example,
      offer: { ...example.offer, validityDays: 30 },
      stages: example.stages.map((s) => (s.id === 'build' ? { ...s, days: 60 } : s)),
    };
    expect(quoteProblems(bad, pricing)).toEqual([
      'stage build: 60 days outside 17–30',
      'services net 174000 zł outside P2 range 70000–130000',
      'validity 30 days, at least 90 required',
    ]);
  });

  it('rejects a stage that the package does not have', () => {
    expect(() =>
      priceQuote({ ...example, stages: [{ id: 'twin', days: 1, schedule: '' }] }),
    ).toThrow('Stage "twin" is not part of P2');
  });
});

import {
  findPackage,
  pricing as defaultPricing,
  type Category,
  type Pricing,
} from '../oferta/pricing.ts';

// Data of one price quote for a Dig.IT application (T-05 form b, Polish only — D-035).
// Strings may hold `{{FIELD}}` placeholders; the blank template (data.template.json) is all
// placeholders, the example (data.example.json) is a fictional company. A real quote is a
// private file outside the repo, rendered with `npm run pdf -- --quote <file> --final`.
// Contractor data (name, NIP, address) is never stored in the repo (D-028).

export interface QuoteStage {
  /** Stage id from pricing.json for the chosen package. */
  id: string;
  /** Person-days; `null` in the blank template. */
  days: number | null;
  /** When, counted from signing the contract, e.g. "1. miesiąc". */
  schedule: string;
}

export interface ExternalCost {
  name: string;
  provider: string;
  dataRegion: string;
  sla: string;
  /** Estimated net cost during the project, whole złoty; `null` in the blank template. */
  projectNet: number | null;
  /** Estimated monthly net cost paid by the company after the project. */
  monthlyAfter: string;
}

export interface QuoteData {
  /** When set, the document carries an "example" banner with this text. */
  example?: string;
  offer: { number: string; date: string; place: string; validityDays: number };
  inquiry: { date: string; subject: string; reference: string };
  client: { name: string; address: string };
  contractor?: {
    name?: string;
    nip?: string;
    address?: string;
    email?: string;
    signatory?: string;
  };
  package: 'P2' | 'P3';
  /** Total delivery time from signing the contract, e.g. "5 miesięcy od podpisania umowy". */
  duration: string;
  scope: {
    title: string;
    process: string;
    functions: string[];
    integrations: string[];
    deliverables: string[];
  };
  stages: QuoteStage[];
  externalCosts: ExternalCost[];
  training: { participants: string; days: string; program: string[] };
  advantages: string[];
  warranty: string;
  payment: { milestone: string; share: string }[];
}

export interface PricedStage extends QuoteStage {
  label: string;
  category: Category;
  range: [number, number];
  /** Net, gross and VAT in grosze; `null` when days are not filled in. */
  net: number | null;
  vat: number | null;
  gross: number | null;
}

export interface Totals {
  net: number;
  vat: number;
  gross: number;
}

export interface PricedQuote {
  stages: PricedStage[];
  /** Per Dig.IT category, in grosze; `null` when any stage of the quote has no days yet. */
  byCategory: Record<Category, Totals> | null;
  services: Totals | null;
  external: Totals | null;
  total: Totals | null;
  days: number | null;
}

const vatOf = (net: number, rate: number): number => Math.round(net * rate);
const totals = (net: number, rate: number): Totals => {
  const vat = vatOf(net, rate);
  return { net, vat, gross: net + vat };
};
const add = (a: Totals, b: Totals): Totals => ({
  net: a.net + b.net,
  vat: a.vat + b.vat,
  gross: a.gross + b.gross,
});
const ZERO: Totals = { net: 0, vat: 0, gross: 0 };

/** Prices every stage from pricing.json: days × day rate, VAT per line, sums per category. */
export function priceQuote(q: QuoteData, p: Pricing = defaultPricing): PricedQuote {
  const pkg = findPackage(q.package, p);
  const stages: PricedStage[] = q.stages.map((s) => {
    const def = pkg.stages.find((d) => d.id === s.id);
    if (!def) throw new Error(`Stage "${s.id}" is not part of ${pkg.code} in pricing.json`);
    const net = s.days === null ? null : s.days * p.dayRateNet * 100;
    const vat = net === null ? null : vatOf(net, p.vatRate);
    return {
      ...s,
      label: def.label.pl,
      category: def.category,
      range: def.days,
      net,
      vat,
      gross: net === null || vat === null ? null : net + vat,
    };
  });
  const complete = stages.every((s) => s.net !== null);
  const externalComplete = q.externalCosts.every((c) => c.projectNet !== null);
  if (!complete) {
    return { stages, byCategory: null, services: null, external: null, total: null, days: null };
  }
  const byCategory: Record<Category, Totals> = {
    programming: ZERO,
    implementation: ZERO,
    training: ZERO,
  };
  for (const s of stages) {
    byCategory[s.category] = add(byCategory[s.category], {
      net: s.net ?? 0,
      vat: s.vat ?? 0,
      gross: s.gross ?? 0,
    });
  }
  const services = Object.values(byCategory).reduce(add, ZERO);
  const external = externalComplete
    ? q.externalCosts.reduce((t, c) => add(t, totals((c.projectNet ?? 0) * 100, p.vatRate)), ZERO)
    : null;
  return {
    stages,
    byCategory,
    services,
    external,
    total: external ? add(services, external) : null,
    days: stages.reduce((d, s) => d + (s.days ?? 0), 0),
  };
}

/** Problems a priced quote has against the price list; empty when it is within the ranges. */
export function quoteProblems(q: QuoteData, p: Pricing = defaultPricing): string[] {
  const problems: string[] = [];
  const pkg = findPackage(q.package, p);
  const priced = priceQuote(q, p);
  for (const s of priced.stages) {
    if (s.days !== null && (s.days < s.range[0] || s.days > s.range[1])) {
      problems.push(
        `stage ${s.id}: ${String(s.days)} days outside ${String(s.range[0])}–${String(s.range[1])}`,
      );
    }
  }
  const missing = pkg.stages.filter((d) => !q.stages.some((s) => s.id === d.id)).map((d) => d.id);
  if (missing.length > 0) problems.push(`stages missing from the quote: ${missing.join(', ')}`);
  if (priced.services) {
    const net = priced.services.net / 100;
    if (net < pkg.netMin || net > pkg.netMax) {
      problems.push(
        `services net ${String(net)} zł outside ${pkg.code} range ${String(pkg.netMin)}–${String(pkg.netMax)}`,
      );
    }
  }
  if (q.offer.validityDays < 90)
    problems.push(`validity ${String(q.offer.validityDays)} days, at least 90 required`);
  return problems;
}

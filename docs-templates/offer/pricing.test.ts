import { describe, expect, it } from 'vitest';
import { findPackage, isDraft, pricing, pricingProblems, type Pricing } from './pricing.ts';

// Expected values copied by hand from the owner's private price list. If the price list
// changes there, change both places on purpose.
const CENNIK = {
  dayRateNet: 2000,
  vatRate: 0.23,
  packages: {
    P1: { netMin: 10_000, netMax: 16_000, days: [5, 8], externalNet: null },
    P2: { netMin: 70_000, netMax: 130_000, days: [36, 65], externalNet: [2000, 8000] },
    P3: { netMin: 240_000, netMax: 410_000, days: [120, 205], externalNet: [8000, 25_000] },
  },
  stageDays: {
    P2: {
      analysis: [3, 5],
      build: [17, 30],
      integration: [8, 15],
      pilot: [4, 8],
      training: [2, 4],
      hypercare: [2, 3],
    },
    P3: {
      analysis: [8, 12],
      agents: [45, 80],
      twin: [35, 60],
      integration: [15, 25],
      pilot: [8, 14],
      training: [5, 8],
      hypercare: [4, 6],
    },
  },
} as const;

describe('pricing.json — the single source of prices', () => {
  it('matches the day rate and VAT of the price list', () => {
    expect(pricing.dayRateNet).toBe(CENNIK.dayRateNet);
    expect(pricing.vatRate).toBe(CENNIK.vatRate);
    expect(pricing.currency).toBe('PLN');
  });

  it.each(Object.entries(CENNIK.packages))(
    '%s ranges match research/cennik.md',
    (code, expected) => {
      const pkg = findPackage(code);
      expect(pkg.netMin).toBe(expected.netMin);
      expect(pkg.netMax).toBe(expected.netMax);
      expect(pkg.days).toEqual(expected.days);
      expect(pkg.externalNet).toEqual(expected.externalNet);
    },
  );

  it.each(Object.entries(CENNIK.stageDays))(
    '%s stage days match research/cennik.md',
    (code, stages) => {
      const pkg = findPackage(code);
      expect(Object.fromEntries(pkg.stages.map((s) => [s.id, s.days]))).toEqual(stages);
    },
  );

  it('is internally consistent: ranges = days × rate, stages add up, splits sum to 100%', () => {
    expect(pricingProblems()).toEqual([]);
  });

  it('flags a range that does not follow days × rate', () => {
    const broken: Pricing = {
      ...pricing,
      packages: pricing.packages.map((p) => (p.code === 'P2' ? { ...p, netMax: 150_000 } : p)),
    };
    expect(pricingProblems(broken)).toEqual([expect.stringContaining('P2: netMax 150000')]);
  });

  it('stays a draft until the owner approves the price list', () => {
    expect(pricing.status).toBe('draft');
    expect(isDraft()).toBe(true);
    expect(isDraft({ ...pricing, status: 'approved' })).toBe(false);
  });
});

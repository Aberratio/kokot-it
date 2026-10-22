import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quoteDataProblems, sharesInTenths } from './quote.ts';

const example = JSON.parse(
  readFileSync(new URL('data.example.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;
const withCosts = (costs: unknown[], payment: unknown = example.payment) =>
  quoteDataProblems({ ...example, externalCosts: costs, payment });
const cost = (overrides: Record<string, unknown>) => ({
  ...(example.externalCosts as Record<string, unknown>[])[0],
  ...overrides,
});

describe('quoteDataProblems: external costs and payment', () => {
  it('accepts the example', () => {
    expect(quoteDataProblems(example)).toEqual([]);
  });

  it('wants whole, non-negative zloty for an external cost, naming the field', () => {
    for (const projectNet of [12.5, -1, '100']) {
      expect(withCosts([cost({ projectNet })]), String(projectNet)).toEqual([
        'externalCosts[0].projectNet must be a whole number of zloty (0 or more) or null',
      ]);
    }
    expect(withCosts([cost({ projectNet: null })])).toEqual([]);
  });

  it('wants every text field of an external cost and a payment milestone', () => {
    expect(withCosts([cost({ provider: 7, sla: undefined })])).toEqual([
      'externalCosts[0].provider must be a string',
      'externalCosts[0].sla must be a string',
    ]);
    expect(withCosts([], [{ milestone: 'odbiór', share: 40 }, 'x'])).toEqual([
      'payment[0].share must be a string',
      'payment[1] must be an object',
    ]);
    expect(withCosts([], null)).toEqual(['payment must be an array']);
  });
});

describe('sharesInTenths', () => {
  it('always adds up to exactly 100.0%', () => {
    for (const values of [
      [1, 1, 1],
      [2, 2, 2, 1],
      [70_000, 25_000, 5_000],
      [33_333, 33_333, 33_334],
      [1, 0, 0],
    ]) {
      const shares = sharesInTenths(values);
      expect(
        shares.reduce((a, b) => a + b, 0),
        values.join(','),
      ).toBe(1000);
    }
  });

  it('gives the missing tenths to the largest remainders', () => {
    expect(sharesInTenths([1, 1, 1])).toEqual([334, 333, 333]);
    expect(sharesInTenths([2, 1])).toEqual([667, 333]);
  });

  it('returns zeros for an empty total', () => {
    expect(sharesInTenths([0, 0])).toEqual([0, 0]);
  });
});

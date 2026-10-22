import pricingJson from './pricing.json' with { type: 'json' };
import type { Lang } from '../shared/html.ts';

/** Dig.IT cost categories a stage belongs to (Wzór wniosku, pkt 20.1.1.3). */
export type Category = 'programming' | 'implementation' | 'training';

export interface Stage {
  id: string;
  category: Category;
  days: [number, number];
  label: Record<Lang, string>;
}

export interface Package {
  code: 'P1' | 'P2' | 'P3';
  netMin: number;
  netMax: number;
  days: [number, number];
  duration: Record<Lang, string>;
  externalNet: [number, number] | null;
  typicalSplit: Record<Category, number> | null;
  stages: Stage[];
}

export interface Pricing {
  /** `draft` until the owner approves the price list (D-021); drives the "preliminary" badge. */
  status: 'draft' | 'approved';
  currency: 'PLN';
  vatRate: number;
  dayRateNet: number;
  hoursPerDay: number;
  packages: Package[];
}

// JSON imports widen tuples to arrays; pricingProblems() and pricing.test.ts check the shape.
export const pricing = pricingJson as unknown as Pricing;

export function isDraft(p: Pricing = pricing): boolean {
  return p.status !== 'approved';
}

export function findPackage(code: string, p: Pricing = pricing): Package {
  const pkg = p.packages.find((x) => x.code === code);
  if (!pkg)
    throw new Error(
      `Unknown package ${code}; pricing.json has ${p.packages.map((x) => x.code).join(', ')}`,
    );
  return pkg;
}

/** Problems that make the price list inconsistent; empty when it is sound. */
export function pricingProblems(p: Pricing = pricing): string[] {
  const problems: string[] = [];
  const status: unknown = p.status;
  if (status !== 'draft' && status !== 'approved') problems.push(`status: ${String(status)}`);
  for (const pkg of p.packages) {
    const [dMin, dMax] = pkg.days;
    if (pkg.netMin > dMin * p.dayRateNet || pkg.netMin < dMin * p.dayRateNet - 5000) {
      problems.push(
        `${pkg.code}: netMin ${String(pkg.netMin)} does not match ${String(dMin)} days × rate`,
      );
    }
    if (pkg.netMax > dMax * p.dayRateNet || pkg.netMax < dMax * p.dayRateNet - 5000) {
      problems.push(
        `${pkg.code}: netMax ${String(pkg.netMax)} does not match ${String(dMax)} days × rate`,
      );
    }
    if (pkg.stages.length > 0) {
      const sumMin = pkg.stages.reduce((s, st) => s + st.days[0], 0);
      const sumMax = pkg.stages.reduce((s, st) => s + st.days[1], 0);
      if (sumMin !== dMin || sumMax !== dMax) {
        problems.push(
          `${pkg.code}: stages add up to ${String(sumMin)}–${String(sumMax)} days, package says ${String(dMin)}–${String(dMax)}`,
        );
      }
    }
    if (pkg.typicalSplit) {
      const total = Object.values(pkg.typicalSplit).reduce((s, v) => s + v, 0);
      if (Math.abs(total - 1) > 1e-9)
        problems.push(`${pkg.code}: typical split adds up to ${String(total)}`);
    }
  }
  return problems;
}

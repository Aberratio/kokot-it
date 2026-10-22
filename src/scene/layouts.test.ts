import { describe, expect, it } from 'vitest';
import { clusterCentres, CONVERGE_NODE, layoutFor, type Frame } from './layouts.ts';
import { buildNetwork, groupOf } from './network.ts';

const net = buildNetwork({ seed: 2026, count: 240 });
const wide: Frame = { halfWidth: 8, halfHeight: 4.5, depth: 3 };
const tall: Frame = { halfWidth: 2.2, halfHeight: 4.6, depth: 3 };

const at = (p: Float32Array, i: number): [number, number, number] => [
  p[i * 3] ?? NaN,
  p[i * 3 + 1] ?? NaN,
  p[i * 3 + 2] ?? NaN,
];
const dist2d = (a: readonly number[], b: readonly number[]): number =>
  Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0));

describe('layoutFor', () => {
  it('returns one finite xyz per node, the same for the same input', () => {
    for (const mode of ['free', 'clusters', 'constellations', 'converge'] as const) {
      const p = layoutFor(mode, net, wide, { hub: [3, -2] });
      expect(p).toHaveLength(240 * 3);
      expect(Array.from(p).every(Number.isFinite)).toBe(true);
      expect(layoutFor(mode, net, wide, { hub: [3, -2] })).toEqual(p);
    }
  });

  it('free: spreads the network over the whole frame (with a small overscan)', () => {
    const p = layoutFor('free', net, wide);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < 240; i++) {
      const [x, y, z] = at(p, i);
      expect(Math.abs(x)).toBeLessThanOrEqual(wide.halfWidth * 1.15);
      expect(Math.abs(y)).toBeLessThanOrEqual(wide.halfHeight * 1.15);
      expect(Math.abs(z)).toBeLessThanOrEqual(wide.depth);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    expect(maxX - minX).toBeGreaterThan(wide.halfWidth * 1.6);
  });

  it.each([
    ['clusters', 3],
    ['constellations', 4],
  ] as const)('%s: pulls each group into its own island, apart from the others', (mode, k) => {
    for (const frame of [wide, tall]) {
      const p = layoutFor(mode, net, frame);
      const centres = clusterCentres(mode, frame);
      expect(centres).toHaveLength(k);
      const radius = Math.max(
        ...Array.from({ length: 240 }, (_, i) =>
          dist2d(at(p, i), centres[groupOf(net, mode, i)] ?? [NaN, NaN]),
        ),
      );
      for (let g = 0; g < k; g++) {
        for (let h = g + 1; h < k; h++) {
          const gap = dist2d(centres[g] ?? [], centres[h] ?? []);
          expect(gap, `${mode} ${String(g)}-${String(h)}`).toBeGreaterThan(radius * 1.5);
        }
        const [cx, cy] = centres[g] ?? [NaN, NaN];
        expect(Math.abs(cx)).toBeLessThan(frame.halfWidth);
        expect(Math.abs(cy)).toBeLessThan(frame.halfHeight);
      }
    }
  });

  it('converge: puts the contact node on the hub point and draws every agent toward it', () => {
    const hub: [number, number] = [3, -2];
    const free = layoutFor('free', net, wide);
    const p = layoutFor('converge', net, wide, { hub });
    const [hx, hy] = at(p, CONVERGE_NODE);
    expect(hx).toBeCloseTo(3, 5);
    expect(hy).toBeCloseTo(-2, 5);
    for (let i = 0; i < 240; i++) {
      expect(dist2d(at(p, i), hub)).toBeLessThanOrEqual(dist2d(at(free, i), hub) + 1e-6);
    }
  });

  it('converge without a hub point gathers at the frame centre', () => {
    const p = layoutFor('converge', net, wide);
    const [hx, hy] = at(p, CONVERGE_NODE);
    expect(hx).toBeCloseTo(0, 5);
    expect(hy).toBeCloseTo(0, 5);
  });
});

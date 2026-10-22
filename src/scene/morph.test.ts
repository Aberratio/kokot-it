import { describe, expect, it } from 'vitest';
import { cubicBezier, nodeProgress, parseCubicBezier, snapshotPositions } from './morph.ts';

describe('cubicBezier', () => {
  it('is the identity for the linear curve', () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const t of [0, 0.1, 0.37, 0.5, 0.9, 1]) expect(linear(t)).toBeCloseTo(t, 5);
  });

  it('follows the brand ease-in-out: ends fixed, symmetric, slow start', () => {
    const ease = cubicBezier(0.65, 0, 0.35, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.5, 5);
    // Symmetric control points: f(t) + f(1 - t) = 1.
    for (const t of [0.1, 0.25, 0.4]) expect(ease(t) + ease(1 - t)).toBeCloseTo(1, 5);
    expect(ease(0.2)).toBeLessThan(0.2 / 2);
    let last = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      expect(ease(t)).toBeGreaterThanOrEqual(last);
      last = ease(t);
    }
  });

  it('solves for time, not curve parameter: CSS `ease` at 50 % is 0.8024', () => {
    // Reference value of cubic-bezier(0.25, 0.1, 0.25, 1) at x = 0.5, as browsers compute it.
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 4);
  });

  it('still solves curves whose flat end stalls Newton steps (bisection)', () => {
    // cubic-bezier(1, 0, 1, 1): x(s) = 1 - (1 - s)^3, y(s) = s^2 (3 - 2s) — solved in closed form.
    const curve = cubicBezier(1, 0, 1, 1);
    for (const t of [0.5, 0.9, 0.999]) {
      const s = 1 - Math.cbrt(1 - t);
      expect(curve(t), `t=${String(t)}`).toBeCloseTo(s * s * (3 - 2 * s), 4);
    }
  });

  it('clamps outside [0, 1]', () => {
    const ease = cubicBezier(0.65, 0, 0.35, 1);
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
  });
});

describe('parseCubicBezier', () => {
  it('reads the CSS timing function of --ease-in-out', () => {
    expect(parseCubicBezier('cubic-bezier(0.65, 0, 0.35, 1)')).toEqual([0.65, 0, 0.35, 1]);
    expect(parseCubicBezier(' cubic-bezier(.2,.7,.2,1) ')).toEqual([0.2, 0.7, 0.2, 1]);
  });

  it('rejects anything else', () => {
    expect(() => parseCubicBezier('ease-in-out')).toThrow(/cubic-bezier/);
  });
});

describe('nodeProgress (stagger of a re-wiring)', () => {
  it('starts every node at 0 and lands every node at 1', () => {
    for (const seed of [0, 0.3, 0.999]) {
      expect(nodeProgress(0, seed)).toBe(0);
      expect(nodeProgress(1, seed)).toBe(1);
    }
  });

  it('lets low seeds lead and high seeds follow', () => {
    expect(nodeProgress(0.3, 0)).toBeGreaterThan(nodeProgress(0.3, 0.9));
    // With the default spread of 0.35, a node with seed 0.9 has not moved at 30 %.
    expect(nodeProgress(0.3, 0.9)).toBe(0);
  });

  it('never moves backwards', () => {
    for (const seed of [0, 0.5, 0.95]) {
      let last = 0;
      for (let p = 0; p <= 1.0001; p += 0.02) {
        const v = nodeProgress(p, seed);
        expect(v).toBeGreaterThanOrEqual(last);
        last = v;
      }
    }
  });
});

describe('snapshotPositions', () => {
  it('freezes the in-between layout so an interrupted re-wiring continues from where it is', () => {
    const from = new Float32Array([0, 0, 0, 10, 10, 10]);
    const to = new Float32Array([10, 0, 0, 10, 10, 10]);
    const seeds = [0, 0.5];
    expect(Array.from(snapshotPositions(from, to, seeds, 0))).toEqual(Array.from(from));
    expect(Array.from(snapshotPositions(from, to, seeds, 1))).toEqual(Array.from(to));
    const mid = snapshotPositions(from, to, seeds, 0.5);
    const p = nodeProgress(0.5, 0);
    expect(mid[0]).toBeCloseTo(10 * p, 5);
    expect(Array.from(mid.slice(3))).toEqual([10, 10, 10]);
  });
});

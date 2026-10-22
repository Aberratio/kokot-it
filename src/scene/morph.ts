/**
 * Timing of the scene's re-wiring between page sections. The global curve is the brand's
 * `--ease-in-out`; each node then moves on its own slice of it (stagger by node seed), so the
 * network rebuilds like a crowd re-forming, not like a single tween.
 *
 * `nodeProgress` is mirrored in GLSL (shaders.ts, `nodeProgress`); keep the two in step.
 */

/** Share of the transition over which node starts are spread. Mirrored in shaders.ts. */
export const STAGGER_SPREAD = 0.35;

/** CSS `cubic-bezier(x1, y1, x2, y2)` as a function of time in [0, 1]. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const bez = (a: number, b: number, s: number): number => {
    const u = 1 - s;
    return 3 * u * u * s * a + 3 * u * s * s * b + s * s * s;
  };
  const slope = (a: number, b: number, s: number): number => {
    const u = 1 - s;
    return 3 * u * u * a + 6 * u * s * (b - a) + 3 * s * s * (1 - b);
  };
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Solve x(s) = t: Newton first, bisection when the slope is flat.
    let s = t;
    for (let i = 0; i < 8; i++) {
      const err = bez(x1, x2, s) - t;
      const d = slope(x1, x2, s);
      if (Math.abs(err) < 1e-7) return bez(y1, y2, s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    let lo = 0;
    let hi = 1;
    s = t;
    for (let i = 0; i < 40; i++) {
      const x = bez(x1, x2, s);
      if (Math.abs(x - t) < 1e-7) break;
      if (x < t) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return bez(y1, y2, s);
  };
}

export function parseCubicBezier(value: string): [number, number, number, number] {
  const match =
    /^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/.exec(
      value.trim(),
    );
  const numbers = match?.slice(1, 5).map(Number);
  if (!numbers || numbers.length !== 4 || numbers.some((n) => !Number.isFinite(n))) {
    throw new Error(`Not a cubic-bezier() timing function: "${value}"`);
  }
  return numbers as [number, number, number, number];
}

/** A node's own progress in [0, 1] for the global (eased) progress `p`. */
export function nodeProgress(p: number, seed: number, spread = STAGGER_SPREAD): number {
  const s = Math.min(1, Math.max(0, (p - seed * spread) / (1 - spread)));
  return s * s * (3 - 2 * s);
}

/** Positions (xyz per node) at global progress `p` between two layouts. */
export function snapshotPositions(
  from: Float32Array,
  to: Float32Array,
  seeds: readonly number[],
  p: number,
): Float32Array {
  const out = new Float32Array(to.length);
  for (let i = 0; i < seeds.length; i++) {
    const k = nodeProgress(p, seeds[i] ?? 0);
    for (let c = 0; c < 3; c++) {
      const a = from[i * 3 + c] ?? 0;
      const b = to[i * 3 + c] ?? 0;
      out[i * 3 + c] = a + (b - a) * k;
    }
  }
  return out;
}

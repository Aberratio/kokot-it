/**
 * Where the agents stand in each state of the page (docs/concept.md, "Scena a sekcje strony").
 * The topology never changes — only positions do, so a section change reads as the same
 * organisation re-forming: free network (hero), 3 service clusters, 4 project constellations,
 * and everything converging on one node next to the e-mail address (contact).
 *
 * Positions are world units in front of a camera that sees `halfWidth × halfHeight` at z = 0.
 */
import { GROUP_COUNT, type GroupKind, type Network } from './network.ts';

export type SceneMode = 'free' | GroupKind | 'converge';

export interface Frame {
  readonly halfWidth: number;
  readonly halfHeight: number;
  /** Half the depth of the volume, in world units. */
  readonly depth: number;
}

export interface LayoutOptions {
  /** Converge: the point (world x, y at z = 0) next to the e-mail address. */
  readonly hub?: readonly [number, number];
}

/** The agent everything converges on in the contact section; node 0 exists at every quality. */
export const CONVERGE_NODE = 0;

const OVERSCAN = 1.1;

/** Island centres per group, laid out for a wide or a tall frame. */
export function clusterCentres(mode: GroupKind, frame: Frame): [number, number][] {
  const { halfWidth: w, halfHeight: h } = frame;
  const isWide = w >= h;
  const unit: readonly (readonly [number, number])[] =
    mode === 'clusters'
      ? isWide
        ? // Behind the P1–P3 offer columns: a hovered offer lights the cluster behind it.
          [
            [-0.575, 0.06],
            [0, -0.12],
            [0.575, 0.06],
          ]
        : [
            [-0.32, 0.58],
            [0.36, 0.02],
            [-0.24, -0.56],
          ]
      : isWide
        ? [
            [-0.66, -0.14],
            [-0.22, 0.26],
            [0.22, -0.22],
            [0.66, 0.18],
          ]
        : [
            [-0.38, 0.5],
            [0.4, 0.26],
            [-0.36, -0.22],
            [0.38, -0.5],
          ];
  return unit.map(([x, y]) => [x * w, y * h]);
}

function islandRadius(mode: GroupKind, frame: Frame): number {
  const short = Math.min(frame.halfWidth, frame.halfHeight);
  return (mode === 'clusters' ? 0.34 : 0.24) * short;
}

export function layoutFor(
  mode: SceneMode,
  net: Network,
  frame: Frame,
  options: LayoutOptions = {},
): Float32Array {
  const out = new Float32Array(net.nodes.length * 3);
  const { halfWidth: w, halfHeight: h, depth } = frame;

  if (mode === 'free' || mode === 'converge') {
    net.nodes.forEach((n, i) => {
      out[i * 3] = n.x * w * OVERSCAN;
      out[i * 3 + 1] = n.y * h * OVERSCAN;
      out[i * 3 + 2] = n.z * depth;
    });
    if (mode === 'converge') {
      const [hx, hy] = options.hub ?? [0, 0];
      net.nodes.forEach((n, i) => {
        // The contact node lands exactly on the hub; the rest are drawn in, each by its own share.
        const keep = i === CONVERGE_NODE ? 0 : 0.16 + 0.42 * n.seed;
        out[i * 3] = hx + ((out[i * 3] ?? 0) - hx) * keep;
        out[i * 3 + 1] = hy + ((out[i * 3 + 1] ?? 0) - hy) * keep;
        out[i * 3 + 2] = (out[i * 3 + 2] ?? 0) * (i === CONVERGE_NODE ? 0 : 0.6);
      });
    }
    return out;
  }

  const k = GROUP_COUNT[mode];
  const centres = clusterCentres(mode, frame);
  const radius = islandRadius(mode, frame);
  // Each island keeps its group's own shape, scaled to fit the radius.
  const mean = Array.from({ length: k }, () => ({ x: 0, y: 0, m: 0, spread: 0 }));
  net.nodes.forEach((n, i) => {
    const g = mean[net.groups[mode][i] ?? 0];
    if (!g) return;
    g.x += n.x;
    g.y += n.y;
    g.m++;
  });
  for (const g of mean) {
    g.x /= Math.max(g.m, 1);
    g.y /= Math.max(g.m, 1);
  }
  net.nodes.forEach((n, i) => {
    const g = mean[net.groups[mode][i] ?? 0];
    if (g) g.spread = Math.max(g.spread, Math.hypot(n.x - g.x, n.y - g.y));
  });
  net.nodes.forEach((n, i) => {
    const group = net.groups[mode][i] ?? 0;
    const g = mean[group];
    const [cx, cy] = centres[group] ?? [0, 0];
    const scale = g && g.spread > 0 ? radius / g.spread : 0;
    out[i * 3] = cx + (n.x - (g?.x ?? 0)) * scale;
    out[i * 3 + 1] = cy + (n.y - (g?.y ?? 0)) * scale;
    out[i * 3 + 2] = n.z * depth * 0.5;
  });
  return out;
}

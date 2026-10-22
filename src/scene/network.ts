/**
 * The Relay network in 3D (docs/concept.md): a fixed topology of agents, not a distance
 * plexus. Nodes live in a unit volume on three depth planes; links are decided once, at build
 * time, and never flicker. Everything is derived from one seed, so the scene, the tests and
 * every visit see the same organisation.
 *
 * Nodes are generated in random order and each node links only to nodes created before it.
 * That makes every prefix `[0, n)` a connected network of its own, and the edge list a prefix
 * list too — the quality levels draw the first n nodes and the first `edgesWithin(n)` edges.
 */
import { mulberry32 } from './relay-graph.ts';

export interface NetworkNode {
  /** Unit-volume position, each axis in [-1, 1]. */
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Depth plane: 0 far, 1 middle, 2 near. */
  readonly layer: number;
  /** (0, 1], how busy the agent is: drives size and brightness. Hubs are 1. */
  readonly weight: number;
  /** [0, 1), per-node phase for drift and the stagger of a re-wiring. */
  readonly seed: number;
}

export type GroupKind = 'clusters' | 'constellations';

export interface Network {
  readonly nodes: readonly NetworkNode[];
  /** Undirected links, ordered by their larger endpoint. */
  readonly edges: readonly (readonly [number, number])[];
  readonly adjacency: readonly (readonly number[])[];
  /** The busiest agents, where autonomous work starts. */
  readonly hubs: readonly number[];
  /** Group index per node: 3 service clusters (P1–P3) and 4 project constellations. */
  readonly groups: Readonly<Record<GroupKind, readonly number[]>>;
}

export interface NetworkOptions {
  readonly seed: number;
  readonly count: number;
  /** Most links a node makes to earlier nodes. */
  readonly links?: number;
}

export const GROUP_COUNT: Readonly<Record<GroupKind, number>> = { clusters: 3, constellations: 4 };

const LAYER_Z: readonly number[] = [-0.75, 0, 0.75];
/** Far plane holds most agents: they are smaller on screen, so the picture stays even. */
const LAYER_SHARE = [0.45, 0.33, 0.22] as const;
/** Depth counts less than the screen plane when choosing neighbours: planes stay readable. */
const DEPTH_WEIGHT = 0.6;
/** An extra link is made only when it is at most this much longer than the nearest one. */
const EXTRA_LINK_REACH = 1.5;

export function buildNetwork(options: NetworkOptions): Network {
  const { seed, count, links = 3 } = options;
  const rand = mulberry32(seed);
  const hubCount = Math.max(3, Math.round(count / 60));

  const nodes: NetworkNode[] = [];
  for (let i = 0; i < count; i++) {
    const r = rand();
    const layer = r < LAYER_SHARE[0] ? 0 : r < LAYER_SHARE[0] + LAYER_SHARE[1] ? 1 : 2;
    nodes.push({
      x: rand() * 2 - 1,
      y: rand() * 2 - 1,
      z: (LAYER_Z[layer] ?? 0) + (rand() - 0.5) * 0.4,
      layer,
      weight: i < hubCount ? 1 : 0.06 + 0.94 * rand() ** 3,
      seed: rand(),
    });
  }

  const edges: [number, number][] = [];
  const adjacency: number[][] = nodes.map(() => []);
  const dist = (a: NetworkNode, b: NetworkNode): number =>
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z - b.z) * DEPTH_WEIGHT) ** 2;
  for (let i = 1; i < count; i++) {
    const node = nodes[i] as NetworkNode;
    const nearest: { j: number; d: number }[] = [];
    for (let j = 0; j < i; j++) {
      const d = dist(node, nodes[j] as NetworkNode);
      if (nearest.length < links || d < (nearest[nearest.length - 1]?.d ?? Infinity)) {
        nearest.push({ j, d });
        nearest.sort((p, q) => p.d - q.d);
        if (nearest.length > links) nearest.pop();
      }
    }
    const reach = (nearest[0]?.d ?? 0) * EXTRA_LINK_REACH ** 2;
    nearest.forEach(({ j, d }, k) => {
      if (k > 0 && d > reach) return;
      edges.push([j, i]);
      adjacency[i]?.push(j);
      adjacency[j]?.push(i);
    });
  }

  const hubs = Array.from({ length: Math.min(hubCount, count) }, (_, i) => i);
  return {
    nodes,
    edges,
    adjacency,
    hubs,
    groups: {
      clusters: kMeans(nodes, GROUP_COUNT.clusters),
      constellations: kMeans(nodes, GROUP_COUNT.constellations),
    },
  };
}

/** Number of leading edges whose both ends are among the first `n` nodes. */
export function edgesWithin(net: Network, n: number): number {
  const index = net.edges.findIndex(([a, b]) => Math.max(a, b) >= n);
  return index === -1 ? net.edges.length : index;
}

export function groupOf(net: Network, kind: GroupKind, node: number): number {
  return net.groups[kind][node] ?? 0;
}

/** Whether the first `n` nodes form one connected network. */
export function isConnected(net: Network, n: number): boolean {
  if (n <= 1) return true;
  const seen = new Uint8Array(n);
  const queue = [0];
  seen[0] = 1;
  let reached = 1;
  for (let q = 0; q < queue.length; q++) {
    for (const m of net.adjacency[queue[q] ?? 0] ?? []) {
      if (m < n && !seen[m]) {
        seen[m] = 1;
        reached++;
        queue.push(m);
      }
    }
  }
  return reached === n;
}

/** Deterministic k-means on the screen plane, seeded by farthest-point picks from node 0. */
function kMeans(nodes: readonly NetworkNode[], k: number): number[] {
  const centres: { x: number; y: number }[] = [];
  const first = nodes[0];
  if (!first) return [];
  centres.push({ x: first.x, y: first.y });
  while (centres.length < k) {
    let best = first;
    let bestD = -1;
    for (const n of nodes) {
      const d = Math.min(...centres.map((c) => (c.x - n.x) ** 2 + (c.y - n.y) ** 2));
      if (d > bestD) {
        bestD = d;
        best = n;
      }
    }
    centres.push({ x: best.x, y: best.y });
  }
  const assign = nodes.map(() => 0);
  for (let iter = 0; iter < 12; iter++) {
    nodes.forEach((n, i) => {
      let bestD = Infinity;
      centres.forEach((c, g) => {
        const d = (c.x - n.x) ** 2 + (c.y - n.y) ** 2;
        if (d < bestD) {
          bestD = d;
          assign[i] = g;
        }
      });
    });
    centres.forEach((c, g) => {
      let sx = 0;
      let sy = 0;
      let m = 0;
      nodes.forEach((n, i) => {
        if (assign[i] !== g) return;
        sx += n.x;
        sy += n.y;
        m++;
      });
      if (m > 0) {
        c.x = sx / m;
        c.y = sy / m;
      }
    });
  }
  return assign;
}

/**
 * Deterministic "Relay" graph (docs/concept.md): agent nodes scattered over a plane and linked
 * to their nearest neighbours, plus a few pulses in flight along the edges. Used for the static
 * still (brand page, no-WebGL / reduced-motion fallback) and as the seed layout of the 3D scene.
 */

export interface RelayNode {
  readonly x: number;
  readonly y: number;
  /** 0–1, how "busy" the agent is: drives size and brightness. */
  readonly weight: number;
}

export interface RelayEdge {
  readonly a: number;
  readonly b: number;
}

export interface RelayPulse {
  readonly edge: number;
  /** Position along the edge, 0 = node a, 1 = node b. */
  readonly t: number;
  /** A task travelling out (warm accent) or a result coming back (cool accent). */
  readonly kind: 'task' | 'result';
}

export interface RelayGraph {
  readonly nodes: readonly RelayNode[];
  readonly edges: readonly RelayEdge[];
  readonly pulses: readonly RelayPulse[];
}

export interface RelayOptions {
  readonly seed: number;
  readonly count: number;
  readonly width: number;
  readonly height: number;
  /** Links per node to its nearest neighbours. */
  readonly links?: number;
  readonly pulses?: number;
}

/** mulberry32: small, fast, good enough for layout. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function relayGraph(options: RelayOptions): RelayGraph {
  const { seed, count, width, height, links = 2, pulses = 6 } = options;
  const rand = mulberry32(seed);

  // Jittered grid: even coverage without the regularity of a lattice.
  const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const nodes: RelayNode[] = [];
  for (let i = 0; i < count; i++) {
    const cx = ((i % cols) + 0.5) / cols;
    const cy = (Math.floor(i / cols) + 0.5) / rows;
    nodes.push({
      x: (cx + (rand() - 0.5) * (0.8 / cols)) * width,
      y: (cy + (rand() - 0.5) * (0.8 / rows)) * height,
      weight: rand() ** 2,
    });
  }

  const seen = new Set<string>();
  const edges: RelayEdge[] = [];
  nodes.forEach((n, a) => {
    const nearest = nodes
      .map((m, b) => ({ b, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
      .filter(({ b }) => b !== a)
      .sort((p, q) => p.d - q.d)
      .slice(0, links);
    for (const { b } of nearest) {
      const key = a < b ? `${String(a)}-${String(b)}` : `${String(b)}-${String(a)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b });
    }
  });

  const inFlight: RelayPulse[] = [];
  for (let i = 0; i < Math.min(pulses, edges.length); i++) {
    inFlight.push({
      edge: Math.floor(rand() * edges.length),
      t: 0.15 + rand() * 0.7,
      kind: i % 3 === 2 ? 'result' : 'task',
    });
  }
  return { nodes, edges, pulses: inFlight };
}

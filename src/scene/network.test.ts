import { describe, expect, it } from 'vitest';
import { buildNetwork, edgesWithin, groupOf, isConnected } from './network.ts';

const options = { seed: 2026, count: 300 };

describe('buildNetwork', () => {
  it('is the same network for the same seed and a different one for another seed', () => {
    expect(buildNetwork(options)).toEqual(buildNetwork(options));
    expect(buildNetwork({ ...options, seed: 2027 }).nodes).not.toEqual(buildNetwork(options).nodes);
  });

  it('keeps every node inside the unit volume on one of three depth planes', () => {
    const net = buildNetwork(options);
    expect(net.nodes).toHaveLength(300);
    for (const n of net.nodes) {
      expect(Math.abs(n.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(n.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(n.z)).toBeLessThanOrEqual(1);
      expect([0, 1, 2]).toContain(n.layer);
    }
    const layers = new Set(net.nodes.map((n) => n.layer));
    expect(layers.size).toBe(3);
  });

  it('is sparse: a fixed topology with a few links per agent, not a distance plexus', () => {
    const net = buildNetwork(options);
    const degree = (2 * net.edges.length) / net.nodes.length;
    expect(degree).toBeGreaterThanOrEqual(2);
    expect(degree).toBeLessThanOrEqual(6);
    for (const [a, b] of net.edges) expect(a).not.toBe(b);
    const keys = net.edges.map(([a, b]) => `${String(Math.min(a, b))}-${String(Math.max(a, b))}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('builds adjacency that mirrors the edge list', () => {
    const net = buildNetwork(options);
    net.edges.forEach(([a, b]) => {
      expect(net.adjacency[a]).toContain(b);
      expect(net.adjacency[b]).toContain(a);
    });
    const listed = net.adjacency.reduce((sum, list) => sum + list.length, 0);
    expect(listed).toBe(2 * net.edges.length);
  });

  it('marks a few hubs: the busiest agents, at full weight', () => {
    const net = buildNetwork(options);
    expect(net.hubs.length).toBeGreaterThanOrEqual(3);
    expect(net.hubs.length).toBeLessThanOrEqual(net.nodes.length / 20);
    for (const h of net.hubs) expect(net.nodes[h]?.weight).toBe(1);
    for (const n of net.nodes) {
      expect(n.weight).toBeGreaterThan(0);
      expect(n.weight).toBeLessThanOrEqual(1);
      expect(n.seed).toBeGreaterThanOrEqual(0);
      expect(n.seed).toBeLessThan(1);
    }
  });
});

describe('quality subsets (first n nodes)', () => {
  it('orders edges so that the first n nodes own a prefix of the edge list', () => {
    const net = buildNetwork(options);
    for (const n of [1, 2, 50, 120, 300]) {
      const count = edgesWithin(net, n);
      const inside = net.edges.filter(([a, b]) => a < n && b < n).length;
      expect(count, `n=${String(n)}`).toBe(inside);
      expect(net.edges.slice(0, count).every(([a, b]) => a < n && b < n)).toBe(true);
    }
  });

  it('stays one connected network at every subset size', () => {
    const net = buildNetwork(options);
    for (const n of [10, 60, 150, 300]) expect(isConnected(net, n), `n=${String(n)}`).toBe(true);
  });
});

describe('isConnected', () => {
  it('sees a split graph', () => {
    const split = {
      nodes: [0, 1, 2, 3].map(() => ({ x: 0, y: 0, z: 0, layer: 0, weight: 1, seed: 0 })),
      edges: [
        [0, 1],
        [2, 3],
      ] as [number, number][],
      adjacency: [[1], [0], [3], [2]],
      hubs: [],
      groups: { clusters: [0, 0, 1, 1], constellations: [0, 0, 1, 1] },
    };
    expect(isConnected(split, 4)).toBe(false);
    expect(isConnected(split, 2)).toBe(true);
  });
});

describe('groups', () => {
  it('splits the agents into 3 service clusters and 4 project constellations, none empty', () => {
    const net = buildNetwork(options);
    for (const [kind, k] of [
      ['clusters', 3],
      ['constellations', 4],
    ] as const) {
      const sizes = Array.from({ length: k }, (_, g) =>
        net.nodes.reduce((sum, _n, i) => sum + (groupOf(net, kind, i) === g ? 1 : 0), 0),
      );
      expect(sizes.reduce((s, v) => s + v, 0)).toBe(300);
      for (const size of sizes) expect(size).toBeGreaterThan(300 / k / 3);
    }
  });

  it('groups by neighbourhood, so most links stay inside a group', () => {
    const net = buildNetwork(options);
    const inside = net.edges.filter(
      ([a, b]) => groupOf(net, 'clusters', a) === groupOf(net, 'clusters', b),
    ).length;
    expect(inside / net.edges.length).toBeGreaterThan(0.75);
  });

  it('keeps every group present in a small quality subset', () => {
    const net = buildNetwork(options);
    const seen = new Set(Array.from({ length: 60 }, (_, i) => groupOf(net, 'constellations', i)));
    expect(seen.size).toBe(4);
  });
});

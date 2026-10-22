import { describe, expect, it } from 'vitest';
import { mulberry32, relayGraph } from './relay-graph.ts';

const options = { seed: 7, count: 40, width: 800, height: 500 };

describe('mulberry32', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    const values = Array.from({ length: 100 }, () => a());
    expect(values).toEqual(Array.from({ length: 100 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});

describe('relayGraph', () => {
  it('is the same graph for the same seed', () => {
    expect(relayGraph(options)).toEqual(relayGraph(options));
    expect(relayGraph({ ...options, seed: 8 })).not.toEqual(relayGraph(options));
  });

  it('keeps every node inside the frame and linked to the network', () => {
    const graph = relayGraph(options);
    expect(graph.nodes).toHaveLength(40);
    for (const n of graph.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(800);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(500);
    }
    const linked = new Set(graph.edges.flatMap((e) => [e.a, e.b]));
    expect(linked.size).toBe(40);
  });

  it('never repeats an edge or links a node to itself', () => {
    const { edges } = relayGraph(options);
    const keys = edges.map((e) => [Math.min(e.a, e.b), Math.max(e.a, e.b)].join('-'));
    expect(new Set(keys).size).toBe(keys.length);
    expect(edges.every((e) => e.a !== e.b)).toBe(true);
  });

  it('puts pulses on existing edges, mostly tasks, some results', () => {
    const { edges, pulses } = relayGraph({ ...options, pulses: 6 });
    expect(pulses).toHaveLength(6);
    expect(pulses.every((p) => p.edge < edges.length && p.t > 0 && p.t < 1)).toBe(true);
    expect(pulses.filter((p) => p.kind === 'result')).toHaveLength(2);
  });
});

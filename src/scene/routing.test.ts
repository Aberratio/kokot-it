import { describe, expect, it } from 'vitest';
import { PROJECT_SLUGS } from '../content/types.ts';
import { CONVERGE_NODE } from './layouts.ts';
import { buildNetwork, groupOf, type Network } from './network.ts';
import { LEVELS } from './quality.ts';
import { mulberry32, SCENE_SEED } from './relay-graph.ts';
import { Pacer, planRoute, Relay, shortestPath } from './routing.ts';

/** 0 — 1 — 2 — 3, plus a long way round 0 — 4 — 5 — 6 — 3. */
function lineNet(): Network {
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [4, 5],
    [5, 6],
    [6, 3],
  ];
  const adjacency: number[][] = Array.from({ length: 7 }, () => []);
  for (const [a, b] of edges) {
    adjacency[a]?.push(b);
    adjacency[b]?.push(a);
  }
  return {
    nodes: adjacency.map(() => ({ x: 0, y: 0, z: 0, layer: 0, weight: 1, seed: 0 })),
    edges,
    adjacency,
    hubs: [0],
    groups: { clusters: [0, 0, 0, 0, 1, 1, 1], constellations: [0, 0, 0, 0, 0, 0, 0] },
  };
}

describe('shortestPath', () => {
  const net = lineNet();

  it('finds the fewest hops', () => {
    expect(shortestPath(net.adjacency, 0, 3)).toEqual([0, 1, 2, 3]);
    expect(shortestPath(net.adjacency, 3, 0)).toEqual([3, 2, 1, 0]);
  });

  it('only walks through allowed agents', () => {
    expect(shortestPath(net.adjacency, 0, 3, (n) => n !== 1)).toEqual([0, 4, 5, 6, 3]);
    expect(shortestPath(net.adjacency, 0, 3, (n) => n !== 1 && n !== 5)).toBeNull();
  });

  it('has nothing to route from an agent to itself', () => {
    expect(shortestPath(net.adjacency, 2, 2)).toBeNull();
  });
});

describe('Relay', () => {
  const timeline = (relay: Relay, seconds: number, dt = 1 / 60) => {
    const frames: { kind: string; a: number; b: number; t: number }[][] = [];
    for (let t = 0; t < seconds; t += dt) {
      relay.step(dt);
      frames.push(relay.pulses.map((p) => ({ ...p })));
    }
    return frames;
  };

  it('sends the task out hop by hop, then brings the result back the same way', () => {
    const relay = new Relay(lineNet(), { maxJobs: 4 });
    expect(relay.dispatch([0, 1, 2, 3])).toBe(true);
    const frames = timeline(relay, 10);
    const hops = frames
      .flat()
      .map((p) => `${p.kind}:${String(p.a)}>${String(p.b)}`)
      .filter((hop, i, all) => all[i - 1] !== hop);
    expect(hops).toEqual([
      'task:0>1',
      'task:1>2',
      'task:2>3',
      'result:3>2',
      'result:2>1',
      'result:1>0',
    ]);
    expect(relay.pulses).toHaveLength(0);
  });

  it('carries results slower than tasks', () => {
    const relay = new Relay(lineNet(), { maxJobs: 4 });
    relay.dispatch([0, 1]);
    const frames = timeline(relay, 6);
    const count = (kind: string) => frames.filter((f) => f.some((p) => p.kind === kind)).length;
    expect(count('result')).toBeGreaterThan(count('task'));
  });

  it('moves each pulse forward along its edge', () => {
    const relay = new Relay(lineNet(), { maxJobs: 4 });
    relay.dispatch([0, 1]);
    const ts = timeline(relay, 0.4).map((f) => f[0]?.t ?? NaN);
    for (let i = 1; i < ts.length; i++) expect(ts[i]).toBeGreaterThan(ts[i - 1] ?? 0);
    expect(Math.max(...ts)).toBeLessThanOrEqual(1);
  });

  it('lights the agent a pulse reaches and the edge it used, then lets both fade', () => {
    const net = lineNet();
    const relay = new Relay(net, { maxJobs: 4 });
    relay.dispatch([0, 1]);
    timeline(relay, 0.7);
    expect(relay.nodeHeat[1]).toBeGreaterThan(0.5);
    expect(relay.edgeHeat[0]).toBeGreaterThan(0.5); // edge 0 = 0–1, task channel
    expect(relay.edgeHeat[1]).toBe(0); // its result channel, not used yet
    expect(relay.nodeHeat[3]).toBe(0);
    timeline(relay, 12);
    expect(relay.nodeHeat[1]).toBeLessThan(0.01);
    expect(relay.edgeHeat[0]).toBeLessThan(0.01);
    for (const v of [...relay.nodeHeat, ...relay.edgeHeat]) expect(v).toBeLessThanOrEqual(1);
  });

  it('keeps to its job pool and refuses empty routes', () => {
    const relay = new Relay(lineNet(), { maxJobs: 2 });
    expect(relay.dispatch([0, 1])).toBe(true);
    expect(relay.dispatch([1, 2])).toBe(true);
    expect(relay.dispatch([2, 3])).toBe(false);
    expect(relay.dispatch([3])).toBe(false);
  });

  it('can be cleared when the network shrinks', () => {
    const relay = new Relay(lineNet(), { maxJobs: 2 });
    relay.dispatch([0, 1, 2]);
    relay.step(0.1);
    relay.clear();
    expect(relay.pulses).toHaveLength(0);
    expect(relay.dispatch([0, 1])).toBe(true);
  });
});

describe('Pacer', () => {
  it('starts jobs at the asked rate on average', () => {
    const pacer = new Pacer(mulberry32(1));
    let jobs = 0;
    for (let t = 0; t < 200; t += 1 / 60) jobs += pacer.tick(1 / 60, 0.8);
    expect(jobs / 200).toBeGreaterThan(0.8 * 0.8);
    expect(jobs / 200).toBeLessThan(0.8 * 1.2);
  });

  it('starts nothing at rate 0 (reduced motion)', () => {
    const pacer = new Pacer(mulberry32(1));
    let jobs = 0;
    for (let t = 0; t < 60; t += 1 / 60) jobs += pacer.tick(1 / 60, 0);
    expect(jobs).toBe(0);
  });
});

describe('planRoute', () => {
  const net = buildNetwork({ seed: 2026, count: 300 });

  it('free: routes from a hub to another agent of the active subset', () => {
    const rand = mulberry32(3);
    for (let i = 0; i < 40; i++) {
      const route = planRoute('free', net, { limit: 120, rand });
      expect(route).not.toBeNull();
      expect(net.hubs).toContain(route?.[0]);
      expect(route?.every((n) => n < 120)).toBe(true);
      expect(route?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('clusters / constellations: stays inside the focused group', () => {
    const rand = mulberry32(4);
    for (const mode of ['clusters', 'constellations'] as const) {
      let planned = 0;
      for (let i = 0; i < 40; i++) {
        const route = planRoute(mode, net, { limit: 300, rand, focus: 1 });
        if (!route) continue;
        planned++;
        expect(route.every((n) => groupOf(net, mode, n) === 1)).toBe(true);
      }
      expect(planned).toBeGreaterThan(30);
    }
  });

  it('constellations: every project card lights its own group at every quality', () => {
    // app.ts turns the n-th project card into focus group n; a group with no agents sends nothing.
    for (const built of LEVELS) {
      const scene = buildNetwork({ seed: SCENE_SEED, count: built.nodes });
      for (const shown of LEVELS.filter((l) => l.nodes <= built.nodes)) {
        const rand = mulberry32(7);
        PROJECT_SLUGS.forEach((slug, card) => {
          const routes = Array.from({ length: 20 }, () =>
            planRoute('constellations', scene, { limit: shown.nodes, rand, focus: card }),
          ).filter((route) => route !== null);
          const at = `${slug} at ${String(shown.nodes)} of ${String(built.nodes)} agents`;
          expect(routes.length, at).toBeGreaterThan(15);
        });
      }
    }
  });

  it('converge: every route starts at the contact node', () => {
    const rand = mulberry32(5);
    for (let i = 0; i < 20; i++) {
      expect(planRoute('converge', net, { limit: 300, rand })?.[0]).toBe(CONVERGE_NODE);
    }
  });

  it('from: an order placed at a given agent goes out from it', () => {
    const rand = mulberry32(6);
    const route = planRoute('free', net, { limit: 300, rand, from: 42 });
    expect(route?.[0]).toBe(42);
    expect(route?.length).toBeGreaterThanOrEqual(3);
  });
});

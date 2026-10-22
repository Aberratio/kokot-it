/**
 * Work moving through the Relay network: every pulse has a cause and a direction
 * (docs/concept.md, "motion has a direction and a cause"). A job is a route from the agent that asks
 * to the agent that does the work; the task travels out hop by hop (warm), the agent works for
 * a moment, and the result travels back the same way (cool, slower).
 *
 * Pure CPU logic, no three.js: the renderer only reads `pulses`, `nodeHeat` and `edgeHeat`.
 */
import { CONVERGE_NODE, type SceneMode } from './layouts.ts';
import type { Network } from './network.ts';

export type PulseKind = 'task' | 'result';

export interface Pulse {
  /** The pulse travels from node `a` to node `b`. */
  readonly a: number;
  readonly b: number;
  readonly edge: number;
  /** Position along the hop, 0 at `a`, 1 at `b`. */
  readonly t: number;
  readonly kind: PulseKind;
}

export interface RelayOptions {
  readonly maxJobs: number;
  /** Seconds per hop. */
  readonly taskHop?: number;
  readonly resultHop?: number;
  /** Seconds the target agent works before the result leaves. */
  readonly workTime?: number;
  /** Time constant of the glow left on agents and edges, in seconds. */
  readonly heatDecay?: number;
  /** Easing of a pulse along one hop (the brand's `--ease-signal`). */
  readonly ease?: (t: number) => number;
}

interface Job {
  readonly path: readonly number[];
  phase: 'out' | 'work' | 'back';
  hop: number;
  clock: number;
}

/** Fewest-hops route between two agents through allowed agents, or null. */
export function shortestPath(
  adjacency: readonly (readonly number[])[],
  from: number,
  to: number,
  allowed: (node: number) => boolean = () => true,
): number[] | null {
  if (from === to || !allowed(from) || !allowed(to)) return null;
  const previous = new Map<number, number>([[from, -1]]);
  const queue = [from];
  for (let q = 0; q < queue.length; q++) {
    const node = queue[q] ?? 0;
    for (const next of adjacency[node] ?? []) {
      if (previous.has(next) || !allowed(next)) continue;
      previous.set(next, node);
      if (next === to) {
        const path = [to];
        for (let at = node; at !== -1; at = previous.get(at) ?? -1) path.push(at);
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}

export class Relay {
  readonly nodeHeat: Float32Array;
  /** Two channels per edge: [task, result]. */
  readonly edgeHeat: Float32Array;
  pulses: Pulse[] = [];
  /** Jobs in flight at once; lowered with the quality level. */
  maxJobs: number;

  private jobs: Job[] = [];
  private readonly edgeIndex = new Map<number, number>();
  private readonly n: number;
  private readonly taskHop: number;
  private readonly resultHop: number;
  private readonly workTime: number;
  private readonly heatDecay: number;
  private readonly ease: (t: number) => number;

  constructor(net: Network, options: RelayOptions) {
    this.n = net.nodes.length;
    this.nodeHeat = new Float32Array(this.n);
    this.edgeHeat = new Float32Array(net.edges.length * 2);
    net.edges.forEach(([a, b], e) => {
      this.edgeIndex.set(a * this.n + b, e);
      this.edgeIndex.set(b * this.n + a, e);
    });
    this.maxJobs = options.maxJobs;
    this.taskHop = options.taskHop ?? 0.5;
    this.resultHop = options.resultHop ?? 0.8;
    this.workTime = options.workTime ?? 0.45;
    this.heatDecay = options.heatDecay ?? 1.1;
    this.ease = options.ease ?? ((t) => t);
  }

  get activeJobs(): number {
    return this.jobs.length;
  }

  /** Starts a job along `path` (requester first). False when the pool is full or the path is empty. */
  dispatch(path: readonly number[]): boolean {
    if (path.length < 2 || this.jobs.length >= this.maxJobs) return false;
    for (let i = 1; i < path.length; i++) {
      if (!this.edgeIndex.has((path[i - 1] ?? 0) * this.n + (path[i] ?? 0))) return false;
    }
    this.jobs.push({ path, phase: 'out', hop: 0, clock: 0 });
    this.nodeHeat[path[0] ?? 0] = 1;
    return true;
  }

  /** Drops every job in flight (the heat fades on its own). */
  clear(): void {
    this.jobs = [];
    this.pulses = [];
  }

  step(dt: number): void {
    const fade = Math.exp(-dt / this.heatDecay);
    for (let i = 0; i < this.nodeHeat.length; i++)
      this.nodeHeat[i] = (this.nodeHeat[i] ?? 0) * fade;
    for (let i = 0; i < this.edgeHeat.length; i++)
      this.edgeHeat[i] = (this.edgeHeat[i] ?? 0) * fade;

    const pulses: Pulse[] = [];
    this.jobs = this.jobs.filter((job) => {
      job.clock += dt;
      for (;;) {
        if (job.phase === 'work') {
          if (job.clock < this.workTime) return true;
          job.clock -= this.workTime;
          job.phase = 'back';
          job.hop = 0;
          continue;
        }
        const duration = job.phase === 'out' ? this.taskHop : this.resultHop;
        const hops = job.path.length - 1;
        const [a, b] = this.hopEnds(job);
        const edge = this.edgeIndex.get(a * this.n + b) ?? 0;
        if (job.clock < duration) {
          const kind: PulseKind = job.phase === 'out' ? 'task' : 'result';
          pulses.push({ a, b, edge, t: this.ease(job.clock / duration), kind });
          return true;
        }
        // Arrived: the agent and the channel it came through light up.
        job.clock -= duration;
        this.nodeHeat[b] = 1;
        this.edgeHeat[edge * 2 + (job.phase === 'out' ? 0 : 1)] = 1;
        job.hop++;
        if (job.hop < hops) continue;
        if (job.phase === 'back') return false;
        job.phase = 'work';
      }
    });
    this.pulses = pulses;
  }

  private hopEnds(job: Job): [number, number] {
    const { path, hop } = job;
    if (job.phase === 'out') return [path[hop] ?? 0, path[hop + 1] ?? 0];
    const last = path.length - 1;
    return [path[last - hop] ?? 0, path[last - hop - 1] ?? 0];
  }
}

/** Poisson pacing of autonomous jobs: `tick` returns how many start in this frame. */
export class Pacer {
  private wait: number;
  private readonly rand: () => number;

  constructor(rand: () => number) {
    this.rand = rand;
    this.wait = this.draw();
  }

  tick(dt: number, rate: number): number {
    if (rate <= 0) return 0;
    this.wait -= dt * rate;
    let started = 0;
    while (this.wait <= 0) {
      started++;
      this.wait += this.draw();
    }
    return started;
  }

  private draw(): number {
    return -Math.log(1 - this.rand());
  }
}

export interface RouteContext {
  /** Only agents `[0, limit)` are drawn at the current quality level. */
  readonly limit: number;
  readonly rand: () => number;
  /** Group the route stays in (clusters / constellations); random when absent. */
  readonly focus?: number | undefined;
  /** Requester: the agent the visitor's order arrived at. */
  readonly from?: number | undefined;
}

const SHORT_ROUTE = 3;
const LONG_ROUTE = 6;

/** Picks a requester and a worker for the current section and routes between them. */
export function planRoute(mode: SceneMode, net: Network, ctx: RouteContext): number[] | null {
  const { limit, rand } = ctx;
  const pick = <T>(items: readonly T[]): T | undefined => items[Math.floor(rand() * items.length)];
  const kind = mode === 'clusters' || mode === 'constellations' ? mode : null;
  const groupCount = kind ? Math.max(...net.groups[kind]) + 1 : 0;
  const group = kind ? (ctx.focus ?? Math.floor(rand() * groupCount)) : -1;
  const allowed = (n: number): boolean =>
    n < limit && (kind === null || net.groups[kind][n] === group);
  const members = net.nodes.map((_, i) => i).filter(allowed);
  if (members.length < 2) return null;

  let from = ctx.from;
  if (from === undefined) {
    if (mode === 'converge') from = CONVERGE_NODE;
    else if (kind) {
      // The busiest of a few candidates: work in a group starts at its lead agent.
      const candidates = Array.from({ length: 5 }, () => pick(members) ?? 0);
      from = candidates.reduce((best, n) =>
        (net.nodes[n]?.weight ?? 0) > (net.nodes[best]?.weight ?? 0) ? n : best,
      );
    } else from = pick(net.hubs.filter((h) => h < limit)) ?? 0;
  }

  let fallback: number[] | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const path = shortestPath(net.adjacency, from, pick(members) ?? from, allowed);
    if (!path) continue;
    if (path.length >= SHORT_ROUTE && path.length <= LONG_ROUTE) return path;
    if (
      !fallback ||
      Math.abs(path.length - SHORT_ROUTE) < Math.abs(fallback.length - SHORT_ROUTE)
    ) {
      fallback = path;
    }
  }
  return fallback;
}

/**
 * How the page talks to the scene: which mode to run, where the pointer is in the world, when
 * a resting pointer becomes an order (docs/concept.md: "the cursor is a client, not a magnet"),
 * and which network state each section of the page asks for. Pure functions only; the DOM
 * wiring lives in app.ts and boot.ts.
 */
import type { Frame, SceneMode } from './layouts.ts';

export type RenderMode = 'webgl' | 'reduced' | 'fallback';

export function chooseMode(env: { webgl: boolean; reducedMotion: boolean }): RenderMode {
  if (!env.webgl) return 'fallback';
  return env.reducedMotion ? 'reduced' : 'webgl';
}

/** CSS pixel in the viewport → world (x, y) on the z = 0 plane. */
export function screenToWorld(
  x: number,
  y: number,
  width: number,
  height: number,
  frame: Frame,
): [number, number] {
  return [
    (x / width) * 2 * frame.halfWidth - frame.halfWidth,
    frame.halfHeight - (y / height) * 2 * frame.halfHeight,
  ];
}

/** Index of the agent nearest to (x, y) among the first `count` projected points, or -1. */
export function nearestNode(
  screen: Float32Array,
  count: number,
  x: number,
  y: number,
  reach: number,
): number {
  let best = -1;
  let bestD = reach * reach;
  for (let i = 0; i < count; i++) {
    const d = ((screen[i * 2] ?? Infinity) - x) ** 2 + ((screen[i * 2 + 1] ?? Infinity) - y) ** 2;
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** A pointer that rests for `restMs` (or a tap) places one order at that spot. */
export class DwellDetector {
  private anchor: Point | null = null;
  private since = 0;
  private fired = true;

  private readonly restMs: number;
  private readonly tremorPx: number;

  constructor(restMs = 300, tremorPx = 6) {
    this.restMs = restMs;
    this.tremorPx = tremorPx;
  }

  move(x: number, y: number, now: number): void {
    if (this.anchor && Math.hypot(x - this.anchor.x, y - this.anchor.y) <= this.tremorPx) return;
    this.anchor = { x, y };
    this.since = now;
    this.fired = false;
  }

  tap(x: number, y: number): void {
    this.anchor = { x, y };
    this.since = -Infinity;
    this.fired = false;
  }

  leave(): void {
    this.anchor = null;
    this.fired = true;
  }

  /** The order, once, when the pointer has rested long enough. */
  poll(now: number): Point | null {
    if (this.fired || !this.anchor || now - this.since < this.restMs) return null;
    this.fired = true;
    return this.anchor;
  }
}

/** Exponential smoothing toward `target` that does not depend on the frame rate. */
export function follow(current: number, target: number, dt: number, rate: number): number {
  return target + (current - target) * Math.exp(-dt * rate);
}

export interface SectionFeatures {
  readonly hero?: boolean;
  /** Holds the service offers (P1–P3). */
  readonly offers?: boolean;
  /** Holds the project cards. */
  readonly cards?: boolean;
  readonly contact?: boolean;
}

/** The network state a section asks for, or null when it has none of its own. */
export function sectionMode(f: SectionFeatures): SceneMode | null {
  if (f.hero) return 'free';
  if (f.contact) return 'converge';
  if (f.cards) return 'constellations';
  if (f.offers) return 'clusters';
  return null;
}

/** Sections without a state of their own keep the state of the section above. */
export function resolveSectionModes(modes: readonly (SceneMode | null)[]): SceneMode[] {
  let last: SceneMode = 'free';
  return modes.map((m) => (last = m ?? last));
}

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const HUB_GAP = 36;

/** Where the contact node stands: right of the e-mail address, or above it on narrow screens. */
export function hubScreenPoint(rect: Rect, viewportWidth: number): Point {
  const right = rect.left + rect.width + HUB_GAP;
  // The node needs its glow's worth of room before the screen edge.
  if (right <= viewportWidth - 2 * HUB_GAP) return { x: right, y: rect.top + rect.height / 2 };
  return { x: rect.left + rect.width / 2, y: rect.top - HUB_GAP };
}

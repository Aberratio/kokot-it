/**
 * Adaptive quality (docs/concept.md, "Performance"): start from a level guessed from the device,
 * then measure the mean frame time; over 20 ms for 2 s steps one level down. Levels never go
 * back up during a session (no pumping between levels), and if the lowest level still misses
 * the budget the scene gives way to the static still.
 */

export interface QualityLevel {
  /** Agents drawn: the first n nodes of the network (each prefix is a connected network). */
  readonly nodes: number;
  /** Highest device pixel ratio rendered. */
  readonly dpr: number;
  /** Jobs in flight at once. */
  readonly maxJobs: number;
  /** Size of the glow around agents and pulses (fill rate). */
  readonly glow: number;
}

export const LEVELS: readonly QualityLevel[] = [
  { nodes: 760, dpr: 2, maxJobs: 12, glow: 1 },
  { nodes: 580, dpr: 1.75, maxJobs: 10, glow: 1 },
  { nodes: 440, dpr: 1.5, maxJobs: 8, glow: 0.85 },
  { nodes: 320, dpr: 1.25, maxJobs: 6, glow: 0.7 },
  { nodes: 220, dpr: 1, maxJobs: 5, glow: 0.6 },
];

export interface Device {
  /** Viewport width in CSS pixels. */
  readonly width: number;
  /** `navigator.hardwareConcurrency`. */
  readonly cores: number;
  /** `navigator.deviceMemory` (Chromium only), in GB. */
  readonly memoryGb?: number | undefined;
  /** `(pointer: coarse)`: phones and tablets. */
  readonly coarsePointer: boolean;
}

const PHONE_LEVEL = 2;
const PHONE_WIDTH = 768;

export function initialLevel(device: Device): number {
  let level = device.coarsePointer || device.width < PHONE_WIDTH ? PHONE_LEVEL : 0;
  if (device.cores <= 4) level++;
  if (device.memoryGb !== undefined && device.memoryGb <= 4) level++;
  return Math.min(level, LEVELS.length - 1);
}

export function pixelRatio(level: QualityLevel | undefined, devicePixelRatio: number): number {
  return Math.min(level?.dpr ?? 1, devicePixelRatio);
}

export type QualityAction = 'keep' | 'downgrade' | 'fallback';

export interface MonitorOptions {
  readonly budgetMs?: number;
  readonly windowMs?: number;
  /** Ignored at the start and after every pause: shader compilation, first uploads. */
  readonly warmupMs?: number;
  /** Frames longer than this are stalls (hidden tab, debugger), not render cost. */
  readonly stallMs?: number;
}

export class FrameMonitor {
  private warm = 0;
  private done = false;
  private total = 0;
  private frames = 0;
  private readonly budgetMs: number;
  private readonly windowMs: number;
  private readonly warmupMs: number;
  private readonly stallMs: number;

  /** Current level index into LEVELS. */
  level: number;

  constructor(level: number, options: MonitorOptions = {}) {
    this.level = level;
    this.budgetMs = options.budgetMs ?? 20;
    this.windowMs = options.windowMs ?? 2000;
    this.warmupMs = options.warmupMs ?? 1000;
    this.stallMs = options.stallMs ?? 250;
  }

  /** Feeds one frame interval; returns what the scene should do about it. */
  sample(dtMs: number): QualityAction {
    if (this.done || dtMs > this.stallMs) return 'keep';
    if (this.warm < this.warmupMs) {
      this.warm += dtMs;
      return 'keep';
    }
    this.total += dtMs;
    this.frames++;
    if (this.total < this.windowMs) return 'keep';
    const mean = this.total / this.frames;
    this.reset();
    if (mean <= this.budgetMs) return 'keep';
    if (this.level >= LEVELS.length - 1) {
      this.done = true; // the scene gives way to the still: nothing left to measure
      return 'fallback';
    }
    this.level++;
    return 'downgrade';
  }

  /** Starts over with a warm-up: after a pause, or after a level change. */
  reset(): void {
    this.warm = 0;
    this.total = 0;
    this.frames = 0;
  }
}

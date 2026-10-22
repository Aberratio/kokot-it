import { describe, expect, it } from 'vitest';
import { FrameMonitor, initialLevel, LEVELS, pixelRatio } from './quality.ts';

describe('LEVELS', () => {
  it('only ever gets cheaper going down: fewer agents, lower DPR, fewer jobs, less glow', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      const [a, b] = [LEVELS[i - 1], LEVELS[i]];
      expect(b?.nodes).toBeLessThan(a?.nodes ?? 0);
      expect(b?.dpr).toBeLessThanOrEqual(a?.dpr ?? 0);
      expect(b?.maxJobs).toBeLessThanOrEqual(a?.maxJobs ?? 0);
      expect(b?.glow).toBeLessThanOrEqual(a?.glow ?? 0);
    }
  });

  // docs/concept.md budgets ~1–1.5k agents (desktop) and ~600 (phone) as a performance ceiling;
  // the sparse look ("silence as the base state") settles well below it (docs/decisions/relay-scene.md).
  it('stays inside the concept budget: at most ~1.5k agents, phones at most ~600 at DPR ≤ 1.5', () => {
    expect(LEVELS[0]?.nodes).toBeLessThanOrEqual(1500);
    const phone = LEVELS[initialLevel({ width: 390, cores: 8, coarsePointer: true })];
    expect(phone?.nodes).toBeGreaterThanOrEqual(300);
    expect(phone?.nodes).toBeLessThanOrEqual(640);
    expect(phone?.dpr).toBeLessThanOrEqual(1.5);
  });
});

describe('initialLevel', () => {
  it('gives a capable laptop the top level', () => {
    expect(initialLevel({ width: 1440, cores: 8, coarsePointer: false })).toBe(0);
  });

  it('starts phones and touch screens lower', () => {
    expect(initialLevel({ width: 390, cores: 8, coarsePointer: true })).toBe(2);
    expect(initialLevel({ width: 1024, cores: 8, coarsePointer: true })).toBe(2);
    expect(initialLevel({ width: 700, cores: 8, coarsePointer: false })).toBe(2);
  });

  it('steps down once for few cores and once for little memory, never past the lowest', () => {
    expect(initialLevel({ width: 1440, cores: 4, coarsePointer: false })).toBe(1);
    expect(initialLevel({ width: 1440, cores: 8, memoryGb: 4, coarsePointer: false })).toBe(1);
    expect(initialLevel({ width: 1440, cores: 2, memoryGb: 2, coarsePointer: false })).toBe(2);
    expect(initialLevel({ width: 390, cores: 2, memoryGb: 1, coarsePointer: true })).toBe(
      LEVELS.length - 1,
    );
  });
});

describe('pixelRatio', () => {
  it('never renders above the device or the level', () => {
    expect(pixelRatio(LEVELS[0], 3)).toBe(LEVELS[0]?.dpr);
    expect(pixelRatio(LEVELS[0], 1)).toBe(1);
    expect(pixelRatio(LEVELS[2], 2)).toBe(LEVELS[2]?.dpr);
  });
});

describe('FrameMonitor', () => {
  const run = (monitor: FrameMonitor, ms: number, frames: number) => {
    const actions: string[] = [];
    for (let i = 0; i < frames; i++) actions.push(monitor.sample(ms));
    return actions.filter((a) => a !== 'keep');
  };

  it('keeps the level while frames fit the 20 ms budget', () => {
    expect(run(new FrameMonitor(0), 16.7, 60 * 30)).toEqual([]);
    expect(run(new FrameMonitor(0), 19.5, 60 * 30)).toEqual([]);
  });

  it('downgrades one level after 2 s averaging above 20 ms, then measures the new level afresh', () => {
    const monitor = new FrameMonitor(0);
    // 1 s of warm-up (shader compile) is ignored, then a 2 s window: 3 s of 25 ms frames = 120.
    expect(run(monitor, 25, 119)).toEqual([]);
    expect(run(monitor, 25, 1)).toEqual(['downgrade']);
    expect(monitor.level).toBe(1);
    // The next decision needs a whole new window (plus warm-up): no cascade frame after frame.
    expect(run(monitor, 25, 100)).toEqual([]);
  });

  it('never upgrades during a session, however fast the frames get after a downgrade', () => {
    const monitor = new FrameMonitor(0);
    expect(run(monitor, 25, 120)).toEqual(['downgrade']);
    // A minute of 4 ms frames: an "upgrade" rule (any action, or the level going back to 0)
    // would show here.
    expect(run(monitor, 4, 60 * 250)).toEqual([]);
    expect(monitor.level).toBe(1);
  });

  it('falls back to the static still when even the lowest level is over budget', () => {
    const monitor = new FrameMonitor(LEVELS.length - 1);
    expect(run(monitor, 40, 60 * 4)).toEqual(['fallback']);
  });

  it('ignores single stalls (garbage collection, a paused debugger): they are not frame cost', () => {
    const monitor = new FrameMonitor(0);
    const actions: string[] = [];
    for (let k = 0; k < 10; k++) actions.push(...run(monitor, 16, 60), ...run(monitor, 900, 1));
    expect(actions).toEqual([]);
  });

  it('steps down on a device stuck below 4 fps: long frames in a row are cost, not stalls', () => {
    const monitor = new FrameMonitor(0);
    // 300 ms frames: two are taken for a stall, then they count; ~1 s warm-up + 2 s window.
    expect(run(monitor, 300, 20)).toEqual(['downgrade']);
    expect(monitor.level).toBe(1);
  });

  it('falls back to the still on a device stuck below 4 fps at the lowest level', () => {
    const monitor = new FrameMonitor(LEVELS.length - 1);
    expect(run(monitor, 300, 20)).toEqual(['fallback']);
  });

  it('warms up again after a pause', () => {
    const monitor = new FrameMonitor(0);
    run(monitor, 16, 200);
    monitor.reset();
    // 25 ms for 2.5 s right after resuming: 1 s warm-up + 1.5 s of window, no decision yet.
    expect(run(monitor, 25, 100)).toEqual([]);
  });
});

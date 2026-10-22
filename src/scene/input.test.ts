import { describe, expect, it } from 'vitest';
import {
  chooseMode,
  DwellDetector,
  follow,
  hubScreenPoint,
  nearestNode,
  resolveSectionModes,
  screenToWorld,
  sectionMode,
} from './input.ts';

describe('chooseMode', () => {
  it('runs the live scene when WebGL works and motion is welcome', () => {
    expect(chooseMode({ webgl: true, reducedMotion: false })).toBe('webgl');
  });

  it('holds one still WebGL frame under prefers-reduced-motion', () => {
    expect(chooseMode({ webgl: true, reducedMotion: true })).toBe('reduced');
  });

  it('draws the SVG still without WebGL, whatever the motion preference', () => {
    expect(chooseMode({ webgl: false, reducedMotion: false })).toBe('fallback');
    expect(chooseMode({ webgl: false, reducedMotion: true })).toBe('fallback');
  });
});

describe('screenToWorld', () => {
  const frame = { halfWidth: 8, halfHeight: 4.5, depth: 3 };

  it('maps the viewport onto the z = 0 plane, y up', () => {
    expect(screenToWorld(0, 0, 1600, 900, frame)).toEqual([-8, 4.5]);
    expect(screenToWorld(800, 450, 1600, 900, frame)).toEqual([0, 0]);
    expect(screenToWorld(1600, 900, 1600, 900, frame)).toEqual([8, -4.5]);
    expect(screenToWorld(1200, 225, 1600, 900, frame)).toEqual([4, 2.25]);
  });
});

describe('nearestNode', () => {
  // Projected agents in CSS pixels: (100, 100), (300, 120), (500, 500).
  const screen = new Float32Array([100, 100, 300, 120, 500, 500]);

  it('returns the agent closest to the pointer within reach', () => {
    expect(nearestNode(screen, 3, 290, 110, 80)).toBe(1);
    expect(nearestNode(screen, 3, 110, 90, 80)).toBe(0);
  });

  it('returns -1 when no agent is within reach', () => {
    expect(nearestNode(screen, 3, 900, 900, 80)).toBe(-1);
  });

  it('only considers the agents drawn at the current quality', () => {
    expect(nearestNode(screen, 2, 490, 490, 80)).toBe(-1);
  });
});

describe('DwellDetector (the cursor places an order when it stops)', () => {
  it('fires once when the pointer rests for 300 ms', () => {
    const dwell = new DwellDetector();
    dwell.move(100, 100, 0);
    expect(dwell.poll(299)).toBeNull();
    expect(dwell.poll(300)).toEqual({ x: 100, y: 100 });
    expect(dwell.poll(900)).toBeNull();
  });

  it('ignores hand tremor but restarts the clock on a real move', () => {
    const dwell = new DwellDetector();
    dwell.move(100, 100, 0);
    dwell.move(103, 102, 200); // within 6 px: still resting
    expect(dwell.poll(300)).toEqual({ x: 100, y: 100 });
    dwell.move(160, 100, 400);
    expect(dwell.poll(650)).toBeNull();
    expect(dwell.poll(700)).toEqual({ x: 160, y: 100 });
  });

  it('a tap is an order at once', () => {
    const dwell = new DwellDetector();
    dwell.tap(40, 50);
    expect(dwell.poll(0)).toEqual({ x: 40, y: 50 });
    expect(dwell.poll(1000)).toBeNull();
  });

  it('forgets the pointer when it leaves', () => {
    const dwell = new DwellDetector();
    dwell.move(10, 10, 0);
    dwell.leave();
    expect(dwell.poll(1000)).toBeNull();
  });
});

describe('follow (frame-rate independent smoothing)', () => {
  it('gives the same result for one long frame or two short ones', () => {
    const once = follow(0, 10, 1 / 30, 4);
    const twice = follow(follow(0, 10, 1 / 60, 4), 10, 1 / 60, 4);
    expect(once).toBeCloseTo(twice, 10);
  });

  it('approaches the target without overshooting', () => {
    let v = 0;
    for (let i = 0; i < 600; i++) {
      v = follow(v, 1, 1 / 60, 3);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(v).toBeCloseTo(1, 3);
  });
});

describe('sectionMode', () => {
  it('maps the home page sections to the concept states', () => {
    expect(sectionMode({ hero: true })).toBe('free');
    expect(sectionMode({ offers: true })).toBe('clusters');
    expect(sectionMode({ cards: true })).toBe('constellations');
    expect(sectionMode({ contact: true })).toBe('converge');
    expect(sectionMode({})).toBeNull();
  });

  it('reads a section by its strongest marker: hero, then contact, then projects, then offers', () => {
    expect(sectionMode({ hero: true, contact: true })).toBe('free');
    expect(sectionMode({ contact: true, cards: true })).toBe('converge');
    expect(sectionMode({ cards: true, offers: true })).toBe('constellations');
  });
});

describe('resolveSectionModes', () => {
  it('lets a section without its own state keep the one above it', () => {
    expect(
      resolveSectionModes(['free', 'clusters', null, 'constellations', null, 'converge']),
    ).toEqual(['free', 'clusters', 'clusters', 'constellations', 'constellations', 'converge']);
  });

  it('starts free when the first sections have no state', () => {
    expect(resolveSectionModes([null, 'converge'])).toEqual(['free', 'converge']);
  });
});

describe('hubScreenPoint (the node next to the e-mail address)', () => {
  it('sits just right of the address when there is room', () => {
    const rect = { left: 100, top: 400, width: 220, height: 48 };
    expect(hubScreenPoint(rect, 1366)).toEqual({ x: 100 + 220 + 36, y: 424 });
  });

  it('sits above the address on a narrow screen', () => {
    const rect = { left: 16, top: 600, width: 300, height: 48 };
    expect(hubScreenPoint(rect, 390)).toEqual({ x: 166, y: 600 - 36 });
  });
});

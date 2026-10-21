import { describe, expect, it } from 'vitest';
import { markGeometry, wordmarkGeometry, type Geometry } from './brand-geometry.ts';

function numbers(d: string): number[] {
  return (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
}

function nodesInside(g: Geometry): boolean {
  const [x, y, w, h] = g.viewBox;
  return g.nodes.every(
    (n) => n.cx - n.r >= x && n.cx + n.r <= x + w && n.cy - n.r >= y && n.cy + n.r <= y + h,
  );
}

describe('wordmarkGeometry', () => {
  const word = wordmarkGeometry();

  it('has exactly two accent nodes: the full stop and the dot of the i', () => {
    expect(word.nodes.filter((n) => n.accent)).toHaveLength(2);
  });

  it('keeps every node inside the viewBox', () => {
    expect(nodesInside(word)).toBe(true);
  });

  it('starts every stroke with an absolute move and uses only finite numbers', () => {
    for (const d of word.strokes) {
      expect(d.startsWith('M')).toBe(true);
      expect(numbers(d).every(Number.isFinite)).toBe(true);
    }
  });

  it('is wider than tall, roughly 3.8 : 1', () => {
    const [, , w, h] = word.viewBox;
    expect(w / h).toBeGreaterThan(3.5);
    expect(w / h).toBeLessThan(4.1);
  });
});

describe('markGeometry', () => {
  it('is a 32-unit square with one accent hub and four agents', () => {
    const mark = markGeometry();
    expect(mark.viewBox).toEqual([0, 0, 32, 32]);
    expect(mark.nodes.filter((n) => n.accent)).toHaveLength(1);
    expect(mark.nodes).toHaveLength(5);
    expect(nodesInside(mark)).toBe(true);
  });

  it('rounds the tile only for the favicon, not the touch icon', () => {
    expect(markGeometry({ tile: true }).tileRadius).toBeGreaterThan(0);
    expect(markGeometry({ tile: true, square: true }).tileRadius).toBe(0);
  });
});

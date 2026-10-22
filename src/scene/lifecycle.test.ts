import { describe, expect, it } from 'vitest';
import { Lifecycle } from './lifecycle.ts';

describe('Lifecycle', () => {
  it('runs every cleanup once, newest first, then hands over', () => {
    const calls: string[] = [];
    const life = new Lifecycle(() => calls.push('handover'));
    life.add(() => calls.push('renderer'));
    life.add(() => calls.push('listener'));
    life.dispose();
    life.dispose();
    expect(calls).toEqual(['listener', 'renderer', 'handover']);
    expect(life.disposed).toBe(true);
  });

  it('keeps cleaning up when one cleanup throws', () => {
    const calls: string[] = [];
    const life = new Lifecycle(() => calls.push('handover'));
    life.add(() => calls.push('renderer'));
    life.add(() => {
      throw new Error('already gone');
    });
    life.dispose();
    expect(calls).toEqual(['renderer', 'handover']);
  });

  it('a guarded function that throws disposes everything instead of failing again next frame', () => {
    const calls: string[] = [];
    const life = new Lifecycle(() => calls.push('handover'));
    life.add(() => calls.push('cancel frame'));
    let frames = 0;
    const frame = life.guard(() => {
      frames++;
      throw new Error('shader exploded');
    });
    frame();
    frame();
    expect(frames).toBe(1);
    expect(calls).toEqual(['cancel frame', 'handover']);
  });

  it('a guarded function passes its arguments and runs normally while nothing fails', () => {
    const life = new Lifecycle(() => undefined);
    const seen: number[] = [];
    const frame = life.guard((now: number) => seen.push(now));
    frame(16);
    frame(33);
    expect(seen).toEqual([16, 33]);
    expect(life.disposed).toBe(false);
  });

  it('a cleanup added after disposal runs at once', () => {
    const calls: string[] = [];
    const life = new Lifecycle(() => undefined);
    life.dispose();
    life.add(() => calls.push('late listener'));
    expect(calls).toEqual(['late listener']);
  });
});

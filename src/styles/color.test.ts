import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToNumber, hexToRgb } from './color.ts';

describe('hexToRgb', () => {
  it('reads long and short hex', () => {
    expect(hexToRgb('#ffb547')).toEqual([255, 181, 71]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });

  it('rejects anything that is not hex', () => {
    expect(() => hexToRgb('rgb(0 0 0)')).toThrow(/Not a hex colour/);
  });
});

describe('hexToNumber', () => {
  it('packs into 0xrrggbb', () => {
    expect(hexToNumber('#0b0d12')).toBe(0x0b0d12);
  });
});

describe('contrastRatio', () => {
  it('matches the WCAG extremes and is symmetric', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(contrastRatio('#ffffff', '#767676')).toBeCloseTo(contrastRatio('#767676', '#ffffff'), 9);
  });

  it('puts #767676 on white just above AA', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });
});

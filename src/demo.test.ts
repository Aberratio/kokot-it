import { describe, expect, it } from 'vitest';
import { isDemoAvailable } from './demo.ts';

describe('isDemoAvailable', () => {
  it('accepts a published HTML demo', () => {
    expect(isDemoAvailable(200, 'text/html; charset=utf-8')).toBe(true);
  });

  it('keeps the fallback for a missing demo or a non-HTML answer', () => {
    expect(isDemoAvailable(404, 'text/html')).toBe(false);
    expect(isDemoAvailable(200, 'application/json')).toBe(false);
    expect(isDemoAvailable(200, null)).toBe(false);
  });
});

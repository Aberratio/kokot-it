import { describe, expect, it, vi } from 'vitest';
import { embedDemo, isDemoAvailable, mountDemos, type HeadFetch } from './demo.ts';

// No DOM library in this repo: the figure, slot and document are minimal fakes that carry
// only what demo.ts touches.

interface FakeFigure {
  figure: HTMLElement;
  slot: { replaceChildren: ReturnType<typeof vi.fn> };
  classes: string[];
}

function fakeFigure(dataset: Record<string, string> = {}, withSlot = true): FakeFigure {
  const slot = { replaceChildren: vi.fn() };
  const classes: string[] = [];
  const figure = {
    dataset: { demoSrc: '/demos/x/index.html?embed=1', demoTitle: 'Demo X', ...dataset },
    querySelector: () => (withSlot ? slot : null),
    ownerDocument: { createElement: (tag: string) => ({ tagName: tag.toUpperCase() }) },
    classList: { add: (c: string) => classes.push(c) },
  } as unknown as HTMLElement;
  return { figure, slot, classes };
}

const answer =
  (status: number, type: string | null): HeadFetch =>
  () =>
    Promise.resolve({ status, headers: new Headers(type ? { 'content-type': type } : {}) });

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

describe('embedDemo', () => {
  it('replaces the fallback with a lazy iframe when the demo is published', async () => {
    const { figure, slot, classes } = fakeFigure();
    const headFetch = vi.fn(answer(200, 'text/html'));

    expect(await embedDemo(figure, headFetch)).toBe(true);
    expect(headFetch).toHaveBeenCalledWith('/demos/x/index.html?embed=1', { method: 'HEAD' });
    expect(slot.replaceChildren).toHaveBeenCalledWith(
      expect.objectContaining({
        tagName: 'IFRAME',
        src: '/demos/x/index.html?embed=1',
        title: 'Demo X',
        loading: 'lazy',
      }),
    );
    expect(classes).toEqual(['demo--live']);
  });

  it('keeps the fallback when the demo is missing', async () => {
    const { figure, slot } = fakeFigure();
    expect(await embedDemo(figure, answer(404, 'text/html'))).toBe(false);
    expect(slot.replaceChildren).not.toHaveBeenCalled();
  });

  it('keeps the fallback when the request fails', async () => {
    const { figure, slot } = fakeFigure();
    expect(await embedDemo(figure, () => Promise.reject(new Error('offline')))).toBe(false);
    expect(slot.replaceChildren).not.toHaveBeenCalled();
  });

  it('does nothing without a source or a slot', async () => {
    const headFetch = vi.fn(answer(200, 'text/html'));
    expect(await embedDemo(fakeFigure({}, false).figure, headFetch)).toBe(false);
    expect(headFetch).not.toHaveBeenCalled();
  });
});

describe('mountDemos', () => {
  const rootWith = (figures: HTMLElement[]): ParentNode =>
    ({ querySelectorAll: () => figures }) as unknown as ParentNode;

  it('checks every demo at once when IntersectionObserver is missing', () => {
    const headFetch = vi.fn(answer(404, null));
    mountDemos(rootWith([fakeFigure().figure, fakeFigure().figure]), { headFetch });
    expect(headFetch).toHaveBeenCalledTimes(2);
  });

  it('waits until a demo scrolls into view, then checks it once', () => {
    const headFetch = vi.fn(answer(404, null));
    let fire: IntersectionObserverCallback = () => undefined;
    const observed: Element[] = [];
    const unobserved: Element[] = [];
    class FakeObserver {
      constructor(callback: IntersectionObserverCallback) {
        fire = callback;
      }
      observe(el: Element): void {
        observed.push(el);
      }
      unobserve(el: Element): void {
        unobserved.push(el);
      }
    }
    const a = fakeFigure().figure;
    const b = fakeFigure().figure;
    mountDemos(rootWith([a, b]), {
      headFetch,
      Observer: FakeObserver as unknown as typeof IntersectionObserver,
    });

    expect(observed).toEqual([a, b]);
    expect(headFetch).not.toHaveBeenCalled();

    const entries = [
      { target: a, isIntersecting: true },
      { target: b, isIntersecting: false },
    ] as unknown as IntersectionObserverEntry[];
    fire(entries, {} as IntersectionObserver);

    expect(headFetch).toHaveBeenCalledTimes(1);
    expect(unobserved).toEqual([a]);
  });
});

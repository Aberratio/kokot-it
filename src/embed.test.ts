import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  applyHeight,
  embedTool,
  MAX_HEIGHT,
  MIN_HEIGHT,
  mountTools,
  reportedHeight,
  TOOL_SANDBOX,
} from './embed.ts';
import { TOOL_SLUGS } from './content/types.ts';

// No DOM library in this repo: the figure, slot and document are minimal fakes that carry
// only what embed.ts touches.

interface FakeFigure {
  figure: HTMLElement;
  slot: { replaceChildren: ReturnType<typeof vi.fn> };
  classes: string[];
  /** Where the figure's top sits relative to the viewport; negative is above it. */
  layout: { top: number };
  scrollIntoView: ReturnType<typeof vi.fn>;
}

function fakeFrame(): HTMLIFrameElement {
  const attributes: Record<string, string> = {};
  return {
    tagName: 'IFRAME',
    style: {},
    contentWindow: {},
    attributes,
    setAttribute: (name: string, value: string) => {
      attributes[name] = value;
    },
  } as unknown as HTMLIFrameElement;
}

function fakeFigure(dataset: Record<string, string> = {}, withSlot = true): FakeFigure {
  const slot = { replaceChildren: vi.fn() };
  const classes: string[] = [];
  const layout = { top: 0 };
  const scrollIntoView = vi.fn();
  const figure = {
    dataset: {
      tool: 'x',
      toolSrc: '/tools/x/?embed=1&lang=pl',
      toolTitle: 'Tool X',
      ...dataset,
    },
    querySelector: () => (withSlot ? slot : null),
    ownerDocument: { createElement: () => fakeFrame() },
    classList: { add: (c: string) => classes.push(c) },
    getBoundingClientRect: () => ({ top: layout.top }),
    scrollIntoView,
  } as unknown as HTMLElement;
  return { figure, slot, classes, layout, scrollIntoView };
}

describe('embedTool', () => {
  it('replaces the fallback with a lazy, sandboxed iframe', () => {
    const { figure, slot, classes } = fakeFigure();
    const frame = embedTool(figure);
    expect(frame).toMatchObject({
      src: '/tools/x/?embed=1&lang=pl',
      title: 'Tool X',
      loading: 'lazy',
      className: 'tool__iframe',
      attributes: { sandbox: TOOL_SANDBOX },
    });
    expect(slot.replaceChildren).toHaveBeenCalledWith(frame);
    expect(classes).toEqual(['tool--live']);
  });

  it('keeps the sandbox to scripts, own assets, downloads and popups', () => {
    expect(TOOL_SANDBOX.split(' ').sort()).toEqual([
      'allow-downloads',
      'allow-popups',
      'allow-same-origin',
      'allow-scripts',
    ]);
  });

  it('does nothing without a source or a slot', () => {
    expect(embedTool(fakeFigure({}, false).figure)).toBeNull();
    const empty = fakeFigure({ toolSrc: '' });
    expect(embedTool(empty.figure)).toBeNull();
    expect(empty.slot.replaceChildren).not.toHaveBeenCalled();
  });
});

describe('reportedHeight', () => {
  it('reads the height reported by the named application', () => {
    expect(reportedHeight({ type: 'x:height', height: 812.4 }, 'x')).toBe(813);
  });

  it('ignores other messages, other applications and out-of-range values', () => {
    for (const data of [
      null,
      'x:height',
      { type: 'y:height', height: 800 },
      { type: 'x:height', height: '800' },
      { type: 'x:height', height: Number.NaN },
      { type: 'x:height', height: MIN_HEIGHT - 1 },
      { type: 'x:height', height: MAX_HEIGHT + 1 },
    ]) {
      expect(reportedHeight(data, 'x'), JSON.stringify(data)).toBeNull();
    }
  });
});

describe('applyHeight', () => {
  const setup = () => {
    const { figure, classes, layout, scrollIntoView } = fakeFigure();
    const frame = fakeFrame();
    return { classes, frame, layout, scrollIntoView, tools: [{ figure, frame }] };
  };
  const report = (frame: HTMLIFrameElement, height: number) => ({
    origin: 'https://kokot.it',
    source: frame.contentWindow,
    data: { type: 'x:height', height },
  });

  it('sizes the iframe that sent a same-origin height report', () => {
    const { frame, tools, classes } = setup();
    const message = {
      origin: 'https://kokot.it',
      source: frame.contentWindow,
      data: { type: 'x:height', height: 900 },
    };
    expect(applyHeight(message, 'https://kokot.it', tools)).toBe(true);
    expect(frame.style.height).toBe('900px');
    expect(classes).toEqual(['tool--sized']);
  });

  it('ignores another origin and windows that are not an embedded frame', () => {
    const { frame, tools } = setup();
    const data = { type: 'x:height', height: 900 };
    const foreign = { origin: 'https://evil.example', source: frame.contentWindow, data };
    expect(applyHeight(foreign, 'https://kokot.it', tools)).toBe(false);
    const stranger = { origin: 'https://kokot.it', source: {}, data };
    expect(applyHeight(stranger, 'https://kokot.it', tools)).toBe(false);
    expect(frame.style.height).toBeUndefined();
  });

  it('brings the figure back into view when a new screen leaves it above the viewport', () => {
    const { frame, layout, scrollIntoView, tools } = setup();
    applyHeight(report(frame, 2287), 'https://kokot.it', tools);
    layout.top = -1493;
    applyHeight(report(frame, 980), 'https://kokot.it', tools);
    expect(frame.style.height).toBe('980px');
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'start' });
  });

  it('leaves the scroll alone while the figure top is still on screen', () => {
    const { frame, layout, scrollIntoView, tools } = setup();
    applyHeight(report(frame, 2287), 'https://kokot.it', tools);
    layout.top = 0;
    applyHeight(report(frame, 980), 'https://kokot.it', tools);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('leaves the scroll alone when the frame grows or reflows by a little', () => {
    const { frame, layout, scrollIntoView, tools } = setup();
    layout.top = -400;
    applyHeight(report(frame, 827), 'https://kokot.it', tools);
    applyHeight(report(frame, 954), 'https://kokot.it', tools);
    applyHeight(report(frame, 942), 'https://kokot.it', tools);
    applyHeight(report(frame, 827), 'https://kokot.it', tools);
    expect(frame.style.height).toBe('827px');
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not scroll on the first report, before the reader has seen the application', () => {
    const { frame, layout, scrollIntoView, tools } = setup();
    layout.top = -900;
    applyHeight(report(frame, 600), 'https://kokot.it', tools);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('mountTools', () => {
  const rootWith = (figures: HTMLElement[]): ParentNode =>
    ({ querySelectorAll: () => figures }) as unknown as ParentNode;

  it('embeds every application at once when IntersectionObserver is missing', () => {
    const a = fakeFigure();
    const b = fakeFigure();
    mountTools(rootWith([a.figure, b.figure]), {});
    expect(a.slot.replaceChildren).toHaveBeenCalledTimes(1);
    expect(b.slot.replaceChildren).toHaveBeenCalledTimes(1);
  });

  it('waits until an application scrolls near the viewport, then embeds it once', () => {
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
    const a = fakeFigure();
    const b = fakeFigure();
    mountTools(rootWith([a.figure, b.figure]), {
      Observer: FakeObserver as unknown as typeof IntersectionObserver,
    });
    expect(observed).toEqual([a.figure, b.figure]);
    expect(a.slot.replaceChildren).not.toHaveBeenCalled();

    const entries = [
      { target: a.figure, isIntersecting: true },
      { target: b.figure, isIntersecting: false },
    ] as unknown as IntersectionObserverEntry[];
    fire(entries, {} as IntersectionObserver);

    expect(a.slot.replaceChildren).toHaveBeenCalledTimes(1);
    expect(b.slot.replaceChildren).not.toHaveBeenCalled();
    expect(unobserved).toEqual([a.figure]);
  });

  it('routes height messages to the frame that sent them', () => {
    let listener: (event: MessageEvent) => void = () => undefined;
    const messages = {
      addEventListener: (_type: string, fn: (event: MessageEvent) => void) => {
        listener = fn;
      },
    } as unknown as Pick<Window, 'addEventListener'>;
    const a = fakeFigure();
    mountTools(rootWith([a.figure]), { messages, origin: 'https://kokot.it' });
    const frame = a.slot.replaceChildren.mock.calls[0]?.[0] as HTMLIFrameElement;
    listener({
      origin: 'https://kokot.it',
      source: frame.contentWindow,
      data: { type: 'x:height', height: 700 },
    } as MessageEvent);
    expect(frame.style.height).toBe('700px');
  });

  it('does nothing on a page without applications', () => {
    const addEventListener = vi.fn();
    mountTools(rootWith([]), { messages: { addEventListener } });
    expect(addEventListener).not.toHaveBeenCalled();
  });
});

describe('frame styles', () => {
  const css = readFileSync(new URL('./styles/content.css', import.meta.url), 'utf8');

  it('lets a sized frame follow the reported height without a cap', () => {
    const sized = /\.tool--sized \.tool__frame \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(sized).toContain('height: auto');
    expect(sized).toContain('max-height: none');
  });

  it('gives no application its own frame size that could clip the reported height', () => {
    for (const slug of TOOL_SLUGS) {
      expect(css, slug).not.toContain(`.tool--${slug} .tool__frame`);
    }
  });

  it('accepts the height a phone-width Factory Twin reports', () => {
    expect(reportedHeight({ type: 'factory-twin:height', height: 930 }, 'factory-twin')).toBe(930);
  });
});

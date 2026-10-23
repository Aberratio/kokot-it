// The reference applications (public/tools/<slug>/) are embedded lazily on their case-study
// pages. The static page carries a text fallback and a link that opens the application in a
// new tab; once the figure scrolls near the viewport, a sandboxed <iframe> replaces the
// fallback. Applications that report their height (`{ type: '<slug>:height', height }`
// through postMessage) get an iframe sized to their content. When a new screen in the
// application shrinks the iframe and leaves its top above the viewport, the figure scrolls back
// into view, so the reader is not left below an application they can no longer see.

/** What the iframe may do: run the app's scripts, load its own assets, download exports. */
export const TOOL_SANDBOX = 'allow-scripts allow-same-origin allow-downloads allow-popups';

/** Heights outside this range are ignored, so a broken message cannot collapse or blow up the page. */
export const MIN_HEIGHT = 240;
export const MAX_HEIGHT = 20000;

/**
 * A report at most this fraction of the previous one is a new screen in the application (a
 * menu giving way to a level: 2287 to 827 px on a phone), not a reflow within a screen (a panel
 * growing or shrinking by about a tenth). Only a new screen may move the host page.
 */
export const NEW_SCREEN_RATIO = 0.75;

export function createToolFrame(doc: Document, src: string, title: string): HTMLIFrameElement {
  const frame = doc.createElement('iframe');
  frame.src = src;
  frame.title = title;
  frame.loading = 'lazy';
  frame.className = 'tool__iframe';
  frame.setAttribute('sandbox', TOOL_SANDBOX);
  return frame;
}

/** Swaps the figure's text fallback for the application iframe. */
export function embedTool(figure: HTMLElement): HTMLIFrameElement | null {
  const src = figure.dataset['toolSrc'];
  const slot = figure.querySelector<HTMLElement>('[data-tool-slot]');
  if (!src || !slot) return null;
  const frame = createToolFrame(figure.ownerDocument, src, figure.dataset['toolTitle'] ?? '');
  slot.replaceChildren(frame);
  figure.classList.add('tool--live');
  return frame;
}

/**
 * The height an application reports for itself, or null when the message is not a height
 * report from the application `slug` or the value is out of range.
 */
export function reportedHeight(data: unknown, slug: string): number | null {
  if (!data || typeof data !== 'object') return null;
  const { type, height } = data as { type?: unknown; height?: unknown };
  if (type !== `${slug}:height` || typeof height !== 'number' || !Number.isFinite(height)) {
    return null;
  }
  if (height < MIN_HEIGHT || height > MAX_HEIGHT) return null;
  return Math.ceil(height);
}

export interface HeightMessage {
  origin: string;
  source: unknown;
  data: unknown;
}

export interface EmbeddedTool {
  figure: HTMLElement;
  frame: HTMLIFrameElement;
  /** The last height applied to the frame; absent until the application reports one. */
  height?: number;
}

/**
 * Applies a height report to the iframe that sent it. Only messages from this site's own
 * origin and from one of the embedded frames count; returns whether a frame was resized.
 * After a new screen shrinks the frame, a figure whose top is now above the viewport scrolls
 * back to it. The jump is instant, so it needs no reduced-motion variant.
 */
export function applyHeight(
  message: HeightMessage,
  origin: string,
  tools: readonly EmbeddedTool[],
): boolean {
  if (message.origin !== origin) return false;
  const match = tools.find(({ frame }) => frame.contentWindow === message.source);
  if (!match) return false;
  const height = reportedHeight(message.data, match.figure.dataset['tool'] ?? '');
  if (height === null) return false;
  const previous = match.height;
  match.height = height;
  match.frame.style.height = `${String(height)}px`;
  match.figure.classList.add('tool--sized');
  const newScreen = previous !== undefined && height <= previous * NEW_SCREEN_RATIO;
  if (newScreen && match.figure.getBoundingClientRect().top < 0) {
    match.figure.scrollIntoView({ block: 'start' });
  }
  return true;
}

export interface EmbedEnv {
  /** Absent in old browsers: every application is then embedded right away. */
  Observer?: typeof IntersectionObserver | undefined;
  /** Where height messages arrive; `window` in the browser. */
  messages?: Pick<Window, 'addEventListener'> | undefined;
  origin?: string;
}

export function mountTools(
  root: ParentNode,
  env: EmbedEnv = {
    Observer: globalThis.IntersectionObserver,
    messages: globalThis.window,
    origin: globalThis.location.origin,
  },
): void {
  const figures = [...root.querySelectorAll<HTMLElement>('[data-tool-src]')];
  if (figures.length === 0) return;
  const tools: EmbeddedTool[] = [];
  env.messages?.addEventListener('message', (event: MessageEvent) => {
    applyHeight(event, env.origin ?? '', tools);
  });
  const embed = (figure: HTMLElement): void => {
    const frame = embedTool(figure);
    if (frame) tools.push({ figure, frame });
  };
  if (!env.Observer) {
    figures.forEach(embed);
    return;
  }
  const observer = new env.Observer(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        embed(entry.target as HTMLElement);
      }
    },
    { rootMargin: '400px' },
  );
  figures.forEach((figure) => {
    observer.observe(figure);
  });
}

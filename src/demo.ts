// Recorded demos (D-023) are embedded lazily: the static page carries a text fallback,
// and an <iframe> replaces it only when the figure scrolls into view and the demo file
// is actually published under public/demos/<slug>/.

/** Whether a HEAD response means the demo page exists (and is not an HTML fallback for a 404). */
export function isDemoAvailable(status: number, contentType: string | null): boolean {
  return status >= 200 && status < 300 && (contentType ?? '').includes('text/html');
}

export function createDemoFrame(doc: Document, src: string, title: string): HTMLIFrameElement {
  const frame = doc.createElement('iframe');
  frame.src = src;
  frame.title = title;
  frame.loading = 'lazy';
  frame.className = 'demo__iframe';
  frame.referrerPolicy = 'no-referrer';
  return frame;
}

export type HeadFetch = (
  url: string,
  init: { method: 'HEAD' },
) => Promise<Pick<Response, 'status' | 'headers'>>;

/** Swaps the figure's text fallback for the demo iframe, if the demo is published. */
export async function embedDemo(
  figure: HTMLElement,
  headFetch: HeadFetch = fetch,
): Promise<boolean> {
  const src = figure.dataset['demoSrc'];
  const slot = figure.querySelector<HTMLElement>('[data-demo-slot]');
  if (!src || !slot) return false;
  try {
    const res = await headFetch(src, { method: 'HEAD' });
    if (!isDemoAvailable(res.status, res.headers.get('content-type'))) return false;
  } catch {
    return false; // offline or blocked: keep the text fallback
  }
  slot.replaceChildren(
    createDemoFrame(figure.ownerDocument, src, figure.dataset['demoTitle'] ?? ''),
  );
  figure.classList.add('demo--live');
  return true;
}

export interface DemoEnv {
  headFetch?: HeadFetch;
  /** Absent in old browsers: every demo is then checked right away. */
  Observer?: typeof IntersectionObserver | undefined;
}

export function mountDemos(
  root: ParentNode,
  env: DemoEnv = { Observer: globalThis.IntersectionObserver },
): void {
  const figures = [...root.querySelectorAll<HTMLElement>('[data-demo-src]')];
  if (figures.length === 0) return;
  const embed = (figure: HTMLElement): void => void embedDemo(figure, env.headFetch);
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
    { rootMargin: '200px' },
  );
  figures.forEach((figure) => {
    observer.observe(figure);
  });
}

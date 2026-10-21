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

async function embed(figure: HTMLElement): Promise<void> {
  const src = figure.dataset['demoSrc'];
  const slot = figure.querySelector<HTMLElement>('[data-demo-slot]');
  if (!src || !slot) return;
  try {
    const res = await fetch(src, { method: 'HEAD' });
    if (!isDemoAvailable(res.status, res.headers.get('content-type'))) return;
  } catch {
    return; // offline or blocked: keep the text fallback
  }
  const frame = createDemoFrame(figure.ownerDocument, src, figure.dataset['demoTitle'] ?? '');
  slot.replaceChildren(frame);
  figure.classList.add('demo--live');
}

export function mountDemos(root: ParentNode): void {
  const figures = [...root.querySelectorAll<HTMLElement>('[data-demo-src]')];
  if (figures.length === 0) return;
  if (!('IntersectionObserver' in window)) {
    figures.forEach((f) => void embed(f));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        void embed(entry.target as HTMLElement);
      }
    },
    { rootMargin: '200px' },
  );
  figures.forEach((f) => {
    observer.observe(f);
  });
}

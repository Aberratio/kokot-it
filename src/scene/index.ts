/**
 * Entry of the Relay scene, part of the main bundle — so it stays tiny and never imports
 * three.js. After the page has rendered and the browser is idle, it picks the mode and either
 * draws the SVG still (no WebGL) or loads the live scene (app.ts + three.js, its own chunk).
 */
import { chooseMode } from './input.ts';
import { relayStillMarkup, stillGraph } from './still.ts';

/** Darkens the scene behind the text column, so copy keeps its contrast over any frame. */
function addScrim(root: HTMLElement): void {
  root.classList.add('scene-host');
  if (root.querySelector('.scene-scrim')) return;
  const scrim = document.createElement('div');
  scrim.className = 'scene-scrim';
  root.append(scrim);
}

export function showStill(root: HTMLElement): void {
  if (root.querySelector('.scene--still')) return;
  const { graph, width, height } = stillGraph(window.innerWidth, window.innerHeight);
  const still = document.createElement('div');
  still.className = 'scene scene--still';
  still.innerHTML = relayStillMarkup(graph, width, height, {
    id: 'scene-still',
    fit: 'xMidYMid slice',
  });
  root.prepend(still);
  addScrim(root);
  requestAnimationFrame(() => {
    still.classList.add('is-ready');
  });
}

function hasWebGL2(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    // Free the probe's context right away: browsers cap live contexts.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

/** After `load`, when the main thread is idle: the scene never competes with the content. */
function whenIdle(task: () => void): void {
  const idle = (): void => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(task, { timeout: 2000 });
    else setTimeout(task, 200);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}

export function mountScene(root: HTMLElement): void {
  whenIdle(() => {
    const mode = chooseMode({
      webgl: hasWebGL2(),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
    if (mode === 'fallback') {
      showStill(root);
      return;
    }
    addScrim(root);
    import('./app.ts')
      .then(({ startScene }) =>
        startScene(root, mode, () => {
          showStill(root);
        }),
      )
      .catch(() => {
        showStill(root);
      });
  });
}

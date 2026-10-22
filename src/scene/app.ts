/**
 * The live Relay scene: loaded lazily (with three.js) by index.ts after the page has rendered.
 * Wires the page — sections, hovered offers and projects, the pointer, visibility — to the
 * pure logic (layouts, routing, quality) and the GPU renderer.
 */
import { sceneTokensFromDocument } from '../styles/tokens.ts';
import {
  DwellDetector,
  follow,
  hubScreenPoint,
  nearestNode,
  resolveSectionModes,
  screenToWorld,
  sectionMode,
  type RenderMode,
} from './input.ts';
import { CONVERGE_NODE, layoutFor, type SceneMode } from './layouts.ts';
import { cubicBezier, parseCubicBezier, snapshotPositions } from './morph.ts';
import { buildNetwork, type GroupKind } from './network.ts';
import { FrameMonitor, initialLevel, LEVELS } from './quality.ts';
import { mulberry32 } from './relay-graph.ts';
import { RelayRenderer, type Split } from './renderer.ts';
import { Pacer, planRoute, Relay } from './routing.ts';

export const NETWORK_SEED = 2026;

/** Autonomous jobs per second: "silence as the base state" — a few pulses, never a screensaver. */
const JOB_RATE: Readonly<Record<SceneMode, number>> = {
  free: 0.7,
  clusters: 0.9,
  constellations: 0.75,
  converge: 0.35,
};
/** Overall brightness per state: the contact state quietens the network. */
const BRIGHTNESS: Readonly<Record<SceneMode, number>> = {
  free: 1,
  clusters: 1,
  constellations: 1,
  converge: 0.8,
};
const SPLIT: Readonly<Record<SceneMode, Split>> = {
  free: 0,
  clusters: 1,
  constellations: 2,
  converge: 0,
};
/** First autonomous pulses start about a second after the scene appears. */
const FIRST_JOB_DELAY = 1;
const ORDER_REACH_PX = 120;
const CURSOR_REST_MS = 2500;

const groupKind = (mode: SceneMode): GroupKind | null =>
  mode === 'clusters' || mode === 'constellations' ? mode : null;

const nextTask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function readEase(name: string): (t: number) => number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return cubicBezier(...parseCubicBezier(value));
}

/** Starts the scene in `root`; calls `fallback` when WebGL fails or the device is too slow. */
export async function startScene(
  root: HTMLElement,
  mode: Exclude<RenderMode, 'fallback'>,
  fallback: () => void,
): Promise<void> {
  const tokens = sceneTokensFromDocument();
  const easeInOut = readEase('--ease-in-out');
  const easeSignal = readEase('--ease-signal');
  const reduced = mode === 'reduced';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const monitor = new FrameMonitor(
    initialLevel({
      width: window.innerWidth,
      cores: nav.hardwareConcurrency || 4,
      memoryGb: nav.deviceMemory,
      coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    }),
  );
  let level = LEVELS[monitor.level] ?? LEVELS[LEVELS.length - 1];
  if (!level) return;

  // Split the start-up into short tasks so none of them blocks input for long.
  await nextTask();
  const net = buildNetwork({ seed: NETWORK_SEED, count: level.nodes });
  const seeds = net.nodes.map((n) => n.seed);
  await nextTask();

  const canvas = document.createElement('canvas');
  canvas.className = 'scene scene--live';
  root.prepend(canvas);
  let renderer: RelayRenderer;
  try {
    renderer = new RelayRenderer(canvas, net, tokens, level, LEVELS[0]?.maxJobs ?? 16);
  } catch {
    canvas.remove();
    fallback();
    return;
  }
  renderer.resize(canvas.clientWidth, canvas.clientHeight);
  // Observable quality level (index into LEVELS) and mode, for checks in the browser.
  canvas.dataset['level'] = String(monitor.level);
  canvas.dataset['mode'] = mode;

  const rand = mulberry32(NETWORK_SEED + 1);
  const relay = new Relay(net, { maxJobs: level.maxJobs, ease: easeSignal });
  const pacer = new Pacer(rand);
  const dwell = new DwellDetector();

  // ---- Sections → network state -------------------------------------------------------------
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section'));
  const sectionModes = resolveSectionModes(
    sections.map((s) =>
      sectionMode({
        hero: s.classList.contains('hero'),
        offers: s.querySelector('.offers') !== null,
        cards: s.querySelector('.cards') !== null,
        contact: s.classList.contains('contact'),
      }),
    ),
  );
  let sceneMode: SceneMode = 'free';
  let from = layoutFor('free', net, renderer.frame);
  let to = from;
  let morphStart = -Infinity;
  let focus = -1;

  /** Where the contact node stands: next to the e-mail address, as seen when scrolled to the end. */
  const hubPoint = (): [number, number] => {
    const link = document.querySelector<HTMLElement>('.contact .contact__email a');
    if (!link) return [0, 0];
    const rect = link.getBoundingClientRect();
    const scroller = document.scrollingElement ?? document.documentElement;
    const rest = scroller.scrollHeight - window.innerHeight - window.scrollY;
    const point = hubScreenPoint(
      {
        left: rect.left,
        top: rect.top - Math.max(0, rest),
        width: rect.width,
        height: rect.height,
      },
      canvas.clientWidth,
    );
    return screenToWorld(point.x, point.y, canvas.clientWidth, canvas.clientHeight, renderer.frame);
  };

  const morphProgress = (now: number): number =>
    easeInOut(Math.min(1, Math.max(0, (now - morphStart) / Math.max(tokens.transitionMs, 1))));

  const setMode = (next: SceneMode, now: number, instant = false): void => {
    const target = layoutFor(
      next,
      net,
      renderer.frame,
      next === 'converge' ? { hub: hubPoint() } : {},
    );
    // Continue from wherever the agents are now, also mid re-wiring.
    from = instant ? target : snapshotPositions(from, to, seeds, morphProgress(now));
    to = target;
    renderer.setLayouts(from, to, [SPLIT[sceneMode], SPLIT[next]], CONVERGE_NODE);
    sceneMode = next;
    morphStart = instant ? -Infinity : now;
    focus = -1;
    if (!reduced) relay.clear();
  };

  // ---- Frame state ----------------------------------------------------------------------------
  let time = 0;
  let elapsed = 0;
  let cursor: [number, number] = [9, 9];
  let cursorTarget = 0;
  let lastMove = -Infinity;
  let cursorStrength = 0;
  const parallax: [number, number] = [0, 0];
  let hub = 0;
  /** Jobs queued for a given drift time; `group` keeps them inside one cluster or constellation. */
  const bursts: { at: number; group?: number }[] = [];

  const draw = (now: number): void => {
    renderer.render({
      time,
      morph: morphProgress(now),
      nodeHeat: relay.nodeHeat,
      edgeHeat: relay.edgeHeat,
      pulses: relay.pulses,
      cursor,
      cursorStrength,
      parallax,
      focus,
      hub,
      level: BRIGHTNESS[sceneMode],
    });
  };

  const dispatch = (route: number[] | null): void => {
    if (route) relay.dispatch(route);
  };

  const order = (x: number, y: number, now: number): void => {
    const positions = snapshotPositions(from, to, seeds, morphProgress(now));
    const screen = renderer.project(positions, renderer.nodeCount);
    const entry = nearestNode(screen, renderer.nodeCount, x, y, ORDER_REACH_PX);
    if (entry < 0) return;
    const kind = groupKind(sceneMode);
    dispatch(
      planRoute(sceneMode, net, {
        limit: renderer.nodeCount,
        rand,
        from: entry,
        focus: kind ? net.groups[kind][entry] : undefined,
      }),
    );
  };

  // ---- Static frame (prefers-reduced-motion) -------------------------------------------------
  if (reduced) {
    // A held moment of work: a few jobs fast-forwarded on the CPU, then one frame, nothing moves.
    const still = (): void => {
      relay.clear();
      for (let k = 0; k < 8; k++) {
        dispatch(planRoute(sceneMode, net, { limit: renderer.nodeCount, rand }));
        for (let s = 0; s < 15; s++) relay.step(1 / 60);
      }
      hub = sceneMode === 'converge' ? 1 : 0;
      draw(performance.now());
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const next = sectionModes[sections.indexOf(entry.target as HTMLElement)];
          if (entry.isIntersecting && next && next !== sceneMode) {
            // Re-wiring becomes a cut: the new layout appears at once.
            setMode(next, performance.now(), true);
            still();
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const s of sections) observer.observe(s);
    new ResizeObserver(() => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight);
      setMode(sceneMode, performance.now(), true);
      draw(performance.now());
    }).observe(canvas);
    setMode(sceneMode, performance.now(), true);
    still();
    canvas.classList.add('is-ready');
    return;
  }

  // ---- Live loop ----------------------------------------------------------------------------
  let raf = 0;
  let last = 0;
  let visible = document.visibilityState === 'visible';
  let onScreen = true;
  let dead = false;
  let tornDown = false;

  const loop = (now: number): void => {
    raf = requestAnimationFrame(loop);
    const dtMs = last ? now - last : 16;
    last = now;
    const action = monitor.sample(dtMs);
    if (action === 'fallback') {
      teardown();
      return;
    }
    if (action === 'downgrade') {
      level = LEVELS[monitor.level] ?? level;
      if (level) {
        canvas.dataset['level'] = String(monitor.level);
        renderer.setLevel(level);
        relay.maxJobs = level.maxJobs;
        relay.clear();
      }
    }

    const dt = (Math.min(dtMs, 100) / 1000) * tokens.motionScale;
    time += dt;
    elapsed += dt;
    const limit = renderer.nodeCount;
    if (elapsed > FIRST_JOB_DELAY) {
      for (let k = pacer.tick(dt, JOB_RATE[sceneMode]); k > 0; k--) {
        dispatch(planRoute(sceneMode, net, { limit, rand, focus: focus >= 0 ? focus : undefined }));
      }
    }
    while (bursts.length && (bursts[0]?.at ?? Infinity) <= time) {
      const burst = bursts.shift();
      if (burst) dispatch(planRoute(sceneMode, net, { limit, rand, focus: burst.group }));
    }
    const placed = dwell.poll(now);
    if (placed) order(placed.x, placed.y, now);

    relay.step(dt);
    // A resting pointer has placed its order: its glow fades instead of staining the frame.
    if (now - lastMove > CURSOR_REST_MS) cursorTarget = 0;
    cursorStrength = follow(cursorStrength, cursorTarget, dt, 3);
    hub = follow(hub, sceneMode === 'converge' ? 1 : 0, dt, 1.5);
    const sway = Math.sin(time * 0.05) * 0.25;
    parallax[0] = follow(parallax[0], cursorTarget * cursor[0] * 0.5 + sway, dt, 1.2);
    parallax[1] = follow(parallax[1], cursorTarget * cursor[1] * 0.3, dt, 1.2);
    draw(now);
  };

  const run = (): void => {
    const should = visible && onScreen && !dead;
    if (should && !raf) {
      last = 0;
      monitor.reset();
      raf = requestAnimationFrame(loop);
    } else if (!should && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const listeners: [EventTarget, string, (e: Event) => void][] = [];
  const on = (
    target: EventTarget,
    type: string,
    listener: (e: Event) => void,
    passive = true,
  ): void => {
    target.addEventListener(type, listener, { passive });
    listeners.push([target, type, listener]);
  };
  const observers: (IntersectionObserver | ResizeObserver)[] = [];

  function teardown(): void {
    if (tornDown) return;
    tornDown = true;
    dead = true;
    run();
    for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
    for (const o of observers) o.disconnect();
    canvas.remove();
    renderer.dispose();
    fallback();
  }

  // Pause in a hidden tab and when the canvas is not on screen: the loop stops, not just idles.
  on(document, 'visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    run();
  });
  const onScreenObserver = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    run();
  });
  onScreenObserver.observe(canvas);
  observers.push(onScreenObserver);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const next = sectionModes[sections.indexOf(entry.target as HTMLElement)];
        if (entry.isIntersecting && next && next !== sceneMode) setMode(next, performance.now());
      }
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  for (const s of sections) sectionObserver.observe(s);
  observers.push(sectionObserver);

  let aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
  const resizeObserver = new ResizeObserver(() => {
    renderer.resize(canvas.clientWidth, canvas.clientHeight);
    const next = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    // Re-lay only when the shape really changed (rotation), not for a browser bar sliding away.
    if (Math.abs(next - aspect) / aspect > 0.15) {
      aspect = next;
      setMode(sceneMode, performance.now(), true);
    }
    if (!raf) draw(performance.now());
  });
  resizeObserver.observe(canvas);
  observers.push(resizeObserver);

  // The pointer is a client: it lights the agents near it and, when it rests, places an order.
  on(window, 'pointermove', (event) => {
    const e = event as PointerEvent;
    cursor = [(e.clientX / canvas.clientWidth) * 2 - 1, 1 - (e.clientY / canvas.clientHeight) * 2];
    if (e.pointerType === 'mouse') {
      cursorTarget = 1;
      lastMove = performance.now();
      dwell.move(e.clientX, e.clientY, performance.now());
    }
  });
  on(window, 'pointerdown', (event) => {
    const e = event as PointerEvent;
    if (e.pointerType === 'mouse') return;
    cursor = [(e.clientX / canvas.clientWidth) * 2 - 1, 1 - (e.clientY / canvas.clientHeight) * 2];
    cursorStrength = 1;
    cursorTarget = 0;
    dwell.tap(e.clientX, e.clientY);
  });
  on(document.documentElement, 'mouseleave', () => {
    cursorTarget = 0;
    dwell.leave();
  });

  // Hovered offer P1–P3 lights its cluster; a hovered project runs a series in its constellation.
  for (const offer of document.querySelectorAll<HTMLElement>('.offer')) {
    const code = /P(\d)/.exec(offer.querySelector('.offer__code')?.textContent ?? '');
    if (!code?.[1]) continue;
    const group = Number(code[1]) - 1;
    const enter = (): void => {
      if (sceneMode !== 'clusters') return;
      focus = group;
      bursts.push({ at: time, group }, { at: time + 0.35, group });
    };
    on(offer, 'pointerenter', enter);
    on(offer, 'focusin', enter);
    on(offer, 'pointerleave', () => (focus = -1));
    on(offer, 'focusout', () => (focus = -1));
  }
  document.querySelectorAll<HTMLElement>('.cards > li').forEach((card, group) => {
    const enter = (): void => {
      if (sceneMode !== 'constellations') return;
      focus = group;
      for (let k = 0; k < 3; k++) bursts.push({ at: time + k * 0.22, group });
    };
    on(card, 'pointerenter', enter);
    on(card, 'focusin', enter);
    on(card, 'pointerleave', () => (focus = -1));
    on(card, 'focusout', () => (focus = -1));
  });

  // A lost GPU context that does not come back within a few seconds gives way to the still.
  let lostTimer = 0;
  on(
    canvas,
    'webglcontextlost',
    (e) => {
      e.preventDefault();
      dead = true;
      run();
      lostTimer = window.setTimeout(teardown, 3000);
    },
    false,
  );
  on(canvas, 'webglcontextrestored', () => {
    window.clearTimeout(lostTimer);
    dead = false;
    run();
  });

  setMode(sceneMode, performance.now(), true);
  // The network wakes up with a short exchange, then settles into its quiet pace.
  bursts.push(
    { at: FIRST_JOB_DELAY },
    { at: FIRST_JOB_DELAY + 0.4 },
    { at: FIRST_JOB_DELAY + 0.9 },
  );
  draw(performance.now());
  canvas.classList.add('is-ready');
  run();
}

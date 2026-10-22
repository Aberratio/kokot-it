/**
 * The live Relay scene: loaded lazily (with three.js) by index.ts after the page has rendered.
 * Wires the page — sections, hovered offers and projects, the pointer, visibility — to the
 * pure logic (layouts, routing, quality) and the GPU renderer.
 *
 * Everything the scene holds is owned by one Lifecycle: an error at start-up, in a frame or in a
 * handler releases the renderer, the canvas, listeners and observers once, and the SVG still
 * takes over.
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
  toNdc,
  type RenderMode,
} from './input.ts';
import { CONVERGE_NODE, groupKind, layoutFor, type SceneMode } from './layouts.ts';
import { Lifecycle } from './lifecycle.ts';
import { cubicBezier, parseCubicBezier, snapshotPositions } from './morph.ts';
import { buildNetwork } from './network.ts';
import { FrameMonitor, initialLevel, LEVELS } from './quality.ts';
import { mulberry32, SCENE_SEED } from './relay-graph.ts';
import { RelayRenderer, type Split } from './renderer.ts';
import { Pacer, planRoute, Relay } from './routing.ts';

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

// Interaction timings. They describe behaviour, not motion style, so they are constants here
// rather than brand tokens; reduced motion never runs the code that uses them.
/** Seconds after the scene appears before autonomous work starts (the concept's "~1 s"). */
const FIRST_JOB_DELAY = 1;
/** How far from an agent (CSS px) a resting pointer still places an order: no dead gaps. */
const ORDER_REACH_PX = 120;
/** A pointer still for this long has placed its order; its glow then fades instead of lingering. */
const CURSOR_REST_MS = 2500;
/** How long a lost GPU context may take to come back before the still takes over. */
const CONTEXT_RESTORE_MS = 3000;

const nextTask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function readEase(name: string): (t: number) => number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return cubicBezier(...parseCubicBezier(value));
}

/** Starts the scene in `root`; calls `fallback` when WebGL fails, errors or is too slow. */
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
  const net = buildNetwork({ seed: SCENE_SEED, count: level.nodes });
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
  const life = new Lifecycle(fallback);
  life.add(() => {
    renderer.dispose();
  });
  life.add(() => {
    canvas.remove();
  });
  // Any error while wiring the page up ends like any other failure: released, still shown.
  life.guard(() => {
    wire();
  })();

  function wire(): void {
    renderer.resize(canvas.clientWidth, canvas.clientHeight);
    // Observable quality level (index into LEVELS) and mode, for checks in the browser.
    canvas.dataset['level'] = String(monitor.level);
    canvas.dataset['mode'] = mode;

    const rand = mulberry32(SCENE_SEED + 1);
    const relay = new Relay(net, { maxJobs: level?.maxJobs ?? 1, ease: easeSignal });
    const pacer = new Pacer(rand);
    const dwell = new DwellDetector();

    // ---- Sections → network state -----------------------------------------------------------
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
      return screenToWorld(
        point.x,
        point.y,
        canvas.clientWidth,
        canvas.clientHeight,
        renderer.frame,
      );
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

    // ---- Frame state --------------------------------------------------------------------------
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
        brightness: BRIGHTNESS[sceneMode],
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

    // ---- Wiring shared by the live loop and the still frame -----------------------------------
    let raf = 0;
    let last = 0;
    let visible = document.visibilityState === 'visible';
    let onScreen = true;
    let contextLost = false;
    life.add(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    });

    /** Adds a guarded listener that the lifecycle removes. */
    const on = (
      target: EventTarget,
      type: string,
      listener: (e: Event) => void,
      passive = true,
    ): void => {
      const guarded = life.guard(listener);
      target.addEventListener(type, guarded, { passive });
      life.add(() => {
        target.removeEventListener(type, guarded);
      });
    };
    const observe = <O extends IntersectionObserver | ResizeObserver>(observer: O): O => {
      life.add(() => {
        observer.disconnect();
      });
      return observer;
    };

    /** The section under the middle of the viewport, by layout (when observers cannot tell). */
    const centredMode = (): SceneMode | undefined => {
      const middle = window.innerHeight / 2;
      const index = sections.findIndex((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= middle && r.bottom > middle;
      });
      return index >= 0 ? sectionModes[index] : undefined;
    };

    /**
     * Reports the network state of the section crossing the middle of the viewport. A last
     * section shorter than half the screen (contact on a tall display) never reaches the middle,
     * so it also counts as active while it is fully in view.
     */
    const observeSections = (onChange: (mode: SceneMode) => void): void => {
      // While the last section is wholly in view it wins over the section at the middle line.
      let lastInView = false;
      const centre = observe(
        new IntersectionObserver(
          life.guard((entries: IntersectionObserverEntry[]) => {
            if (lastInView) return;
            for (const entry of entries) {
              const next = sectionModes[sections.indexOf(entry.target as HTMLElement)];
              if (entry.isIntersecting && next) onChange(next);
            }
          }),
          { rootMargin: '-50% 0px -50% 0px' },
        ),
      );
      for (const s of sections) centre.observe(s);
      const lastSection = sections.at(-1);
      const lastMode = sectionModes.at(-1);
      if (!lastSection || !lastMode) return;
      const whole = observe(
        new IntersectionObserver(
          life.guard(([entry]: IntersectionObserverEntry[]) => {
            if (!entry) return;
            const wasInView = lastInView;
            lastInView = entry.intersectionRatio >= 0.99;
            if (lastInView) onChange(lastMode);
            else if (wasInView) {
              const next = centredMode();
              if (next) onChange(next);
            }
          }),
          { threshold: [0.5, 0.99] },
        ),
      );
      whole.observe(lastSection);
    };

    /** Calls `onChange` whenever the device pixel ratio changes (zoom, a move to another screen). */
    const watchPixelRatio = (onChange: () => void): void => {
      const query = window.matchMedia(`(resolution: ${String(window.devicePixelRatio)}dppx)`);
      const listener = life.guard(() => {
        onChange();
        watchPixelRatio(onChange);
      });
      query.addEventListener('change', listener, { once: true });
      life.add(() => {
        query.removeEventListener('change', listener);
      });
    };

    // A lost GPU context that does not come back within a few seconds gives way to the still.
    let lostTimer = 0;
    let restored = (): void => {};
    life.add(() => {
      window.clearTimeout(lostTimer);
    });
    on(
      canvas,
      'webglcontextlost',
      (e) => {
        e.preventDefault();
        contextLost = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        lostTimer = window.setTimeout(() => {
          life.dispose();
        }, CONTEXT_RESTORE_MS);
      },
      false,
    );
    on(canvas, 'webglcontextrestored', () => {
      window.clearTimeout(lostTimer);
      contextLost = false;
      restored();
    });

    // ---- Still frame (prefers-reduced-motion) -------------------------------------------------
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
      restored = still;
      observeSections((next) => {
        if (next === sceneMode) return;
        // Re-forming becomes a cut: the new layout appears at once.
        setMode(next, performance.now(), true);
        still();
      });
      const refit = (): void => {
        renderer.resize(canvas.clientWidth, canvas.clientHeight);
        setMode(sceneMode, performance.now(), true);
        still();
      };
      observe(new ResizeObserver(life.guard(refit))).observe(canvas);
      watchPixelRatio(refit);
      setMode(sceneMode, performance.now(), true);
      still();
      canvas.classList.add('is-ready');
      return;
    }

    // ---- Live loop ----------------------------------------------------------------------------
    // The next frame is requested before the work; the guard disposes the lifecycle (which
    // cancels that request) if the work throws, so a broken frame never repeats.
    const loop = life.guard((now: number) => {
      raf = requestAnimationFrame(loop);
      const dtMs = last ? now - last : 16;
      last = now;
      const action = monitor.sample(dtMs);
      if (action === 'fallback') {
        life.dispose();
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
          dispatch(
            planRoute(sceneMode, net, { limit, rand, focus: focus >= 0 ? focus : undefined }),
          );
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
    });

    const run = (): void => {
      const should = visible && onScreen && !contextLost && !life.disposed;
      if (should && !raf) {
        last = 0;
        monitor.reset();
        raf = requestAnimationFrame(loop);
      } else if (!should && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    restored = run;

    // Pause in a hidden tab: the loop stops, not just idles. The canvas is a fixed backdrop, so
    // the observer below only matters when it is not rendered at all (print, a collapsed viewport).
    on(document, 'visibilitychange', () => {
      visible = document.visibilityState === 'visible';
      run();
    });
    observe(
      new IntersectionObserver(
        life.guard((entries: IntersectionObserverEntry[]) => {
          onScreen = entries.some((e) => e.isIntersecting);
          run();
        }),
      ),
    ).observe(canvas);

    observeSections((next) => {
      if (next !== sceneMode) setMode(next, performance.now());
    });

    let aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    const refit = (): void => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight);
      const next = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
      // Re-lay only when the shape really changed (rotation), not for a browser bar sliding away.
      if (Math.abs(next - aspect) / aspect > 0.15) {
        aspect = next;
        setMode(sceneMode, performance.now(), true);
      }
      if (!raf) draw(performance.now());
    };
    observe(new ResizeObserver(life.guard(refit))).observe(canvas);
    watchPixelRatio(refit);

    // The pointer is a client: it lights the agents near it and, when it rests, places an order.
    on(window, 'pointermove', (event) => {
      const e = event as PointerEvent;
      cursor = toNdc(e.clientX, e.clientY, canvas.clientWidth, canvas.clientHeight);
      if (e.pointerType === 'mouse') {
        cursorTarget = 1;
        lastMove = performance.now();
        dwell.move(e.clientX, e.clientY, lastMove);
      }
    });
    on(window, 'pointerdown', (event) => {
      const e = event as PointerEvent;
      if (e.pointerType === 'mouse') return;
      cursor = toNdc(e.clientX, e.clientY, canvas.clientWidth, canvas.clientHeight);
      cursorStrength = 1;
      cursorTarget = 0;
      dwell.tap(e.clientX, e.clientY);
    });
    on(document.documentElement, 'mouseleave', () => {
      cursorTarget = 0;
      dwell.leave();
    });

    // The active offer (P1–P3) lights its cluster; the active project runs a series of hand-offs
    // in its constellation. "Active" is hovered or focused; on touch screens, the card crossing
    // the middle of the viewport.
    interface ActiveCard {
      readonly card: HTMLElement;
      readonly mode: SceneMode;
      readonly group: number;
      readonly jobs: number;
    }
    const cards: ActiveCard[] = [];
    for (const offer of document.querySelectorAll<HTMLElement>('.offer')) {
      const code = /P(\d)/.exec(offer.querySelector('.offer__code')?.textContent ?? '');
      if (code?.[1]) {
        cards.push({ card: offer, mode: 'clusters', group: Number(code[1]) - 1, jobs: 2 });
      }
    }
    document.querySelectorAll<HTMLElement>('.cards > li').forEach((card, group) => {
      cards.push({ card, mode: 'constellations', group, jobs: 3 });
    });
    const activate = (active: ActiveCard): void => {
      if (sceneMode !== active.mode || focus === active.group) return;
      focus = active.group;
      for (let k = 0; k < active.jobs; k++)
        bursts.push({ at: time + k * 0.3, group: active.group });
    };
    const release = (): void => {
      focus = -1;
    };
    for (const active of cards) {
      const enter = (): void => {
        activate(active);
      };
      on(active.card, 'pointerenter', enter);
      on(active.card, 'focusin', enter);
      on(active.card, 'pointerleave', release);
      on(active.card, 'focusout', release);
    }
    if (window.matchMedia('(pointer: coarse)').matches) {
      const centreCard = observe(
        new IntersectionObserver(
          life.guard((entries: IntersectionObserverEntry[]) => {
            for (const e of entries) {
              const active = cards.find((c) => c.card === e.target);
              if (active && e.isIntersecting) activate(active);
            }
          }),
          { rootMargin: '-50% 0px -50% 0px' },
        ),
      );
      for (const active of cards) centreCard.observe(active.card);
    }

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
}

/**
 * Ownership of everything the live scene holds — the renderer, the canvas, listeners, observers,
 * the animation frame — so that any failure, at start-up or in a frame, ends the same way: all of
 * it released once, and the static still takes over. Without this, an exception inside the frame
 * loop repeats every frame (the next frame is requested before the work) and leaves the GPU held.
 */
export class Lifecycle {
  private cleanups: (() => void)[] = [];
  private done = false;
  private readonly handover: () => void;

  /** `handover` runs last, after every cleanup: typically "show the still". */
  constructor(handover: () => void) {
    this.handover = handover;
  }

  get disposed(): boolean {
    return this.done;
  }

  /** Registers a cleanup; after disposal it runs immediately. */
  add(cleanup: () => void): void {
    if (this.done) {
      Lifecycle.attempt(cleanup);
      return;
    }
    this.cleanups.push(cleanup);
  }

  /** Releases everything once, newest first; a failing cleanup does not stop the others. */
  dispose(): void {
    if (this.done) return;
    this.done = true;
    for (const cleanup of this.cleanups.reverse()) Lifecycle.attempt(cleanup);
    this.cleanups = [];
    Lifecycle.attempt(this.handover);
  }

  /** Wraps `fn` so that an exception disposes the lifecycle; once disposed, calls are ignored. */
  guard<A extends unknown[]>(fn: (...args: A) => unknown): (...args: A) => void {
    return (...args) => {
      if (this.done) return;
      try {
        fn(...args);
      } catch {
        this.dispose();
      }
    };
  }

  private static attempt(fn: () => void): void {
    try {
      fn();
    } catch {
      // Already released or never acquired: nothing left to free.
    }
  }
}

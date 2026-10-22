/**
 * Brand tokens for JavaScript. The values live only in tokens.css; this module reads them
 * (computed styles in the browser, parsed CSS in Node) so the 3D scene, the brand page and
 * the asset scripts never hardcode a colour or a duration.
 */
import { hexToNumber } from './color.ts';

/** CSS custom properties the scene depends on. */
export const SCENE_COLOR_TOKENS = {
  bg: '--scene-bg',
  node: '--scene-node',
  edge: '--scene-edge',
  pulseTask: '--scene-pulse-task',
  pulseResult: '--scene-pulse-result',
  cursor: '--scene-cursor',
} as const;

export type SceneColorName = keyof typeof SCENE_COLOR_TOKENS;

export interface SceneTokens {
  /** Colours as `0xrrggbb`, ready for `new THREE.Color(value)`. */
  readonly colors: Readonly<Record<SceneColorName, number>>;
  /** 1 normally, 0 under `prefers-reduced-motion: reduce` — multiply every animation speed by it. */
  readonly motionScale: number;
  /** Duration of the scene's re-wiring between page sections, in ms. */
  readonly transitionMs: number;
}

/** Looks up one custom property; returns '' when it is not defined. */
export type TokenReader = (name: string) => string;

/** Parses a CSS time (`1400ms`, `1.4s`) into milliseconds. */
export function parseDuration(value: string): number {
  const match = /^(-?\d*\.?\d+)(ms|s)$/.exec(value.trim());
  if (!match?.[1]) throw new Error(`Not a CSS duration: "${value}"`);
  const n = Number(match[1]);
  return match[2] === 's' ? n * 1000 : n;
}

function required(read: TokenReader, name: string): string {
  const value = read(name).trim();
  if (value === '') throw new Error(`Missing brand token ${name} (src/styles/tokens.css)`);
  return value;
}

/** Builds the scene's tokens from any reader (computed style, parsed CSS, a test double). */
export function readSceneTokens(read: TokenReader): SceneTokens {
  const colors = Object.fromEntries(
    Object.entries(SCENE_COLOR_TOKENS).map(([key, name]) => [
      key,
      hexToNumber(required(read, name)),
    ]),
  ) as Record<SceneColorName, number>;
  const motionScale = Number(required(read, '--motion-scale'));
  if (!Number.isFinite(motionScale)) throw new Error('--motion-scale is not a number');
  return { colors, motionScale, transitionMs: parseDuration(required(read, '--duration-scene')) };
}

/** Browser: the scene's tokens as currently computed on `<html>` (theme and media queries applied). */
export function sceneTokensFromDocument(root: Element = document.documentElement): SceneTokens {
  const style = getComputedStyle(root);
  return readSceneTokens((name) => style.getPropertyValue(name));
}

/**
 * Node: the custom properties declared in `css` for a top-level rule whose selector is exactly
 * `selector`. Rules inside at-rules (`@media` …) are ignored. Values are returned unresolved.
 */
export function parseCustomProperties(css: string, selector = ':root'): Map<string, string> {
  const props = new Map<string, string>();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let start = 0;
  let current: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) {
        const head = text.slice(start, i).trim();
        current = head.startsWith('@') ? null : head;
        start = i + 1;
      }
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        if (current === selector) {
          for (const decl of text.slice(start, i).split(';')) {
            const colon = decl.indexOf(':');
            const name = decl.slice(0, colon).trim();
            if (colon > 0 && name.startsWith('--')) {
              props.set(
                name,
                decl
                  .slice(colon + 1)
                  .trim()
                  .replace(/\s+/g, ' '),
              );
            }
          }
        }
        current = null;
        start = i + 1;
      }
    } else if (ch === ';' && depth === 0) {
      start = i + 1; // top-level statements such as @import
    }
  }
  return props;
}

/** Selector of the light print theme in tokens.css. */
export const PAPER_THEME_SELECTOR = "[data-theme='paper']";

/** Node: readers for both themes (dark screen default, paper) from the text of tokens.css. */
export function themeReaders(css: string): { dark: TokenReader; paper: TokenReader } {
  const base = parseCustomProperties(css, ':root');
  return {
    dark: resolvingReader(base),
    paper: resolvingReader(base, parseCustomProperties(css, PAPER_THEME_SELECTOR)),
  };
}

/** Node: a reader over parsed properties that resolves `var(--x)` references (no fallbacks). */
export function resolvingReader(...layers: ReadonlyMap<string, string>[]): TokenReader {
  const merged = new Map<string, string>();
  for (const layer of layers) for (const [k, v] of layer) merged.set(k, v);
  const read = (name: string, seen: ReadonlySet<string> = new Set()): string => {
    if (seen.has(name)) throw new Error(`Circular token reference at ${name}`);
    const value = merged.get(name) ?? '';
    return value.replace(/var\((--[\w-]+)\)/g, (_, ref: string) =>
      read(ref, new Set([...seen, name])),
    );
  };
  return (name) => read(name);
}

/** A text/background pair the brand promises to keep readable, with its WCAG threshold. */
export interface ContrastPair {
  readonly fg: string;
  readonly bg: string;
  /** 4.5 for body text (AA), 3 for large text and UI parts (AA large / 1.4.11). */
  readonly min: number;
  readonly use: string;
}

const TEXT_ON = (bg: string): ContrastPair[] => [
  { fg: '--color-text', bg, min: 4.5, use: 'text' },
  { fg: '--color-text-muted', bg, min: 4.5, use: 'secondary text' },
  { fg: '--color-text-subtle', bg, min: 4.5, use: 'captions, meta' },
  { fg: '--color-accent', bg, min: 4.5, use: 'accent text, focus' },
  { fg: '--color-accent-2', bg, min: 4.5, use: 'links' },
];

/** Every pair checked by the tests and listed in brand.md / the brand page, per theme. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  ...TEXT_ON('--color-bg'),
  ...TEXT_ON('--color-surface'),
  ...TEXT_ON('--color-surface-raised'),
  { fg: '--color-on-accent', bg: '--color-accent', min: 4.5, use: 'button label' },
  { fg: '--color-success', bg: '--color-bg', min: 4.5, use: 'status text' },
  { fg: '--color-warning', bg: '--color-bg', min: 4.5, use: 'status text' },
  { fg: '--color-danger', bg: '--color-bg', min: 4.5, use: 'status text' },
  { fg: '--color-focus', bg: '--color-bg', min: 3, use: 'focus ring (1.4.11)' },
];

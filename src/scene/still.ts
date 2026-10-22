/**
 * The static still of the Relay network (docs/concept.md, "Fallbacki"): the deterministic
 * 2D graph from relay-graph.ts drawn as SVG with the scene tokens. Shown when WebGL is missing,
 * lost, or too slow even at the lowest quality, and on the /brand/ page.
 */
import { relayGraph, type RelayGraph } from './relay-graph.ts';

export const STILL_SEED = 2026;

const PULSE_COLOR = {
  task: 'var(--scene-pulse-task)',
  result: 'var(--scene-pulse-result)',
} as const;

const escapeXml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const r = (n: number): string => String(Math.round(n * 10) / 10);

export interface StillOptions {
  /** Prefix for gradient ids, unique per document. */
  readonly id: string;
  /** Accessible name; without it the still is decoration (aria-hidden). */
  readonly title?: string;
  /** `preserveAspectRatio`, e.g. `xMidYMid slice` for a full-screen background. */
  readonly fit?: string;
}

export function relayStillMarkup(
  graph: RelayGraph,
  width: number,
  height: number,
  options: StillOptions,
): string {
  const { id, title, fit } = options;
  const a11y = title ? `role="img"><title>${escapeXml(title)}</title>` : `aria-hidden="true">`;
  const ratio = fit ? ` preserveAspectRatio="${fit}"` : '';
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}"${ratio} ${a11y}`,
    '<defs>',
  ];
  for (const kind of ['task', 'result'] as const) {
    const color = PULSE_COLOR[kind];
    out.push(
      `<radialGradient id="${id}-glow-${kind}"><stop offset="0" stop-color="${color}" stop-opacity="0.55"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`,
    );
  }
  out.push('</defs>', '<g stroke="var(--scene-edge)" stroke-width="1">');
  for (const e of graph.edges) {
    const a = graph.nodes[e.a];
    const b = graph.nodes[e.b];
    if (a && b) {
      out.push(`<line class="e" x1="${r(a.x)}" y1="${r(a.y)}" x2="${r(b.x)}" y2="${r(b.y)}"/>`);
    }
  }
  const lit: string[] = [];
  const heads: string[] = [];
  for (const p of graph.pulses) {
    const e = graph.edges[p.edge];
    const a = e && graph.nodes[e.a];
    const b = e && graph.nodes[e.b];
    if (!a || !b) continue;
    const x = a.x + (b.x - a.x) * p.t;
    const y = a.y + (b.y - a.y) * p.t;
    const color = PULSE_COLOR[p.kind];
    // The travelled part of the edge lights up behind the pulse.
    lit.push(
      `<line class="a" x1="${r(a.x)}" y1="${r(a.y)}" x2="${r(x)}" y2="${r(y)}" stroke="${color}" stroke-opacity="0.55"/>`,
    );
    heads.push(
      `<circle cx="${r(x)}" cy="${r(y)}" r="16" fill="url(#${id}-glow-${p.kind})"/>`,
      `<circle class="p" cx="${r(x)}" cy="${r(y)}" r="3" fill="${color}"/>`,
    );
  }
  out.push('</g>', '<g stroke-width="1.5" stroke-linecap="round">', ...lit, '</g>');
  out.push('<g fill="var(--scene-node)">');
  for (const n of graph.nodes) {
    out.push(
      `<circle class="n" cx="${r(n.x)}" cy="${r(n.y)}" r="${r(1.6 + n.weight * 2.6)}" fill-opacity="${r(0.35 + n.weight * 0.65)}"/>`,
    );
  }
  out.push('</g>', '<g>', ...heads, '</g>', '</svg>');
  return out.join('');
}

/** The still's graph for a viewport: same seed, density by area, shaped like the screen. */
export function stillGraph(
  viewportWidth: number,
  viewportHeight: number,
): { graph: RelayGraph; width: number; height: number } {
  const wide = viewportWidth >= viewportHeight;
  const width = wide ? 1600 : 800;
  const height = wide ? 900 : 1400;
  const count = wide ? 72 : 44;
  return {
    graph: relayGraph({ seed: STILL_SEED, count, width, height, links: 2, pulses: 9 }),
    width,
    height,
  };
}

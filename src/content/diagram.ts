import { escapeHtml as e } from './html.ts';
import type { DiagramNode, FlowDiagram } from './types.ts';

// Inline SVG flow diagram, drawn at build time from the content dictionaries. It holds no
// colour or font of its own: every paint comes from the brand tokens through the `.fd-*`
// classes in content.css, so it follows the dark screen theme and the paper print theme alike.
// Labels are real <text>, so they stay selectable and translatable.

/** Layout in viewBox units. The drawing is narrow on purpose: it reads at phone width. */
export const LAYOUT = {
  width: 380,
  pad: 8,
  mainX: 8,
  mainWidth: 328,
  columnGap: 12,
  nodeHeight: 66,
  rowGap: 28,
  railX: 352,
  railLabelX: 362,
} as const;

interface Box {
  node: DiagramNode;
  x: number;
  y: number;
  w: number;
}

function layoutRows(rows: readonly DiagramNode[][]): Box[][] {
  const { pad, mainX, mainWidth, columnGap, nodeHeight, rowGap } = LAYOUT;
  return rows.map((row, i) => {
    const w = (mainWidth - columnGap * (row.length - 1)) / row.length;
    const y = pad + i * (nodeHeight + rowGap);
    return row.map((node, j) => ({ node, x: mainX + j * (w + columnGap), y, w }));
  });
}

export function diagramHeight(rowCount: number): number {
  const { pad, nodeHeight, rowGap } = LAYOUT;
  return pad * 2 + rowCount * nodeHeight + Math.max(0, rowCount - 1) * rowGap;
}

const center = (b: Box): number => b.x + b.w / 2;
const n = (value: number): string => String(Math.round(value * 10) / 10);

/** Edges between consecutive rows: side-by-side rows pair up, otherwise every node meets every node. */
function edges(rows: Box[][], id: string): string[] {
  const out: string[] = [];
  for (let i = 0; i + 1 < rows.length; i++) {
    const from = rows[i] ?? [];
    const to = rows[i + 1] ?? [];
    const pairs: [Box, Box][] =
      from.length === to.length && from.length > 1
        ? from.map((a, j) => [a, to[j] ?? a])
        : from.flatMap((a) => to.map((b): [Box, Box] => [a, b]));
    for (const [a, b] of pairs) {
      const x1 = center(a);
      const y1 = a.y + LAYOUT.nodeHeight;
      const x2 = center(b);
      const y2 = b.y - 3; // leave room for the arrow head
      const mid = (y1 + y2) / 2;
      const d =
        x1 === x2
          ? `M${n(x1)} ${n(y1)}V${n(y2)}`
          : `M${n(x1)} ${n(y1)}C${n(x1)} ${n(mid)} ${n(x2)} ${n(mid)} ${n(x2)} ${n(y2)}`;
      out.push(`<path class="fd-edge" d="${d}" marker-end="url(#${id}-arrow)"/>`);
    }
  }
  return out;
}

function node(b: Box): string {
  const tx = b.x + 14;
  return [
    `<g class="fd-node">`,
    `<rect class="fd-box" x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${String(LAYOUT.nodeHeight)}" rx="8"/>`,
    `<text class="fd-label" x="${n(tx)}" y="${n(b.y + 24)}">${e(b.node.label)}</text>`,
    `<text class="fd-skill" x="${n(tx)}" y="${n(b.y + 42)}">${e(b.node.skill)}</text>`,
    `<text class="fd-note" x="${n(tx)}" y="${n(b.y + 58)}">${e(b.node.note)}</text>`,
    `</g>`,
  ].join('');
}

/** The side rail: the branch's decision ledger, with a tick per row that writes or reads it. */
function rail(rows: Box[][], label: string, id: string): string {
  const { railX, railLabelX, nodeHeight } = LAYOUT;
  const linked = rows.filter((row) => row.some((b) => b.node.ledger));
  const first = linked[0]?.[0];
  const last = linked.at(-1)?.[0];
  if (!first || !last) return '';
  const top = first.y;
  const bottom = last.y + nodeHeight;
  const ticks = linked.map((row) => {
    const edge = row.at(-1);
    if (!edge) return '';
    const y = edge.y + nodeHeight / 2;
    const x = edge.x + edge.w;
    const writes = row.some((b) => b.node.ledger === 'write');
    // Writes point at the ledger, reads point back at the step.
    const d = writes ? `M${n(x)} ${n(y)}H${n(railX - 4)}` : `M${n(railX)} ${n(y)}H${n(x + 4)}`;
    return `<path class="fd-tick" d="${d}" marker-end="url(#${id}-dot)"/>`;
  });
  const mid = (top + bottom) / 2;
  return [
    `<g class="fd-rail">`,
    `<path class="fd-rail-line" d="M${n(railX)} ${n(top)}V${n(bottom)}"/>`,
    ...ticks,
    `<text class="fd-rail-label" x="${n(railLabelX)}" y="${n(mid)}" text-anchor="middle" transform="rotate(90 ${n(railLabelX)} ${n(mid)})">${e(label)}</text>`,
    `</g>`,
  ].join('');
}

/**
 * The diagram as an accessible inline SVG: role="img", named by its <title> and described by
 * its <desc>. `id` prefixes the element ids, so it must be unique on the page.
 */
export function renderFlowDiagram(diagram: FlowDiagram, id = 'flow-diagram'): string {
  const rows = layoutRows(diagram.rows);
  const height = diagramHeight(diagram.rows.length);
  return [
    `<svg class="flow-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(LAYOUT.width)} ${String(height)}" role="img" aria-labelledby="${id}-title ${id}-desc">`,
    `<title id="${id}-title">${e(diagram.title)}</title>`,
    `<desc id="${id}-desc">${e(diagram.desc)}</desc>`,
    `<defs>`,
    `<marker id="${id}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="fd-arrow" d="M0 0L10 5L0 10z"/></marker>`,
    `<marker id="${id}-dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"><circle class="fd-dot" cx="5" cy="5" r="5"/></marker>`,
    `</defs>`,
    ...edges(rows, id),
    rail(rows, diagram.rail, id),
    ...rows.flat().map(node),
    `</svg>`,
  ].join('');
}

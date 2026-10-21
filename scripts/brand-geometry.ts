// Geometry of the kokot.it wordmark and sign: monoline strokes on a fixed grid plus round
// "nodes". Pure data, so the shapes can be tested and rendered in any colour.
//
// Grid (units): baseline 24, x-height top 12, ascender top 3.5, stroke 2.6.
// The two dots of "kokot.it" (the full stop and the i's tittle) are the accent nodes —
// the network of the 3D scene, reduced to two points of the name.

export interface GeometryNode {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  /** Drawn in the accent colour. */
  readonly accent: boolean;
}

export interface Geometry {
  readonly viewBox: readonly [x: number, y: number, w: number, h: number];
  readonly stroke: number;
  /** Stroke centrelines, SVG path data. */
  readonly strokes: readonly string[];
  readonly nodes: readonly GeometryNode[];
  /** Pixel size of one unit in the SVG's default width/height. */
  readonly pxPerUnit: number;
  /** Corner radius of the background tile, when one is drawn. */
  readonly tileRadius: number;
}

const STROKE = 2.6;
const HALF = STROKE / 2; // round caps reach this far past a path's end
const BASE = 24;
const X_TOP = 12;
const ASC = 3.5;
const DOT_R = 1.75; // nodes are a little heavier than the stroke so they read as points

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const pt = (x: number, y: number): string => `${String(round3(x))} ${String(round3(y))}`;

interface Glyph {
  readonly width: number;
  readonly strokes: (x: number) => string[];
  readonly nodes?: (x: number) => GeometryNode[];
}

const k: Glyph = {
  width: 9.4,
  strokes: (x) => {
    const armStart = { x: x + HALF, y: 19.4 };
    const armEnd = { x: x + 9.4 - HALF, y: X_TOP + HALF };
    // The leg leaves the arm, not the stem: one branching point, like a node in the graph.
    const legAt = 0.42;
    const legStart = {
      x: armStart.x + (armEnd.x - armStart.x) * legAt,
      y: armStart.y + (armEnd.y - armStart.y) * legAt,
    };
    return [
      `M${pt(x + HALF, ASC + HALF)}V${String(round3(BASE - HALF))}`,
      `M${pt(armStart.x, armStart.y)}L${pt(armEnd.x, armEnd.y)}`,
      `M${pt(legStart.x, legStart.y)}L${pt(x + 9.4 - HALF, BASE - HALF)}`,
    ];
  },
};

const o: Glyph = {
  width: 12,
  strokes: (x) => {
    const rad = 6 - HALF;
    const cx = x + 6;
    const cy = (X_TOP + BASE) / 2;
    return [
      `M${pt(cx - rad, cy)}a${String(round3(rad))} ${String(round3(rad))} 0 1 0 ${String(round3(rad * 2))} 0` +
        `a${String(round3(rad))} ${String(round3(rad))} 0 1 0 ${String(round3(-rad * 2))} 0`,
    ];
  },
};

const t: Glyph = {
  width: 7.4,
  strokes: (x) => {
    const stem = x + 2.9;
    const foot = 2.9;
    return [
      `M${pt(stem, 6.4)}V${String(round3(BASE - HALF - foot))}` +
        `a${String(foot)} ${String(foot)} 0 0 0 ${String(foot)} ${String(foot)}` +
        `H${String(round3(x + 7.4 - HALF))}`,
      `M${pt(x + HALF, X_TOP + HALF)}H${String(round3(x + 7.4 - HALF))}`,
    ];
  },
};

const dot: Glyph = {
  width: DOT_R * 2,
  strokes: () => [],
  nodes: (x) => [{ cx: round3(x + DOT_R), cy: round3(BASE - DOT_R), r: DOT_R, accent: true }],
};

const i: Glyph = {
  width: DOT_R * 2,
  strokes: (x) => [`M${pt(x + DOT_R, X_TOP + HALF)}V${String(round3(BASE - HALF))}`],
  nodes: (x) => [{ cx: round3(x + DOT_R), cy: round3(ASC + 3.6), r: DOT_R, accent: true }],
};

/** Letters of "kokot.it" with the space after each one (optical kerning, in units). */
const WORD: readonly (readonly [Glyph, number])[] = [
  [k, 1.6],
  [o, 2.4],
  [k, 1.6],
  [o, 1.9],
  [t, 1.5],
  [dot, 2.1],
  [i, 2.1],
  [t, 0],
];

export function wordmarkGeometry(): Geometry {
  const strokes: string[] = [];
  const nodes: GeometryNode[] = [];
  let x = 0;
  for (const [glyph, space] of WORD) {
    strokes.push(...glyph.strokes(x));
    nodes.push(...(glyph.nodes?.(x) ?? []));
    x += glyph.width + space;
  }
  return {
    viewBox: [0, ASC, round3(x), BASE - ASC],
    stroke: STROKE,
    strokes,
    nodes,
    pxPerUnit: 8,
    tileRadius: 0,
  };
}

/**
 * The sign: the "k" redrawn as a graph — a stem between two agents and a hub (accent) from
 * which two edges fan out to two more agents. Fits a 32-unit square.
 */
export function markGeometry(options: { tile?: boolean; square?: boolean } = {}): Geometry {
  const stem = 9.5;
  const hub = { x: stem, y: 18 };
  const top = { x: stem, y: 6.5 };
  const bottom = { x: stem, y: 25.5 };
  const up = { x: 22.5, y: 9 };
  const down = { x: 22.5, y: 25.5 };
  const nodeR = 2.5;
  const strokes = [
    `M${pt(top.x, top.y)}V${String(bottom.y)}`,
    `M${pt(hub.x, hub.y)}L${pt(up.x, up.y)}`,
    `M${pt(hub.x, hub.y)}L${pt(down.x, down.y)}`,
  ];
  const nodes: GeometryNode[] = [
    { cx: top.x, cy: top.y, r: nodeR, accent: false },
    { cx: bottom.x, cy: bottom.y, r: nodeR, accent: false },
    { cx: up.x, cy: up.y, r: nodeR, accent: false },
    { cx: down.x, cy: down.y, r: nodeR, accent: false },
    { cx: hub.x, cy: hub.y, r: 3.4, accent: true },
  ];
  return {
    viewBox: [0, 0, 32, 32],
    stroke: 2.4,
    strokes,
    nodes,
    pxPerUnit: 1,
    tileRadius: options.tile && !options.square ? 7 : 0,
  };
}

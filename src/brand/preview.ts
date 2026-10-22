// Brand preview page (/brand/, noindex): fills in values read from the live tokens, so the
// page can never drift from tokens.css.
import '../styles/main.css';
import './preview.css';
import tokensCss from '../styles/tokens.css?raw';
import { contrastRatio } from '../styles/color.ts';
import { relayGraph, SCENE_SEED } from '../scene/relay-graph.ts';
import { relayStillMarkup } from '../scene/still.ts';
import { CONTRAST_PAIRS, themeReaders } from '../styles/tokens.ts';

const themes = themeReaders(tokensCss);

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// Swatches: token name and resolved hex under the swatch.
for (const swatch of document.querySelectorAll<HTMLElement>('[data-token]')) {
  const token = swatch.dataset.token ?? '';
  swatch.style.setProperty('--swatch', `var(${token})`);
  swatch.append(
    el('span', 'bp-swatch-chip'),
    el('span', 'bp-swatch-name', swatch.dataset.name ?? ''),
    el('code', 'bp-swatch-meta', `${token}  ${themes.dark(token)}`),
  );
}

// Contrast matrix (text tokens × backgrounds) plus the special pairs, computed from the same
// CONTRAST_PAIRS the tests enforce.
const BACKGROUNDS = ['--color-bg', '--color-surface', '--color-surface-raised'];
const short = (token: string): string => token.replace('--color-', '');

function cell(fg: string, bg: string, min: number, label = ''): HTMLTableCellElement {
  const ratio = contrastRatio(fg, bg);
  const td = el('td', ratio >= min ? 'bp-cell' : 'bp-cell bp-fail');
  td.style.color = fg;
  td.style.background = bg;
  td.append(
    el('span', 'bp-cell-ratio', ratio.toFixed(2)),
    el(
      'span',
      'bp-cell-grade',
      (label ? label + ' · ' : '') + (ratio >= 7 ? 'AAA' : ratio >= min ? 'AA' : 'FAIL'),
    ),
  );
  return td;
}

for (const table of document.querySelectorAll<HTMLTableElement>('[data-contrast]')) {
  const read = table.dataset.contrast === 'paper' ? themes.paper : themes.dark;
  const head = el('tr', '');
  head.append(el('th', ''), ...BACKGROUNDS.map((bg) => el('th', '', short(bg))));
  table.append(head);
  const grid = CONTRAST_PAIRS.filter((p) => BACKGROUNDS.includes(p.bg));
  const rows = [...new Set(grid.map((p) => p.fg))];
  for (const fg of rows) {
    const tr = el('tr', '');
    const name = el('th', '');
    name.append(
      el('code', '', short(fg)),
      el('span', 'bp-contrast-use', grid.find((p) => p.fg === fg)?.use ?? ''),
    );
    tr.append(name);
    for (const bg of BACKGROUNDS) {
      const pair = grid.find((p) => p.fg === fg && p.bg === bg);
      tr.append(pair ? cell(read(fg), read(bg), pair.min) : el('td', ''));
    }
    table.append(tr);
  }
  const special = el('tr', '');
  special.append(el('th', '', 'inne'));
  const others = CONTRAST_PAIRS.filter((p) => !BACKGROUNDS.includes(p.bg) || !rows.includes(p.fg));
  const wrap = el('td', 'bp-others');
  wrap.colSpan = BACKGROUNDS.length;
  for (const p of others) {
    const chip = el('span', 'bp-other');
    const ratio = contrastRatio(read(p.fg), read(p.bg));
    chip.style.color = read(p.fg);
    chip.style.background = read(p.bg);
    chip.textContent = `${short(p.fg)} / ${short(p.bg)} ${ratio.toFixed(2)}${ratio >= p.min ? '' : ' FAIL'}`;
    chip.title = p.use;
    wrap.append(chip);
  }
  special.append(wrap);
  table.append(special);
}

// Spacing scale.
const spaces = document.querySelector('[data-spaces]');
for (let i = 1; i <= 10; i++) {
  const token = `--space-${String(i)}`;
  const row = el('div', 'bp-space');
  const bar = el('span', 'bp-space-bar');
  bar.style.width = `var(${token})`;
  const px = Number.parseFloat(themes.dark(token)) * 16;
  row.append(
    el('code', '', `space-${String(i)}`),
    bar,
    el('span', 'bp-space-px', `${String(px)} px`),
  );
  spaces?.append(row);
}

// Motion samples.
for (const item of document.querySelectorAll<HTMLElement>('[data-duration]')) {
  const token = item.dataset.duration ?? '';
  item.style.setProperty('--d', `var(${token})`);
  item.append(el('code', '', themes.dark(token)));
}

// Relay still: the scene's seed layout, drawn with the scene tokens (shared with the no-WebGL fallback).
const still = document.querySelector('[data-relay-still]');
if (still) {
  const width = 640;
  const height = 520;
  const graph = relayGraph({ seed: SCENE_SEED, count: 46, width, height, links: 3, pulses: 10 });
  still.innerHTML = relayStillMarkup(graph, width, height, {
    id: 'brand-still',
    title: 'Sieć agentów: węzły, połączenia i impulsy w drodze',
  });
}

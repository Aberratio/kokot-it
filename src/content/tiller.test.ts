import { describe, expect, it } from 'vitest';
import { LOCALES, type Locale } from '../i18n/index.ts';
import { diagramHeight, LAYOUT, renderFlowDiagram } from './diagram.ts';
import { contentViolations, readableText } from './guards.ts';
import { content, escapeHtml, renderPage } from './render.ts';
import { REPOS, type CaseStudy, type FlowDiagram } from './types.ts';

// The tiller case study (T-12): a diagram, an illustrative session log and facts from the public
// repository. These tests pin what the page promises: an accessible diagram drawn on brand
// tokens, a log that says it is an illustration and follows the skills' real order, and no
// private name, path or credential anywhere on the page.

const study = (locale: Locale): CaseStudy => content(locale).caseStudies.tiller;
const page = (locale: Locale): string => {
  const { head, body } = renderPage({ locale, page: 'project', slug: 'tiller' });
  return `${head}\n${body}`;
};
const diagramOf = (locale: Locale): FlowDiagram => {
  const diagram = study(locale).flow?.diagram;
  if (!diagram) throw new Error(`${locale}: the tiller case study has no diagram`);
  return diagram;
};
const svgOf = (html: string): string => /<svg[\s\S]*?<\/svg>/.exec(html)?.[0] ?? '';

describe('tiller case study sections', () => {
  it.each(LOCALES)('%s has the diagram, the transcript and the results', (locale) => {
    const s = study(locale);
    expect(s.flow?.diagram).toBeDefined();
    expect(s.transcript).toBeDefined();
    expect(s.results).toBeDefined();
    const html = page(locale);
    for (const id of ['problem', 'solution', 'flow', 'demo', 'results', 'stack', 'repo']) {
      expect(html).toContain(`id="${id}-title"`);
    }
    for (const lesson of s.results?.lessons ?? []) expect(html).toContain(escapeHtml(lesson.title));
    for (const fact of s.results?.facts ?? []) expect(html).toContain(escapeHtml(fact.label));
  });

  it.each(LOCALES)('%s links the public tiller repository', (locale) => {
    expect(REPOS.tiller).toEqual({ name: 'Aberratio/tiller', public: true });
    expect(page(locale)).toContain('href="https://github.com/Aberratio/tiller"');
  });

  it('keeps the diagram rows, ledger marks and skill names identical in PL and EN', () => {
    const skeleton = (d: FlowDiagram): string[][] =>
      d.rows.map((row) => row.map((n) => `${n.skill}:${n.ledger ?? '-'}`));
    // `step −1` is translated; every other skill name is code and must not be.
    const strip = (rows: string[][]): string[][] =>
      rows.map((row) => row.map((cell) => (cell.startsWith('flow-') ? cell : '·')));
    expect(strip(skeleton(diagramOf('en')))).toEqual(strip(skeleton(diagramOf('pl'))));
    expect(
      skeleton(diagramOf('en'))
        .flat()
        .filter((c) => c.endsWith(':write')),
    ).toEqual(
      skeleton(diagramOf('pl'))
        .flat()
        .filter((c) => c.endsWith(':write')),
    );
  });
});

describe('tiller flow diagram', () => {
  it.each(LOCALES)('%s is an accessible inline SVG with a title and a description', (locale) => {
    const d = diagramOf(locale);
    const svg = svgOf(page(locale));
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="flow-diagram-title flow-diagram-desc"');
    expect(svg).toContain(`<title id="flow-diagram-title">${escapeHtml(d.title)}</title>`);
    expect(svg).toContain(`<desc id="flow-diagram-desc">${escapeHtml(d.desc)}</desc>`);
    expect(d.title.trim().length).toBeGreaterThan(10);
    // The description has to carry the whole flow for a reader who cannot see it.
    expect(d.desc.length).toBeGreaterThan(200);
    expect(svg.match(/<title[\s>]/g)).toHaveLength(1);
    expect(svg.match(/<desc[\s>]/g)).toHaveLength(1);
  });

  it.each(LOCALES)('%s writes every label as SVG text', (locale) => {
    const d = diagramOf(locale);
    const svg = svgOf(page(locale));
    const texts = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    for (const node of d.rows.flat()) {
      for (const value of [node.label, node.skill, node.note])
        expect(texts).toContain(escapeHtml(value));
    }
    expect(texts).toContain(escapeHtml(d.rail));
  });

  it.each(LOCALES)('%s paints only through brand-token classes', (locale) => {
    const svg = svgOf(page(locale));
    // No colour, font or inline style of its own: content.css maps the .fd-* classes to tokens.
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}\b(?!-)/i);
    expect(svg).not.toMatch(/\s(?:fill|stroke|style|font-family|font-size|color)=/);
    expect(svg).not.toMatch(/rgb\(|hsl\(/);
  });

  it('draws one box per node, an arrow between consecutive rows and fits its view box', () => {
    const d = diagramOf('pl');
    const svg = renderFlowDiagram(d, 'x');
    const nodes = d.rows.flat().length;
    expect(svg.match(/<rect class="fd-box"/g)).toHaveLength(nodes);
    // Single rows chain with one edge; a two-node row fans out from and back into one node.
    let expected = 0;
    for (let i = 0; i + 1 < d.rows.length; i++) {
      const a = d.rows[i]?.length ?? 0;
      const b = d.rows[i + 1]?.length ?? 0;
      expected += a === b && a > 1 ? a : a * b;
    }
    expect(svg.match(/class="fd-edge"/g)).toHaveLength(expected);
    expect(svg).toContain(
      `viewBox="0 0 ${String(LAYOUT.width)} ${String(diagramHeight(d.rows.length))}"`,
    );
    for (const m of svg.matchAll(
      /<rect class="fd-box" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/g,
    )) {
      expect(Number(m[1]) + Number(m[3])).toBeLessThanOrEqual(LAYOUT.railX);
      expect(Number(m[2]) + LAYOUT.nodeHeight).toBeLessThanOrEqual(diagramHeight(d.rows.length));
    }
    // Markers are prefixed with the diagram id, so two diagrams on one page cannot collide.
    expect(svg).toContain('<marker id="x-arrow"');
    expect(svg).toContain('url(#x-arrow)');
    expect(svg).not.toContain('url(#flow-diagram-');
  });

  it('marks the ledger rail with one tick per row that writes or reads it', () => {
    const d = diagramOf('en');
    const svg = renderFlowDiagram(d);
    const linked = d.rows.filter((row) => row.some((n) => n.ledger)).length;
    expect(linked).toBeGreaterThan(1);
    expect(svg.match(/class="fd-tick"/g)).toHaveLength(linked);
  });

  // SVG text does not wrap. Glyph widths here are generous averages for the brand fonts at the
  // sizes content.css sets (Schibsted Grotesk 15px semibold and 13px, JetBrains Mono 12px), so a
  // translation that would spill out of its box fails here before it reaches a screenshot.
  it.each(LOCALES)('%s keeps every label inside its box', (locale) => {
    const d = diagramOf(locale);
    const inner = (count: number): number =>
      (LAYOUT.mainWidth - LAYOUT.columnGap * (count - 1)) / count - 20;
    for (const row of d.rows) {
      for (const node of row) {
        const room = inner(row.length);
        expect(node.label.length * 8.6, node.label).toBeLessThanOrEqual(room);
        expect(node.skill.length * 7.3, node.skill).toBeLessThanOrEqual(room);
        expect(node.note.length * 6.6, node.note).toBeLessThanOrEqual(room);
      }
    }
    const railLength = 5 * LAYOUT.nodeHeight + 4 * LAYOUT.rowGap;
    expect(d.rail.length * 6.7).toBeLessThanOrEqual(railLength);
  });
});

describe('tiller sample run', () => {
  // The order the skills hand work on in tiller's README ("One ticket, by hand").
  const ORDER = [
    '/flow-start-ticket',
    '/flow-plan-ticket',
    '/flow-tdd',
    '/flow-code-review',
    '/flow-create-commit',
    '/flow-create-pull-request',
    '/flow-confidence-check',
  ];

  it.each(LOCALES)('%s follows the skills in the order they hand on', (locale) => {
    const commands = study(locale).transcript?.entries.map((x) => x.command.split(' ')[0]);
    expect(commands).toEqual(ORDER);
  });

  it('runs the same commands with the same line tones in PL and EN', () => {
    const shape = (locale: Locale): string[] =>
      study(locale).transcript?.entries.map(
        (x) => `${x.command} ${x.output.map((l) => l.tone).join(',')}`,
      ) ?? [];
    expect(shape('en')).toEqual(shape('pl'));
  });

  it.each(LOCALES)('%s shows a red before a green and ends in a verdict', (locale) => {
    const lines = study(locale).transcript?.entries.flatMap((x) => x.output) ?? [];
    const firstRed = lines.findIndex((l) => l.tone === 'red');
    const firstGreen = lines.findIndex((l) => l.tone === 'green');
    expect(firstRed).toBeGreaterThanOrEqual(0);
    expect(firstRed).toBeLessThan(firstGreen);
    // Colour is never the only cue: red lines carry ✗, test-run green lines ✓.
    for (const l of lines.filter((x) => x.tone === 'red')) expect(l.text).toMatch(/^✗ /);
    expect(lines.at(-2)?.text).toMatch(/high-confidence/);
  });

  it.each(LOCALES)('%s says plainly that the run is an illustration', (locale) => {
    const t = study(locale).transcript;
    const html = page(locale);
    expect(t?.label).toMatch(locale === 'pl' ? /ilustracyjny/ : /illustrative/i);
    expect(html).toContain(
      `<p class="eyebrow transcript__label">${escapeHtml(t?.label ?? '')}</p>`,
    );
    expect(t?.intro).toMatch(locale === 'pl' ? /[Ff]ikcyjny/ : /fictional/);
    expect(t?.note).toMatch(locale === 'pl' ? /nie jest nagranie/ : /not a recording/);
  });
});

describe('tiller results', () => {
  it.each(LOCALES)('%s gives every fact a source path and a date', (locale) => {
    const r = study(locale).results;
    expect(r?.facts.length).toBeGreaterThanOrEqual(4);
    for (const fact of r?.facts ?? []) {
      expect(fact.value.trim()).not.toBe('');
      expect(fact.source.trim()).not.toBe('');
    }
    expect(r?.asOf).toMatch(/2026/);
  });

  it('states the same numbers in PL and EN', () => {
    const values = (locale: Locale): string[] =>
      study(locale).results?.facts.map(
        (f) => `${f.value} ${f.source.startsWith('test(') ? 'test(' : f.source}`,
      ) ?? [];
    expect(values('en')).toEqual(values('pl'));
  });
});

describe('forbidden terms on the tiller pages', () => {
  it.each(LOCALES)('%s passes every content guard, the leak-guard shapes included', (locale) => {
    expect(contentViolations(page(locale))).toEqual([]);
  });

  const html = (text: string): string => `<p>${text}</p>`;

  it('catches the credential shapes and private paths of tiller’s leak guard', () => {
    for (const value of [
      'ghp_' + 'A'.repeat(24),
      'github_pat_' + 'a'.repeat(22),
      'sk-ant-' + 'x'.repeat(12),
      'AKIA' + 'A'.repeat(16),
      ['-----BEGIN', 'RSA PRIVATE KEY-----'].join(' '),
    ]) {
      expect(contentViolations(html(value)), value).toContain('credential shape');
    }
    // Built from parts, so this file does not itself match the shapes it tests.
    const claude = ['', '.claude', ''].join('/');
    for (const value of [`~${claude}memory/x.md`, `/Users/someone${claude}plans/a.md`]) {
      expect(contentViolations(html(value)), value).toContain('private agent record path');
    }
  });

  it('catches a tiller path that names a real profile, brain, person or the helm', () => {
    for (const value of [
      'profiles/acme/profile.md',
      'brains/acme/decisions.md',
      'personal/someone/leak-terms.txt',
      'helm/events/x.md',
    ]) {
      expect(contentViolations(html(value)), value).toContain('private harness path');
    }
    for (const value of [
      'profiles/_template/profile.md',
      'brains/_template/README.md',
      'personal/_templates/README.md',
      'profiles/&lt;name&gt;/',
      'flow-helm',
    ]) {
      expect(contentViolations(html(value)), value).not.toContain('private harness path');
    }
  });

  it.each(LOCALES)('%s keeps the fictional example fictional', (locale) => {
    const text = readableText(page(locale));
    // The sample project and ticket are invented for the page and say so.
    expect(text).toContain('bookshelf-api');
    expect(text).toContain('SHELF-12');
  });
});

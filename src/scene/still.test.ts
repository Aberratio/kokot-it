import { describe, expect, it } from 'vitest';
import { relayGraph } from './relay-graph.ts';
import { relayStillMarkup, stillGraph } from './still.ts';

describe('relayStillMarkup', () => {
  const graph = relayGraph({ seed: 2026, count: 20, width: 400, height: 300, links: 2, pulses: 4 });
  const markup = relayStillMarkup(graph, 400, 300, { id: 'x' });

  it('draws every agent, every link and every pulse of the graph', () => {
    expect(markup.match(/<circle class="n"/g)).toHaveLength(20);
    expect(markup.match(/<line class="e"/g)).toHaveLength(graph.edges.length);
    // A pulse is a glow, a head and the lit part of its edge.
    expect(markup.match(/<circle class="p"/g)).toHaveLength(graph.pulses.length);
    expect(markup.match(/<line class="a"/g)).toHaveLength(graph.pulses.length);
  });

  it('takes every colour from the scene tokens, never from literals', () => {
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i);
    for (const token of [
      '--scene-node',
      '--scene-edge',
      '--scene-pulse-task',
      '--scene-pulse-result',
    ]) {
      expect(markup).toContain(`var(${token})`);
    }
  });

  it('is decorative by default and an image when given a title', () => {
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('<title>');
    const titled = relayStillMarkup(graph, 400, 300, { id: 'y', title: 'Agent <network>' });
    expect(titled).toContain('role="img"');
    expect(titled).toContain('<title>Agent &lt;network&gt;</title>');
  });

  it('escapes every value it writes into attributes', () => {
    const odd = relayStillMarkup(graph, 400, 300, { id: 'a"b', fit: 'x"y' });
    expect(odd).toContain('id="a&quot;b-glow-task"');
    expect(odd).toContain('preserveAspectRatio="x&quot;y"');
    expect(odd).not.toContain('a"b');
  });

  it('keeps gradient ids unique per still', () => {
    expect(markup).toContain('id="x-glow-task"');
    expect(markup).toContain('url(#x-glow-task)');
  });
});

describe('stillGraph', () => {
  it('fills a wide or a tall viewport with the same seed', () => {
    const wide = stillGraph(1366, 768);
    const tall = stillGraph(390, 844);
    expect(wide.width).toBeGreaterThan(wide.height);
    expect(tall.height).toBeGreaterThan(tall.width);
    expect(stillGraph(1366, 768)).toEqual(wide);
    expect(wide.graph.nodes.length).toBeGreaterThan(tall.graph.nodes.length);
  });
});

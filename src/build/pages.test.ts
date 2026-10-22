import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { discoverPages, entryName } from './pages.ts';

describe('entryName', () => {
  it('names the root page main and nested pages by their folder', () => {
    expect(entryName('index.html')).toBe('main');
    expect(entryName('en/index.html')).toBe('en');
    expect(entryName(join('projekty', 'sample', 'index.html'))).toBe('projekty/sample');
  });
});

describe('discoverPages', () => {
  let root = '';
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('finds locale and case-study pages and skips non-page folders and the brand preview', () => {
    root = mkdtempSync(join(tmpdir(), 'pages-'));
    const page = (...p: string[]): void => {
      mkdirSync(join(root, ...p.slice(0, -1)), { recursive: true });
      writeFileSync(join(root, ...p), '<!doctype html>');
    };
    page('index.html');
    page('en', 'index.html');
    page('projekty', 'sample', 'index.html');
    page('en', 'projects', 'sample', 'index.html');
    page('docs-templates', 'cv', 'index.html');
    page('node_modules', 'x', 'index.html');
    page('brand', 'index.html');

    expect(Object.keys(discoverPages(root)).sort()).toEqual([
      'en',
      'en/projects/sample',
      'main',
      'projekty/sample',
    ]);
  });
});

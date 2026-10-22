import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TOOL_SLUGS } from '../src/content/types.ts';
import { lockProblems, readLock } from '../scripts/tools-lock.ts';
import { repoRoot } from './repo-files.ts';

// The reference applications: pinned in tools.lock.json, built into public/tools/<slug>/ by
// scripts/sync-tools.ts, embedded by the case studies listed in TOOL_SLUGS.

describe('tools.lock.json', () => {
  it('pins every embedded application to a full commit SHA of its public repository', () => {
    const lock = readLock();
    expect(lock.map((tool) => tool.slug).sort()).toEqual([...TOOL_SLUGS].sort());
    for (const tool of lock) {
      expect(tool.repo).toBe(`https://github.com/Aberratio/${tool.slug}.git`);
    }
  });

  it('rejects a malformed lock', () => {
    expect(lockProblems(null)).toEqual(['tools: expected an array']);
    expect(
      lockProblems({
        tools: [
          { slug: 'Bad Slug', repo: 'git@github.com:x/y.git', commit: 'main' },
          'x',
          { slug: 'a', repo: 'https://github.com/x/a.git', commit: 'a'.repeat(40) },
          { slug: 'a', repo: 'https://github.com/x/a.git', commit: 'a'.repeat(40) },
        ],
      }),
    ).toEqual([
      'tools[0].slug: expected a kebab-case name',
      'tools[0].repo: expected https://github.com/<owner>/<name>.git',
      'tools[0].commit: expected a full 40-character commit SHA',
      'tools[1]: expected an object',
      'tools[3].slug: duplicate "a"',
    ]);
  });
});

describe('public/tools', () => {
  const dir = join(repoRoot, 'public', 'tools');

  it('holds a built application for every locked tool and nothing else', () => {
    const built = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(built).toEqual([...TOOL_SLUGS].sort());
    for (const slug of TOOL_SLUGS) {
      expect(existsSync(join(dir, slug, 'index.html')), slug).toBe(true);
    }
  });
});

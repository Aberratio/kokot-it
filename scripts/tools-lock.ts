import { readFileSync } from 'node:fs';

// The reference applications embedded on the case-study pages. Each one is built from its own
// public repository at a pinned commit (tools.lock.json) by scripts/sync-tools.ts, and the
// static build is committed under public/tools/<slug>/ so a deploy never fetches or builds them.

export interface LockedTool {
  /** Directory under public/tools/ and the case-study slug, e.g. `factory-twin`. */
  slug: string;
  /** Git URL of the public repository. */
  repo: string;
  /** Full 40-character commit SHA the build is made from. */
  commit: string;
}

export const LOCK_FILE = new URL('../tools.lock.json', import.meta.url);

/** Problems with a parsed lock file, empty when it is valid. */
export function lockProblems(data: unknown): string[] {
  if (!data || typeof data !== 'object' || !Array.isArray((data as { tools?: unknown }).tools)) {
    return ['tools: expected an array'];
  }
  const problems: string[] = [];
  const seen = new Set<string>();
  (data as { tools: unknown[] }).tools.forEach((entry, i) => {
    const at = `tools[${String(i)}]`;
    if (!entry || typeof entry !== 'object') {
      problems.push(`${at}: expected an object`);
      return;
    }
    const { slug, repo, commit } = entry as Record<string, unknown>;
    if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      problems.push(`${at}.slug: expected a kebab-case name`);
    } else if (seen.has(slug)) {
      problems.push(`${at}.slug: duplicate "${slug}"`);
    } else {
      seen.add(slug);
    }
    if (typeof repo !== 'string' || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\.git$/.test(repo)) {
      problems.push(`${at}.repo: expected https://github.com/<owner>/<name>.git`);
    }
    if (typeof commit !== 'string' || !/^[0-9a-f]{40}$/.test(commit)) {
      problems.push(`${at}.commit: expected a full 40-character commit SHA`);
    }
  });
  return problems;
}

export function readLock(file: URL = LOCK_FILE): LockedTool[] {
  const data: unknown = JSON.parse(readFileSync(file, 'utf8'));
  const problems = lockProblems(data);
  if (problems.length > 0) throw new Error(`${file.pathname}: ${problems.join('; ')}`);
  return (data as { tools: LockedTool[] }).tools;
}

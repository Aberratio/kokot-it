import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = fileURLToPath(new URL('..', import.meta.url));

/** Text of every file git would commit (tracked + untracked, not ignored), binaries skipped. */
export function repoTextFiles(): { path: string; text: string }[] {
  const listing = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const files: { path: string; text: string }[] = [];
  for (const path of [...new Set(listing.split('\0').filter(Boolean))]) {
    let buffer: Buffer;
    try {
      buffer = readFileSync(join(repoRoot, path));
    } catch {
      continue; // deleted in the working tree
    }
    if (buffer.includes(0)) continue;
    files.push({ path, text: buffer.toString('utf8') });
  }
  return files;
}

/** Collapses whitespace (incl. no-break spaces) so wrapped text still matches. */
export const normalize = (s: string): string => s.replace(/[\s\u00a0]+/g, ' ').trim();

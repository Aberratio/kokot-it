// Rebuilds the reference applications from the commits pinned in tools.lock.json and copies
// each static build to public/tools/<slug>/:
//
//   npm run tools:sync                    every tool in the lock file
//   npm run tools:sync -- factory-twin    only the named tools
//
// For each tool: shallow-fetch the pinned commit into a temporary directory, `npm ci`,
// `npm run build`, then replace public/tools/<slug>/ with the tool's dist/. The output is
// committed, so the site's own build and deploy stay offline and deterministic.
// To move a tool forward, put the new commit SHA in tools.lock.json and run this script.
import { execFileSync, execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLock, type LockedTool } from './tools-lock.ts';

const toolsDir = fileURLToPath(new URL('../public/tools/', import.meta.url));

function run(command: 'git' | 'npm', args: string[], cwd: string): void {
  const options = { cwd, stdio: 'inherit' as const, env: { ...process.env, CI: 'true' } };
  // npm is a .cmd shim on Windows that only starts through a shell. Its arguments here are
  // fixed literals, so they are joined into one command line.
  if (command === 'npm') execSync(`npm ${args.join(' ')}`, options);
  else execFileSync(command, args, options);
}

function syncTool(tool: LockedTool): void {
  const work = mkdtempSync(join(tmpdir(), `tool-${tool.slug}-`));
  try {
    console.log(`\n${tool.slug}: ${tool.repo} @ ${tool.commit}`);
    run('git', ['init', '--quiet'], work);
    run('git', ['fetch', '--quiet', '--depth', '1', tool.repo, tool.commit], work);
    run('git', ['checkout', '--quiet', 'FETCH_HEAD'], work);
    run('npm', ['ci', '--no-audit', '--no-fund'], work);
    run('npm', ['run', 'build'], work);
    const dist = join(work, 'dist');
    if (!existsSync(join(dist, 'index.html'))) {
      throw new Error(`${tool.slug}: the build produced no dist/index.html`);
    }
    const target = join(toolsDir, tool.slug);
    rmSync(target, { recursive: true, force: true });
    cpSync(dist, target, { recursive: true });
    console.log(`${tool.slug}: copied to public/tools/${tool.slug}/`);
  } finally {
    rmSync(work, { recursive: true, force: true, maxRetries: 3 });
  }
}

const lock = readLock();
const only = process.argv.slice(2);
const unknown = only.filter((slug) => !lock.some((tool) => tool.slug === slug));
if (unknown.length > 0) {
  console.error(`Not in tools.lock.json: ${unknown.join(', ')}`);
  process.exit(1);
}
for (const tool of lock) {
  if (only.length === 0 || only.includes(tool.slug)) syncTool(tool);
}

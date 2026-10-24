import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Text checks on the workflow files (no YAML parser in the dependencies). They pin the release
// order: nothing reaches Vercel before lint, typecheck, test and build have passed.
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');

/** The top-level `on:` block of a workflow, up to the next top-level key. */
function triggers(workflow: string): string {
  return /^on:\n((?: {2}.*\n|\n)*)/m.exec(workflow)?.[1] ?? '';
}

/** One job's block under `jobs:`, up to the next job. */
function job(workflow: string, name: string): string {
  const jobs = workflow.slice(workflow.search(/^jobs:\n/m));
  return new RegExp(`^ {2}${name}:\\n((?: {4}.*\\n|\\n)*)`, 'm').exec(jobs)?.[1] ?? '';
}

describe('the deploy workflow', () => {
  it('runs only when CI calls it', () => {
    expect(triggers(deploy).trim().split('\n')[0]).toBe('workflow_call:');
    expect(triggers(deploy)).not.toMatch(/^ {2}(push|pull_request|workflow_run):/m);
  });

  it('is called by CI after the checks pass', () => {
    const step = job(ci, 'deploy');
    expect(step).toMatch(/^ {4}needs: check$/m);
    expect(step).toMatch(/^ {4}uses: \.\/\.github\/workflows\/deploy\.yml$/m);
  });

  it('fails a production deploy when a secret is missing', () => {
    const check = deploy.slice(
      deploy.indexOf('Check Vercel secrets'),
      deploy.indexOf('ready=true'),
    );
    expect(check).toMatch(/event_name.*push/);
    expect(check).toContain('::error');
    expect(check).toMatch(/exit 1/);
  });

  it('never cancels a running production deploy for a newer push', () => {
    expect(ci).toMatch(/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
  });
});

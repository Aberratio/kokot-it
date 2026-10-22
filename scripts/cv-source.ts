// Loads the CV content from OUTSIDE the repository: the repository is public, the CV content
// is not. The folder comes only from $CV_CONTENT_DIR; without it the CV is skipped.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cvProblems, type CvContent } from '../docs-templates/cv/cv.ts';
import type { Lang } from '../docs-templates/shared/html.ts';

/** The CV folder from $CV_CONTENT_DIR, or null when the variable is not set. */
export function cvContentDir(env: NodeJS.ProcessEnv = process.env): string | null {
  return env.CV_CONTENT_DIR?.trim() || null;
}

export interface CvSources {
  dir: string;
  pl: CvContent;
  en: CvContent;
}

/** Reads cv.pl.json and cv.en.json; `null` without a folder or when a file is missing (e.g. CI). */
export function loadCvSources(dir: string | null): CvSources | null {
  if (!dir) return null;
  const files = { pl: join(dir, 'cv.pl.json'), en: join(dir, 'cv.en.json') };
  if (!existsSync(files.pl) || !existsSync(files.en)) return null;
  const read = (lang: Lang): CvContent => {
    const data: unknown = JSON.parse(readFileSync(files[lang], 'utf8'));
    const problems = cvProblems(data);
    if (problems.length > 0) throw new Error(`${files[lang]}: ${problems.join('; ')}`);
    return data as CvContent;
  };
  return { dir, pl: read('pl'), en: read('en') };
}

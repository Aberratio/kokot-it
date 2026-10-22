// Loads the CV content from OUTSIDE the repository (T-06): the repo will be public, the CV
// content stays in the private brain. Directory: $CV_CONTENT_DIR, default below.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cvProblems, type CvContent } from '../docs-templates/cv/cv.ts';
import type { Lang } from '../docs-templates/shared/html.ts';

export const DEFAULT_CV_DIR = 'C:/Repos/tiller/brains/personal-brand/cv';

export function cvContentDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.CV_CONTENT_DIR?.trim() || DEFAULT_CV_DIR;
}

export interface CvSources {
  dir: string;
  pl: CvContent;
  en: CvContent;
}

/** Reads cv.pl.json and cv.en.json; `null` when the directory or a file is missing (e.g. CI). */
export function loadCvSources(dir: string): CvSources | null {
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

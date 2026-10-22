import type { Lang } from '../shared/html.ts';

// CV content schema (schemaVersion 1). The real content lives outside this repository, in the
// private brain (cv/cv.pl.json, cv/cv.en.json; T-06); the repo holds only the template and a
// fictional fixture (tests/fixtures/cv.sample.json). Any object may carry `TODO_OWNER`: a
// question for the owner that is never rendered and makes the PDF script warn.

export interface CvLink {
  label: string;
  url: string;
}

export interface CvExperience {
  role: string;
  org: string;
  orgNote?: string;
  start: string;
  end: string | null;
  summary?: string;
  highlights: string[];
  stack?: string[];
}

export interface CvProject {
  name: string;
  status: 'public' | 'in_progress';
  url: string | null;
  description: string;
  highlights?: string[];
  stack?: string[];
}

export interface CvContent {
  schemaVersion: 1;
  lang: Lang;
  labels: {
    summary: string;
    skills: string;
    experience: string;
    projects: string;
    education: string;
    certifications: string;
    languages: string;
    additional: string;
    present: string;
    inProgress: string;
    stack: string;
  };
  basics: { name: string; title: string; email: string; location: string; links: CvLink[] };
  summary: string[];
  skills: { group: string; items: string[] }[];
  experience: CvExperience[];
  projects: CvProject[];
  education: { degree: string; field: string; institution: string; start: string; end: string }[];
  certifications: { name: string; issuer: string | null }[];
  languages: { language: string; level: string }[];
  additional?: string[];
}

export interface TodoOwner {
  /** JSON path of the object that carries the note, e.g. `experience[1]`. */
  path: string;
  note: string;
}

/** Every `TODO_OWNER` note in the content, with the path of the object that carries it. */
export function todoOwnerNotes(value: unknown, path = ''): TodoOwner[] {
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => todoOwnerNotes(v, `${path}[${String(i)}]`));
  }
  if (value === null || typeof value !== 'object') return [];
  const notes: TodoOwner[] = [];
  for (const [key, v] of Object.entries(value)) {
    if (key === 'TODO_OWNER') notes.push({ path: path || '(root)', note: String(v) });
    else notes.push(...todoOwnerNotes(v, path ? `${path}.${key}` : key));
  }
  return notes;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Schema problems; empty when the content can be rendered. Unknown keys are ignored. */
export function cvProblems(input: unknown): string[] {
  const p: string[] = [];
  const cv = input as Partial<CvContent> | null;
  if (!cv || typeof cv !== 'object') return ['not an object'];
  if (cv.schemaVersion !== 1) p.push('schemaVersion must be 1');
  if (cv.lang !== 'pl' && cv.lang !== 'en') p.push('lang must be "pl" or "en"');
  const labelKeys = [
    'summary',
    'skills',
    'experience',
    'projects',
    'education',
    'certifications',
    'languages',
    'additional',
    'present',
    'inProgress',
    'stack',
  ] as const;
  for (const k of labelKeys) if (!isString(cv.labels?.[k])) p.push(`labels.${k} missing`);
  for (const k of ['name', 'title', 'email', 'location'] as const) {
    if (!isString(cv.basics?.[k])) p.push(`basics.${k} missing`);
  }
  if (!Array.isArray(cv.basics?.links)) p.push('basics.links must be an array');
  if (!isStringArray(cv.summary)) p.push('summary must be a string array');
  if (
    !Array.isArray(cv.skills) ||
    !cv.skills.every((s) => isString(s.group) && isStringArray(s.items))
  ) {
    p.push('skills must be [{group, items[]}]');
  }
  if (!Array.isArray(cv.experience)) p.push('experience must be an array');
  else
    cv.experience.forEach((e, i) => {
      if (!isString(e.role) || !isString(e.org))
        p.push(`experience[${String(i)}]: role and org required`);
      if (!MONTH.test(e.start)) p.push(`experience[${String(i)}].start must be YYYY-MM`);
      if (e.end !== null && !MONTH.test(e.end))
        p.push(`experience[${String(i)}].end must be YYYY-MM or null`);
      if (!isStringArray(e.highlights))
        p.push(`experience[${String(i)}].highlights must be a string array`);
    });
  if (!Array.isArray(cv.projects)) p.push('projects must be an array');
  else
    cv.projects.forEach((pr, i) => {
      const status: unknown = pr.status;
      if (status !== 'public' && status !== 'in_progress') {
        p.push(`projects[${String(i)}].status must be public or in_progress`);
      }
      if (pr.url !== null && !isString(pr.url))
        p.push(`projects[${String(i)}].url must be a string or null`);
    });
  for (const k of ['education', 'certifications', 'languages'] as const) {
    if (!Array.isArray(cv[k])) p.push(`${k} must be an array`);
  }
  if (cv.additional !== undefined && !isStringArray(cv.additional))
    p.push('additional must be a string array');
  return p;
}

import { brandSvg, documentHtml, escapeHtml, list } from '../shared/html.ts';
import type { CvContent, CvExperience, CvProject } from './cv.ts';

// CV template: one column, real text, headings in reading order — readable for ATS
// parsers. TODO_OWNER fields are never rendered: the template reads only known keys.

export interface CvOptions {
  /** Drop the optional `additional` section (used when the CV would exceed two pages). */
  omitAdditional?: boolean;
}

const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** `2021-03` → PL `03.2021`, EN `Mar 2021`. */
export function formatMonth(value: string, lang: CvContent['lang']): string {
  const [year, month] = value.split('-');
  if (lang === 'pl') return `${month ?? ''}.${year ?? ''}`;
  return `${EN_MONTHS[Number(month) - 1] ?? ''} ${year ?? ''}`;
}

function period(cv: CvContent, start: string, end: string | null): string {
  const to = end === null ? cv.labels.present : formatMonth(end, cv.lang);
  return `${formatMonth(start, cv.lang)} – ${to}`;
}

const t = escapeHtml;

const stackLine = (cv: CvContent, stack: string[] | undefined): string =>
  stack && stack.length > 0
    ? `<p class="cv-stack"><span class="label">${t(cv.labels.stack)}</span> ${stack.map(t).join(' · ')}</p>`
    : '';

const section = (id: string, label: string, body: string): string =>
  `<section class="cv-section cv-${id}">
    <h2>${t(label)}</h2>
    <div class="cv-body">${body}</div>
  </section>`;

function experienceItem(cv: CvContent, e: CvExperience): string {
  const org = e.orgNote ? `${t(e.org)} <span class="cv-note">(${t(e.orgNote)})</span>` : t(e.org);
  return `<div class="cv-item">
    <div class="cv-item-head">
      <h3>${t(e.role)} <span class="cv-org">· ${org}</span></h3>
      <p class="cv-dates">${t(period(cv, e.start, e.end))}</p>
    </div>
    ${e.summary ? `<p class="cv-summary">${t(e.summary)}</p>` : ''}
    ${list(e.highlights)}
    ${stackLine(cv, e.stack)}
  </div>`;
}

function projectItem(cv: CvContent, p: CvProject): string {
  const where =
    p.url !== null
      ? `<a href="${t(p.url)}">${t(p.url.replace(/^https?:\/\//, ''))}</a>`
      : `<span class="cv-note">${t(cv.labels.inProgress)}</span>`;
  return `<div class="cv-item">
    <div class="cv-item-head">
      <h3>${t(p.name)}</h3>
      <p class="cv-dates">${where}</p>
    </div>
    <p>${t(p.description)}</p>
    ${list(p.highlights)}
    ${stackLine(cv, p.stack)}
  </div>`;
}

export function renderCv(cv: CvContent, opts: CvOptions = {}): string {
  const b = cv.basics;
  const contact = [
    `<a href="mailto:${t(b.email)}">${t(b.email)}</a>`,
    t(b.location),
    ...b.links.map((l) => `<a href="${t(l.url)}">${t(l.label)}</a>`),
  ]
    .map((c) => `<li>${c}</li>`)
    .join('');

  const skills = `<dl class="cv-skills">${cv.skills
    .map((s) => `<div><dt>${t(s.group)}</dt><dd>${s.items.map(t).join(' · ')}</dd></div>`)
    .join('')}</dl>`;

  const education = cv.education
    .map(
      (e) => `<div class="cv-item cv-item-compact">
        <div class="cv-item-head">
          <h3>${t(e.field)} <span class="cv-org">· ${t(e.degree)}</span></h3>
          <p class="cv-dates">${t(e.start)} – ${t(e.end)}</p>
        </div>
        <p>${t(e.institution)}</p>
      </div>`,
    )
    .join('');

  const certifications = `<ul>${cv.certifications
    .map(
      (c) =>
        `<li>${t(c.name)}${c.issuer ? ` <span class="cv-note">· ${t(c.issuer)}</span>` : ''}</li>`,
    )
    .join('')}</ul>`;

  const languages = `<p class="cv-languages">${cv.languages
    .map((l) => `<span>${t(l.language)} <span class="cv-note">(${t(l.level)})</span></span>`)
    .join('<span class="cv-sep"> · </span>')}</p>`;

  const additional =
    !opts.omitAdditional && cv.additional && cv.additional.length > 0
      ? section('additional', cv.labels.additional, list(cv.additional))
      : '';

  const body = `<article class="doc cv">
  <header class="cv-header">
    <div>
      <h1>${t(b.name)}</h1>
      <p class="cv-title">${t(b.title)}</p>
      <ul class="cv-contact">${contact}</ul>
    </div>
    ${brandSvg('mark-on-light', 'cv-mark')}
  </header>
  ${section('summary', cv.labels.summary, cv.summary.map((s) => `<p>${t(s)}</p>`).join(''))}
  ${section('skills', cv.labels.skills, skills)}
  ${section('experience', cv.labels.experience, cv.experience.map((e) => experienceItem(cv, e)).join(''))}
  ${section('projects', cv.labels.projects, cv.projects.map((p) => projectItem(cv, p)).join(''))}
  <div class="cv-closing">
    ${section('education', cv.labels.education, education)}
    <div>
      ${section('certifications', cv.labels.certifications, certifications)}
      ${section('languages', cv.labels.languages, languages)}
    </div>
  </div>
  ${additional}
</article>`;

  return documentHtml({
    lang: cv.lang,
    title: `${b.name} — CV`,
    styles: ['cv/cv.css'],
    body,
  });
}

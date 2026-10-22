// What `npm run pdf` renders, and what it checks and warns about for each document.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { todoOwnerNotes } from '../docs-templates/cv/cv.ts';
import { renderCv } from '../docs-templates/cv/render.ts';
import { offerCopy } from '../docs-templates/oferta/content.ts';
import { isDraft, pricing, pricingProblems } from '../docs-templates/oferta/pricing.ts';
import { renderOffer } from '../docs-templates/oferta/render.ts';
import {
  quoteDataProblems,
  quoteProblems,
  type QuoteData,
} from '../docs-templates/oferta-cenowa/quote.ts';
import { renderQuote } from '../docs-templates/oferta-cenowa/render.ts';
import {
  findPlaceholders,
  formatRange,
  visibleText,
  type Lang,
} from '../docs-templates/shared/html.ts';
import type { CvSources } from './cv-source.ts';

/** `draft` (default): templates with visible {{FIELDS}}. `final`: what goes out; warns loudly. */
export type Mode = 'draft' | 'final';

export interface DocSpec {
  /** PDF file name in out/pdf/. */
  output: string;
  html: string;
  /** Rendered instead when the first version exceeds `maxPages` (CV without `additional`). */
  fallbackHtml?: string;
  maxPages?: number;
  /** Phrases that must be extractable from the PDF (real text, readable for ATS). */
  phrases: string[];
}

export interface Plan {
  docs: DocSpec[];
  /** Printed before rendering; in `final` mode they mean "not ready to send". */
  warnings: string[];
  /** Neutral information (e.g. why CVs were skipped). */
  notes: string[];
}

export interface PlanInput {
  mode: Mode;
  cv: CvSources | null;
  /** Directory the CV was looked up in (for the skip message). */
  cvDir: string;
  /** A private, filled-in quote (outside the repo). */
  quoteFile?: string;
}

const templatesDir = new URL('../docs-templates/oferta-cenowa/', import.meta.url);
/** Reads quote data and checks its shape first: a private quote file is outside the repo. */
function readQuote(path: string | URL): QuoteData {
  const data: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const problems = quoteDataProblems(data);
  if (problems.length > 0) throw new Error(`${String(path)}: ${problems.join('; ')}`);
  return data as QuoteData;
}

function offerSpec(lang: Lang, email: string | null): DocSpec {
  const p2 = pricing.packages.find((x) => x.code === 'P2');
  return {
    output: `oferta-${lang}.pdf`,
    html: renderOffer({ lang, email }),
    maxPages: 2,
    phrases: [
      offerCopy[lang].title,
      offerCopy[lang].packages.items.P1.title,
      ...(p2 ? [formatRange(p2.netMin, p2.netMax, lang)] : []),
      ...(email ? [email] : []),
    ],
  };
}

function quoteSpec(output: string, data: QuoteData, email: string | null): DocSpec {
  return {
    output,
    html: renderQuote({ data, email }),
    phrases: [
      'Oferta cenowa nr',
      'Przedmiot oferty',
      'autorskich praw majątkowych',
      'Zestawienie do porównania ofert',
    ],
  };
}

export function planDocuments(input: PlanInput): Plan {
  const warnings: string[] = [];
  const notes: string[] = [];
  const docs: DocSpec[] = [];
  const email = input.cv?.pl.basics.email ?? null;

  for (const problem of pricingProblems()) warnings.push(`pricing.json: ${problem}`);
  if (isDraft()) {
    const msg =
      'pricing.json status is "draft": documents carry the "preliminary pricing" badge (D-021).';
    if (input.mode === 'final')
      warnings.push(`${msg} Set "status": "approved" after the owner approves the price list.`);
    else notes.push(msg);
  }

  docs.push(offerSpec('pl', email), offerSpec('en', email));

  if (input.mode === 'draft') {
    docs.push(
      quoteSpec(
        'oferta-cenowa-szablon-pl.pdf',
        readQuote(new URL('data.template.json', templatesDir)),
        email,
      ),
      quoteSpec(
        'oferta-cenowa-przyklad-pl.pdf',
        readQuote(new URL('data.example.json', templatesDir)),
        email,
      ),
    );
  }
  if (input.quoteFile) {
    const data = readQuote(input.quoteFile);
    for (const problem of quoteProblems(data)) warnings.push(`${input.quoteFile}: ${problem}`);
    docs.push(quoteSpec(`oferta-cenowa-${basename(input.quoteFile, '.json')}-pl.pdf`, data, email));
  }

  if (input.cv) {
    for (const lang of ['pl', 'en'] as const) {
      const cv = input.cv[lang];
      for (const todo of todoOwnerNotes(cv)) {
        warnings.push(`cv.${lang}.json ${todo.path}: TODO_OWNER (not rendered) — ${todo.note}`);
      }
      const firstRole = cv.experience[0]?.role;
      docs.push({
        output: `cv-${lang}.pdf`,
        html: renderCv(cv),
        fallbackHtml: renderCv(cv, { omitAdditional: true }),
        maxPages: 2,
        phrases: [
          cv.basics.name,
          cv.basics.email,
          cv.labels.experience,
          ...(firstRole ? [firstRole] : []),
        ],
      });
    }
  } else {
    notes.push(
      `CV skipped: no cv.pl.json / cv.en.json in ${input.cvDir}. The CV content lives outside the repo; set CV_CONTENT_DIR to its folder.`,
    );
  }

  if (input.mode === 'final') {
    for (const doc of docs) {
      const left = findPlaceholders(visibleText(doc.html));
      if (left.length > 0) warnings.push(`${doc.output}: unfilled fields ${left.join(' ')}`);
    }
  }
  return { docs, warnings, notes };
}

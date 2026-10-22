// Renders the offer, the price-quote template and the CV to out/pdf/ with Playwright's
// Chromium, then checks every PDF: page limit, embedded brand fonts, extractable text.
//
//   npm run pdf                          draft: templates with visible {{FIELDS}}
//   npm run pdf -- --final               what goes out; warns about {{FIELDS}}, TODO_OWNER, draft pricing
//   npm run pdf -- --quote <file.json>   also a filled-in price quote kept outside the repo
//
// CV content is read from $CV_CONTENT_DIR (it never lives in this repo); not set or missing → CV skipped.
// First run: npm run pdf:install (downloads Chromium).
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium, type Browser } from 'playwright';
import { cvContentDir, loadCvSources } from './cv-source.ts';
import { planDocuments, type Mode } from './documents.ts';
import { renderDocument } from './pdf-render.ts';

const { values } = parseArgs({
  options: {
    final: { type: 'boolean', default: false },
    quote: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help) {
  console.log('Usage: npm run pdf [-- --final] [-- --quote <file.json>]');
  process.exit(0);
}

const outDir = fileURLToPath(new URL('../out/pdf/', import.meta.url));
const mode: Mode = values.final ? 'final' : 'draft';
const cvDir = cvContentDir();
const plan = planDocuments({
  mode,
  cv: loadCvSources(cvDir),
  cvDir: cvDir ?? '(CV_CONTENT_DIR not set)',
  ...(values.quote ? { quoteFile: resolve(values.quote) } : {}),
});

for (const note of plan.notes) console.log(`note: ${note}`);
for (const warning of plan.warnings) console.warn(`WARNING: ${warning}`);

let browser: Browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.error('Chromium for Playwright is missing. Run: npm run pdf:install');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

let failed = false;
try {
  for (const doc of plan.docs) {
    const { pdfPath, info, problems, usedFallback } = await renderDocument(browser, doc, outDir);
    if (usedFallback) {
      console.warn(
        `WARNING: ${doc.output} was over ${String(doc.maxPages)} pages; rendered without its optional section (CV: "additional").`,
      );
    }
    const pages = `${String(info.pages)} ${info.pages === 1 ? 'page' : 'pages'}`;
    if (problems.length === 0) {
      console.log(`PDF ok: ${pdfPath} (${pages})`);
    } else {
      failed = true;
      console.error(`PDF FAILED: ${pdfPath} (${pages})`);
      for (const p of problems) console.error(`  - ${p}`);
    }
  }
} finally {
  await browser.close();
}

if (mode === 'final' && plan.warnings.length > 0) {
  console.warn(`\nNOT READY TO SEND: ${String(plan.warnings.length)} warning(s) above.`);
}
process.exit(failed ? 1 : 0);

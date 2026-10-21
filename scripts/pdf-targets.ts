import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface PdfTarget {
  /** Absolute path of the HTML template. */
  source: string;
  /** Output file name, e.g. `oferta-pl.pdf`. */
  output: string;
}

const LANG_FILE = /^(pl|en)\.html$/;

/**
 * Every `docs-templates/<document>/<lang>.html` becomes `<document>-<lang>.pdf`.
 * Folders without such files (e.g. `shared/`) are skipped.
 */
export function pdfTargets(templatesDir: string): PdfTarget[] {
  const targets: PdfTarget[] = [];
  for (const doc of readdirSync(templatesDir, { withFileTypes: true })) {
    if (!doc.isDirectory()) continue;
    for (const file of readdirSync(join(templatesDir, doc.name)).sort()) {
      const lang = LANG_FILE.exec(file)?.[1];
      if (!lang) continue;
      targets.push({
        source: join(templatesDir, doc.name, file),
        output: `${doc.name}-${lang}.pdf`,
      });
    }
  }
  return targets.sort((a, b) => a.output.localeCompare(b.output));
}

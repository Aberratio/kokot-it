// Renders every page of the generated PDFs to PNG (out/preview/<name>-p<n>.png) for a visual
// check of the real PDF output — page breaks, fonts, margins. Run after `npm run pdf`:
//   npm run pdf:preview            all PDFs in out/pdf/
//   npm run pdf:preview -- a.pdf   selected files
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const pdfDir = join(root, 'out', 'pdf');
const outDir = join(root, 'out', 'preview');

const args = process.argv.slice(2);
const files =
  args.length > 0
    ? args.map((a) => resolve(a))
    : readdirSync(pdfDir)
        .filter((f) => f.endsWith('.pdf'))
        .map((f) => join(pdfDir, f));

interface CanvasAndContext {
  canvas: { toBuffer: (mime: 'image/png') => Buffer };
  context: unknown;
}

mkdirSync(outDir, { recursive: true });
for (const file of files) {
  const task = getDocument({ data: new Uint8Array(readFileSync(file)), verbosity: 0 });
  const pdf = await task.promise;
  // pdfjs does not type its document's canvas factory; in Node it is backed by @napi-rs/canvas
  // (an optional dependency of pdfjs-dist), whose canvas/context stand in for the DOM types
  // page.render() declares. A dev-only preview tool, so the double casts stay local to it.
  const factory = (
    pdf as unknown as { canvasFactory: { create: (w: number, h: number) => CanvasAndContext } }
  ).canvasFactory;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.6 });
    const target = factory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({
      canvas: target.canvas as unknown as HTMLCanvasElement,
      canvasContext: target.context as CanvasRenderingContext2D,
      viewport,
    }).promise;
    const png = join(outDir, `${basename(file, '.pdf')}-p${String(i)}.png`);
    writeFileSync(png, target.canvas.toBuffer('image/png'));
    console.log(png);
  }
  await task.destroy();
}

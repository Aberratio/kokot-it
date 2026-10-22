import ts from 'typescript';

// Rules for the repository's own text (code, comments, docs, config), run over every file git
// would commit by tests/repo-guards.test.ts:
//
// - language: everything is written in English. Polish is allowed only where it is the
//   product: the Polish UI dictionaries, the Polish document templates and their data, the
//   brand preview's Polish specimen, and test fixtures. Elsewhere a Polish string literal is
//   fine (tests assert on Polish output), but a comment or a doc may quote Polish only inside
//   backticks or double quotes.
// - wording: no "demo" wording, no internal planning ids or process names, no absolute local
//   paths. The guard modules themselves are exempt: they have to spell out what they look for.

/** Polish diacritics: the reliable marker of Polish prose. */
export const POLISH = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

/** Generated or third-party files the guards do not read. */
export const SKIPPED: readonly RegExp[] = [/^package-lock\.json$/, /^public\/tools\/[^/]+\//];

/** Files whose job is Polish copy or Polish data. */
export const POLISH_FILES: readonly RegExp[] = [
  /^src\/content\/pl\.ts$/, // Polish site copy
  /^src\/i18n\/pl\.ts$/, // Polish UI strings
  /^brand\/index\.html$/, // brand preview: Polish type specimen and sample copy
  /^docs-templates\/offer\/content\.ts$/, // offer copy, PL and EN
  /^docs-templates\/price-quote\/(?:render|requirements)\.ts$/, // Polish-only price quote, rules quoted from the call
  /^docs-templates\/(?:offer|price-quote)\/[^/]+\.json$/, // pricing and sample quote data
  /^tests\/fixtures\//, // fictional sample data
];

/** The guard modules and their own tests: they name the patterns they look for. */
export const WORDING_EXEMPT: readonly RegExp[] = [
  /^src\/content\/guards(?:\.test)?\.ts$/,
  /^scripts\/repo-guards\.ts$/,
  /^tests\/repo-guards\.test\.ts$/,
];

export const WORDING_RULES: readonly [string, RegExp][] = [
  ['demo wording', /demo(?!nstr)|\bdem(?:a|ach|ami|om)\b/i],
  ['internal planning id', /\b(?:D-\d{3}|T-\d{2}|Q-\d{3})\b/],
  ['internal process name', /orkiestrator|orchestrator/i],
  ['absolute local path', /\b[A-Za-z]:[\\/](?:Users|Repos)\b|\/c\/Repos\//i],
];

/** Text with backtick and double-quoted spans removed: what is left is the author's prose. */
export function unquoted(text: string): string {
  return text.replace(/`[^`\n]*`/g, ' ').replace(/"[^"\n]*"|“[^”\n]*”|„[^”\n]*”/g, ' ');
}

/** Every comment in a TypeScript or JavaScript file, with its 1-based line. */
export function tsComments(path: string, text: string): { line: number; text: string }[] {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, false);
  const seen = new Set<number>();
  const comments: { line: number; text: string }[] = [];
  const collect = (ranges: ts.CommentRange[] | undefined): void => {
    for (const range of ranges ?? []) {
      if (seen.has(range.pos)) continue;
      seen.add(range.pos);
      comments.push({
        line: source.getLineAndCharacterOfPosition(range.pos).line + 1,
        text: text.slice(range.pos, range.end),
      });
    }
  };
  const visit = (node: ts.Node): void => {
    collect(ts.getLeadingCommentRanges(text, node.pos));
    collect(ts.getTrailingCommentRanges(text, node.end));
    ts.forEachChild(node, visit);
  };
  visit(source);
  collect(ts.getLeadingCommentRanges(text, source.endOfFileToken.pos));
  return comments.sort((a, b) => a.line - b.line);
}

const lineOf = (text: string, index: number): number => text.slice(0, index).split('\n').length;

/** Places where a file uses Polish outside what the language rule allows. */
export function languageViolations(path: string, text: string): string[] {
  if (SKIPPED.some((rule) => rule.test(path)) || POLISH_FILES.some((rule) => rule.test(path))) {
    return [];
  }
  if (!POLISH.test(text)) return [];
  if (/\.(?:ts|mts|js|mjs)$/.test(path)) {
    return tsComments(path, text)
      .filter((comment) => POLISH.test(unquoted(comment.text)))
      .map((comment) => `${path}:${String(comment.line)}: Polish in a comment`);
  }
  if (/\.md$/.test(path)) {
    return text
      .split('\n')
      .flatMap((line, i) =>
        POLISH.test(unquoted(line)) ? [`${path}:${String(i + 1)}: Polish in prose`] : [],
      );
  }
  const index = text.search(POLISH);
  return [`${path}:${String(lineOf(text, index))}: Polish text`];
}

/** Places where a file breaks a wording rule. */
export function wordingViolations(path: string, text: string): string[] {
  if (SKIPPED.some((rule) => rule.test(path)) || WORDING_EXEMPT.some((rule) => rule.test(path))) {
    return [];
  }
  const found: string[] = [];
  const target = `${path}\n${text}`; // file names count too
  for (const [name, rule] of WORDING_RULES) {
    const match = new RegExp(rule.source, rule.flags.includes('g') ? rule.flags : `${rule.flags}g`);
    for (const m of target.matchAll(match)) {
      found.push(`${path}:${String(lineOf(target, m.index) - 1)}: ${name} "${m[0]}"`);
    }
  }
  return found;
}

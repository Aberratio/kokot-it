import { CONTACT_EMAIL } from './types.ts';

// Content rules every published page must pass: no company data or phone number, the e-mail
// address is the only contact, no prices until the price list is approved, no empty AI
// buzzwords, no "demo" wording, no internal process references or local paths; and, for the
// tiller case study, no credential shape, private agent path or private harness path.
// Used by the unit tests on rendered pages and by scripts/check-dist.ts on the real build.

/**
 * Any run of 9+ digits with optional spaces, dots, slashes, dashes, brackets or a +/00 prefix:
 * Polish mobile and landline numbers in every grouping, NIP (10 digits, any dashing), REGON.
 * Dates such as 30.11.2026 have 8 digits, and ranges use an en dash, so they pass.
 */
export const PHONE_OR_TAX_ID = /(?:\+|\b00)?\(?\d(?:[\s./()-]{0,2}\d){8,}/;

const REGISTRY_ID = /\b(?:NIP|REGON|KRS|VAT ID)\b|\bPL\s?\d{10}\b/i;

const TEXT_RULES: [string, RegExp][] = [
  ['phone number or tax id', PHONE_OR_TAX_ID],
  ['company registry id', REGISTRY_ID],
  // Unicode-aware boundaries: `\b` treats `ł` as a non-word character.
  [
    'price',
    /(?<!\p{L})(?:zł|zl|złotych|PLN|EUR|USD|GBP|CHF|tys\.|netto|brutto)(?!\p{L})|[€£]|\$\s?\d|\b\d+\s?k\b/u,
  ],
  [
    'buzzword or leftover placeholder',
    /rewolucj|magi[aić]|magic|revolution|game.?chang|lorem|\bTODO\b|\bTBD\b|\bTBA\b|\bXXX\b|w budowie|wkrótce|do uzupełnienia|coming soon|under construction/i,
  ],
  // The projects are reference solutions and the site says so; "demo" undersells them.
  ['demo wording', /\bdem(?:o|os|a|ach|ami|om)\b/i],
  // Decision, task and question ids of the private planning notes, and the people or tools
  // behind the process, never reach a page.
  ['internal process reference', /\b(?:D-\d{3}|T-\d{2}|Q-\d{3})\b|orkiestrator|orchestrator/i],
  ['absolute local path', /\b[A-Za-z]:[\\/](?:Users|Repos)\b/],
  // The two public pattern sets of tiller's lib/leak-guard.sh (SECRETS and PRIVATE), the second
  // one widened to Windows paths. Its third set, the project and person terms, lives in private
  // local lists that this repository never sees; the tool itself is run by hand on the pages.
  [
    'credential shape',
    /(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-ant-[A-Za-z0-9-]{10,}|xox[abprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/,
  ],
  [
    'private agent record path',
    /(?:~|\$HOME|%USERPROFILE%|\/Users\/[^/ ]+|\/home\/[^/ ]+|[A-Za-z]:[\\/]Users[\\/][^\\/ ]+)[\\/]\.claude[\\/](?:plans|projects|memory|qa-evidence|meeting-notes|[A-Za-z0-9_-]+-reflections)[\\/]/,
  ],
  // A tiller path that names a real profile, brain or person (a directory below it), or the
  // helm: those directories are private by design. Templates (`_template/`, `_templates/`) and
  // the `<name>` placeholder are public, and so is a skill such as `skills/flow-helm/`.
  [
    'private harness path',
    /(?<![\w-])(?:brains|profiles|personal)\/[A-Za-z0-9][\w.-]*\/|(?<![\w-])helm\/[A-Za-z0-9]/,
  ],
];

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
};

/** Decodes the named entities above and every decimal or hex numeric entity. */
export function decodeEntities(value: string): string {
  return value.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (match, dec, hex, name) => {
    if (dec !== undefined || hex !== undefined) {
      const code = dec !== undefined ? Number(dec) : Number.parseInt(String(hex), 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[String(name).toLowerCase()] ?? match;
  });
}

/**
 * Everything a reader or a crawler sees: visible text, JSON-LD, and the values of attributes
 * that carry copy (meta content, title, alt, aria-label, data-*), in either quote style.
 * Styles and executable scripts are dropped.
 */
export function readableText(html: string): string {
  const withoutCode = html
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, ' ');
  const attributes = [
    ...withoutCode.matchAll(
      /\b(?:content|title|alt|aria-label|data-[\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
    ),
  ]
    .map((m) => m[1] ?? m[2] ?? '')
    .join(' ');
  const text = withoutCode.replace(/<[^>]+>/g, ' ');
  return decodeEntities(`${text} ${attributes}`).replace(/\u00a0/g, ' ');
}

/** Names of the rules a content page breaks, empty when it is clean. */
export function contentViolations(html: string): string[] {
  const text = readableText(html);
  const found = TEXT_RULES.filter(([, rule]) => rule.test(text)).map(([name]) => name);
  return [...new Set([...found, ...contactViolations(html)])];
}

/**
 * The contact rules alone: no `tel:` link, no registry label, no e-mail but the contact
 * address.
 */
export function contactViolations(html: string): string[] {
  const text = readableText(html);
  const found: string[] = [];
  if (REGISTRY_ID.test(text)) found.push('company registry id');
  if (/href\s*=\s*["']?\s*tel:/i.test(html)) found.push('tel: link');
  const emails = [
    ...(html.match(/mailto:[^"'?\s>]+/gi) ?? []).map((m) => m.slice('mailto:'.length)),
    // A domain starts with a letter, so asset names such as logo@2x.png are not addresses.
    ...(text.match(/[\w.+-]+@[a-z][\w-]*(?:\.[\w-]+)*\.[a-z]{2,}\b/gi) ?? []),
  ];
  if (emails.some((address) => address !== CONTACT_EMAIL)) found.push('unexpected e-mail');
  return found;
}

/**
 * Rules for standalone pages (the brand preview): the contact rules, no phone number or tax
 * id, and no amount of money. A type specimen may list digit groups and currency glyphs
 * ("0123 · 4567 · 89 · € · zł"), but a number written next to a currency ("2 400 zł") is a
 * price and waits for the approved price list.
 */
export function standaloneViolations(html: string): string[] {
  const text = readableText(html);
  const found = contactViolations(html);
  if (PHONE_OR_TAX_ID.test(text)) found.push('phone number or tax id');
  const amount =
    /\d[\d\s]*(?:zł|zl|złotych|PLN|EUR|USD|GBP|CHF|€|£|tys\.)(?!\p{L})|(?:€|£|\$|PLN)\s?\d/u;
  if (amount.test(text)) found.push('price amount');
  return found;
}

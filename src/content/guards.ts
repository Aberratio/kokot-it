import { CONTACT_EMAIL } from './types.ts';

// Content rules every published page must pass (D-028: no company data or phone; e-mail is
// the only contact; no prices until the price list is approved; no empty AI buzzwords).
// Used by the unit tests on rendered pages and by scripts/check-dist.ts on the real build.

const TEXT_RULES: [string, RegExp][] = [
  // Any run of 9+ digits with optional spaces, dots, dashes, brackets or a +/00 prefix: Polish
  // mobile and landline numbers in every grouping, NIP (10 digits, any dashing), REGON.
  // Dates such as 30.11.2026 have 8 digits, and ranges use an en dash, so they pass.
  ['phone number or tax id', /(?:\+|\b00)?\(?\d(?:[\s.()-]{0,2}\d){8,}/],
  ['company registry id', /\b(?:NIP|REGON|KRS|VAT ID)\b|\bPL\s?\d{10}\b/i],
  // Unicode-aware boundaries: `\b` treats `ł` as a non-word character.
  [
    'price',
    /(?<!\p{L})(?:zł|złotych|PLN|EUR|USD|tys\.|netto|brutto)(?!\p{L})|€|\$\s?\d|\b\d+\s?k\b/u,
  ],
  [
    'buzzword or leftover placeholder',
    /rewolucj|magi[aić]|magic|revolution|game.?chang|lorem|TODO|TBD|\bTBA\b|\bXXX\b|w budowie|wkrótce|do uzupełnienia|coming soon|under construction/i,
  ],
];

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

function decode(value: string): string {
  return value.replace(/&(?:nbsp|#160|amp|quot|#39|lt|gt);/g, (m) => ENTITIES[m] ?? m);
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
  return decode(`${text} ${attributes}`).replace(/\u00a0/g, ' ');
}

/** Names of the rules a content page breaks, empty when it is clean. */
export function contentViolations(html: string): string[] {
  const found = TEXT_RULES.filter(([, rule]) => rule.test(readableText(html))).map(
    ([name]) => name,
  );
  return [...new Set([...found, ...contactViolations(html)])];
}

/**
 * The contact rules alone (D-028): no `tel:` link, no registry label, no e-mail but the
 * contact address. For standalone pages such as the brand preview, whose type specimens
 * legitimately show digit runs and currency signs.
 */
export function contactViolations(html: string): string[] {
  const text = readableText(html);
  const found: string[] = [];
  if (/\b(?:NIP|REGON|KRS|VAT ID)\b|\bPL\s?\d{10}\b/i.test(text)) found.push('company registry id');
  if (/href\s*=\s*["']?\s*tel:/i.test(html)) found.push('tel: link');
  const emails = [
    ...(html.match(/mailto:[^"'?\s>]+/gi) ?? []).map((m) => m.slice('mailto:'.length)),
    // A domain starts with a letter, so asset names such as logo@2x.png are not addresses.
    ...(text.match(/[\w.+-]+@[a-z][\w-]*(?:\.[\w-]+)*\.[a-z]{2,}\b/gi) ?? []),
  ];
  if (emails.some((address) => address !== CONTACT_EMAIL)) found.push('unexpected e-mail');
  return found;
}

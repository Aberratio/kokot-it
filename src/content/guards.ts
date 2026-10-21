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
  ['price', /(?<!\p{L})(?:zł|PLN|EUR|USD|tys\.)(?!\p{L})|€|\$\s?\d/u],
  [
    'buzzword or leftover placeholder',
    /rewolucj|magi[aić]|magic|revolution|game.?chang|lorem|TODO|TBD|w budowie|wkrótce|coming soon|under construction/i,
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
 * Everything a reader or a crawler sees: visible text plus the values of attributes that
 * carry copy (meta content, title, alt, aria-label). Scripts and styles are dropped.
 */
export function readableText(html: string): string {
  const withoutCode = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');
  const attributes = [...withoutCode.matchAll(/\b(?:content|title|alt|aria-label)="([^"]*)"/gi)]
    .map((m) => m[1] ?? '')
    .join(' ');
  const text = withoutCode.replace(/<[^>]+>/g, ' ');
  return decode(`${text} ${attributes}`).replace(/\u00a0/g, ' ');
}

/** Names of the rules a page breaks, empty when it is clean. */
export function contentViolations(html: string): string[] {
  const text = readableText(html);
  const found = TEXT_RULES.filter(([, rule]) => rule.test(text)).map(([name]) => name);
  if (/href="tel:/i.test(html)) found.push('tel: link');
  const emails = [
    ...(html.match(/mailto:[^"?]+/g) ?? []).map((m) => m.slice('mailto:'.length)),
    ...(text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []),
  ];
  if (emails.some((address) => address !== CONTACT_EMAIL)) found.push('unexpected e-mail');
  return found;
}

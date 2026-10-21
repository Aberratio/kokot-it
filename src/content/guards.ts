import { CONTACT_EMAIL } from './types.ts';

// Content rules every published page must pass (D-028: no company data or phone; e-mail is
// the only contact; no prices until the price list is approved; no empty AI buzzwords).
// Used by the unit tests on rendered pages and by scripts/check-dist.ts on the real build.

const TEXT_RULES: [string, RegExp][] = [
  ['phone number', /(?:\+\d{2}[\s-]?)?\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/],
  ['company registry id', /\b(?:NIP|REGON|KRS|VAT ID)\b/i],
  ['tax id (NIP) pattern', /\b\d{3}-?\d{3}-?\d{2}-?\d{2}\b/],
  ['10-digit number', /\b\d{10}\b/],
  // Unicode-aware boundaries: `\b` treats `ł` as a non-word character.
  ['price', /(?<!\p{L})(?:zł|PLN|EUR|USD)(?!\p{L})|€|\$\s?\d/u],
  [
    'buzzword or leftover placeholder',
    /rewolucj|magi[aić]|magic|revolution|game.?chang|lorem|TODO|TBD/i,
  ],
];

/** Visible text of an HTML document: no scripts, styles or tags. */
export function visibleText(html: string): string {
  return html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
}

/** Names of the rules a page breaks, empty when it is clean. */
export function contentViolations(html: string): string[] {
  const text = visibleText(html);
  const found = TEXT_RULES.filter(([, rule]) => rule.test(text)).map(([name]) => name);
  if (/href="tel:/i.test(html)) found.push('tel: link');
  const mailtos = new Set(html.match(/mailto:[^"]+/g));
  if ([...mailtos].some((m) => m !== `mailto:${CONTACT_EMAIL}`)) found.push('unexpected e-mail');
  return found;
}

import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  findPlaceholders,
  formatMoney,
  formatRange,
  text,
  visibleText,
} from './html.ts';

describe('document helpers', () => {
  it('formats money with grouping in both languages, 4-digit amounts included', () => {
    expect(formatMoney(200_000, 'pl')).toBe('2\u00a0000\u00a0zł');
    expect(formatMoney(12_546_000, 'pl', { decimals: true })).toBe('125\u00a0460,00\u00a0zł');
    expect(formatMoney(92_000, 'pl', { decimals: true })).toBe('920,00\u00a0zł');
    expect(formatMoney(12_345, 'en')).toBe('PLN\u00a0123.45');
    expect(formatMoney(1_000_000_000, 'en')).toBe('PLN\u00a010,000,000');
    expect(() => formatMoney(1.5, 'pl')).toThrow();
  });

  it('formats ranges', () => {
    expect(formatRange(70_000, 130_000, 'pl')).toBe('70\u00a0000–130\u00a0000\u00a0zł');
    expect(formatRange(70_000, 130_000, 'en')).toBe('PLN\u00a070,000–130,000');
  });

  it('wraps fields so they stand out, after escaping', () => {
    expect(text('Firma {{NAZWA_FIRMY}} & <b>')).toBe(
      'Firma <span class="field">{{NAZWA_FIRMY}}</span> &amp; &lt;b&gt;',
    );
    expect(escapeHtml(`"'`)).toBe('&quot;&#39;');
  });

  it('finds distinct fields, sorted', () => {
    expect(findPlaceholders('{{B}} x {{A_1}} {{B}} {{lower}}')).toEqual(['{{A_1}}', '{{B}}']);
  });

  it('extracts visible text', () => {
    expect(visibleText('<title>t</title><p>a&nbsp;b &amp; c</p><style>p{}</style>')).toBe(
      'a b & c',
    );
  });
});

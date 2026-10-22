import { describe, expect, it } from 'vitest';
import { findPlaceholders, visibleText } from '../shared/html.ts';
import { pricing } from './pricing.ts';
import { renderOffer } from './render.ts';

const pl = visibleText(renderOffer({ lang: 'pl', email: 'kontakt@example.com' }));
const en = visibleText(renderOffer({ lang: 'en', email: 'kontakt@example.com' }));

describe('presentation offer', () => {
  it('shows every package with the net range from pricing.json', () => {
    expect(pl).toContain('P1 Diagnoza i plan wdrożenia AI 10 000–16 000 zł netto');
    expect(pl).toContain('70 000–130 000 zł netto');
    expect(pl).toContain('240 000–410 000 zł netto');
    expect(en).toContain('PLN 10,000–16,000 net');
    expect(en).toContain('PLN 70,000–130,000 net');
    expect(en).toContain('PLN 240,000–410,000 net');
  });

  it('carries the preliminary-pricing badge while pricing.json is a draft', () => {
    expect(pl).toContain('Cennik wstępny — do zatwierdzenia');
    expect(en).toContain('Preliminary pricing — pending approval');
  });

  it('drops the badge when the single status flag is set to approved', () => {
    const approved = renderOffer({
      lang: 'pl',
      email: 'x@example.com',
      pricing: { ...pricing, status: 'approved' },
    });
    expect(approved).not.toContain('data-draft');
    expect(visibleText(approved)).not.toContain('Cennik wstępny');
  });

  it('covers the content the task asks for', () => {
    for (const heading of [
      'Gdzie firma traci czas',
      'Co robi kokot.it',
      'Pakiety',
      'Harmonogram z Dig.IT',
      'Co dostaje firma',
      'Dlaczego to koszt kwalifikowalny w Dig.IT',
      'Kontakt',
    ]) {
      expect(pl).toContain(heading);
    }
  });

  it('does not promise a grant', () => {
    expect(pl).toContain('nie obiecuje dofinansowania');
    expect(en).toContain('does not promise funding');
    expect(pl).not.toMatch(/gwarantuj\w* (dotacj|grant|dofinansowan)/i);
    expect(en).not.toMatch(/guarantee\w* (the )?(grant|funding)/i);
  });

  it('uses the e-mail it is given, or a visible {{EMAIL}} field without one', () => {
    expect(pl).toContain('kontakt@example.com');
    expect(findPlaceholders(renderOffer({ lang: 'pl', email: null }))).toEqual(['{{EMAIL}}']);
  });

  it('has no phone number, company id or other placeholder', () => {
    for (const text of [pl, en]) {
      expect(text).not.toMatch(/(?:\+|\b00)?\(?\d(?:[\s.()-]{0,2}\d){8,}/);
      expect(text).not.toMatch(/\b(?:NIP|REGON|KRS)\b/);
      expect(findPlaceholders(text)).toEqual([]);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { alternatePath, homePath, localeFromPath, messages, projectPath } from './index.ts';

describe('i18n routing', () => {
  it('detects the locale from the path', () => {
    expect(localeFromPath('/')).toBe('pl');
    expect(localeFromPath('/projekty/demo/')).toBe('pl');
    expect(localeFromPath('/en/')).toBe('en');
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/english/')).toBe('pl');
  });

  it('builds home and case-study paths per locale', () => {
    expect(homePath('pl')).toBe('/');
    expect(homePath('en')).toBe('/en/');
    expect(projectPath('pl', 'demo')).toBe('/projekty/demo/');
    expect(projectPath('en', 'demo')).toBe('/en/projects/demo/');
  });

  it('maps a page to its counterpart in the other locale', () => {
    expect(alternatePath('/', 'en')).toBe('/en/');
    expect(alternatePath('/en/', 'pl')).toBe('/');
    expect(alternatePath('/projekty/demo/', 'en')).toBe('/en/projects/demo/');
    expect(alternatePath('/en/projects/demo/', 'pl')).toBe('/projekty/demo/');
    expect(alternatePath('/nieznana/', 'en')).toBe('/en/');
  });

  it('keeps both dictionaries in the same shape', () => {
    expect(Object.keys(messages('en')).sort()).toEqual(Object.keys(messages('pl')).sort());
  });
});

import { en } from './en.ts';
import { pl } from './pl.ts';

export const LOCALES = ['pl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pl';

export type Messages = typeof pl;

const MESSAGES: Record<Locale, Messages> = { pl, en };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Locale of a URL path: everything under `/en/` is English, the rest Polish. */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pl';
}

export function messages(locale: Locale): Messages {
  return MESSAGES[locale];
}

/** Section segment for case studies per locale: `/projekty/<slug>/`, `/en/projects/<slug>/`. */
const PROJECTS_SEGMENT: Record<Locale, string> = { pl: 'projekty', en: 'projects' };

function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

export function homePath(locale: Locale): string {
  return `${localePrefix(locale)}/`;
}

export function projectPath(locale: Locale, slug: string): string {
  return `${localePrefix(locale)}/${PROJECTS_SEGMENT[locale]}/${slug}/`;
}

/**
 * The same page in another locale. Known routes (home, case study) map 1:1;
 * anything else falls back to the target locale's home page.
 */
export function alternatePath(pathname: string, target: Locale): string {
  const source = localeFromPath(pathname);
  const rest = source === DEFAULT_LOCALE ? pathname : pathname.slice(`/${source}`.length) || '/';
  const parts = rest.split('/').filter(Boolean);
  if (parts.length === 0) return homePath(target);
  const [section, slug] = parts;
  if (parts.length === 2 && section === PROJECTS_SEGMENT[source] && slug) {
    return projectPath(target, slug);
  }
  return homePath(target);
}

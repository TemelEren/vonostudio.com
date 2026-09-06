// All editable copy lives in the content database — see DATA-MODEL.md.
import { loadServices, loadStrings } from '../db';
import type { Locale } from './locale';
// Type-only: the seed file defines which keys exist, so a typo in t('...')
// is still a build error even though the strings now come from SQLite.
import type trSeed from '../../seed/content/strings.tr.json';

export type { Locale };

export type UIKey = keyof typeof trSeed;

export function useTranslations(locale: Locale) {
  const strings = loadStrings(locale);
  return function t(key: UIKey): string {
    return strings[key] ?? key;
  };
}

/**
 * Turn a root-relative path into a real URL for this site.
 *
 * Two things happen here. First it prefixes Astro's `base` — a no-op while the
 * site sits at the root of its domain, but it keeps a future move under a
 * sub-path to a one-line config change instead of a hunt through templates.
 * Second it adds the trailing slash: pages are served directory-style
 * (/projeler/vono-ofis/), so matching the canonical URL exactly keeps the
 * hreflang pairs reciprocal and spares visitors a redirect hop.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const [pathname, hash] = path.split('#');
  const isFile = (pathname.split('/').pop() ?? '').includes('.');
  const trailed = isFile || pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${base}${trailed}${hash ? `#${hash}` : ''}`;
}

/** Prefix a root-relative path with the locale segment (and the base) when needed. */
export function localePath(locale: Locale, path: string): string {
  return withBase(locale === 'tr' ? path : `/en${path === '/' ? '' : path}`);
}

export const services = () =>
  loadServices().map((s) => ({ title: s.title, desc: s.description }));

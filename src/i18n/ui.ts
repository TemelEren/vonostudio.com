// All editable copy lives in /content — see CONTENT-GUIDE.md.
import tr from '../../content/strings.tr.json';
import en from '../../content/strings.en.json';
import servicesData from '../../content/services.json';

export type Locale = 'tr' | 'en';

export const ui = { tr, en };

export type UIKey = keyof typeof tr;

export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return (ui[locale] as Record<UIKey, string>)[key];
  };
}

/**
 * Turn a root-relative path into a real URL for this site.
 *
 * Two things happen here. First it prefixes Astro's `base` — a no-op while the
 * site sits at the root of vonostudio.com, but it keeps a future move under a
 * sub-path to a one-line config change instead of a hunt through templates.
 * Second it adds the trailing slash: pages are built directory-style
 * (/projeler/vono-ofis/index.html), so matching the canonical URL exactly keeps
 * the hreflang pairs reciprocal and spares visitors a redirect hop.
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

export const services: {
  title: Record<Locale, string>;
  desc: Record<Locale, string>;
}[] = servicesData.map((s) => ({ title: s.title, desc: s.description }));

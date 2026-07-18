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

/** Prefix a root-relative path with the locale segment when needed. */
export function localePath(locale: Locale, path: string): string {
  return locale === 'tr' ? path : `/en${path === '/' ? '' : path}`;
}

export const services: {
  title: Record<Locale, string>;
  desc: Record<Locale, string>;
}[] = servicesData.map((s) => ({ title: s.title, desc: s.description }));

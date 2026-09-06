// Structured data (schema.org JSON-LD) for Google's rich results and the
// knowledge panel. Everything here reads from /content/settings.json — see
// CONTENT-GUIDE.md.
import { loadSettings } from '../db';
import type { Locale } from '../i18n/locale';

export const ORG_ID = '#organization';
export const SITE_ID = '#website';

const abs = (site: URL, path: string) => new URL(path, site).href;

/** The studio itself — referenced by every other node via @id. */
export function organizationSchema(site: URL, locale: Locale) {
  const settings = loadSettings();
  return {
    '@type': ['Organization', 'ArchitecturalService'],
    '@id': abs(site, ORG_ID),
    name: settings.siteName,
    legalName: settings.legalName,
    url: abs(site, locale === 'tr' ? '/' : '/en/'),
    logo: abs(site, '/favicon.svg'),
    image: abs(site, settings.seo.ogImage),
    email: settings.email,
    telephone: settings.phone,
    foundingDate: settings.founded,
    priceRange: settings.seo.priceRange,
    areaServed: settings.seo.areaServed[locale],
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address[locale],
      addressLocality: settings.seo.addressLocality,
      addressRegion: settings.seo.addressRegion,
      postalCode: settings.seo.postalCode,
      addressCountry: settings.seo.addressCountry,
    },
    sameAs: settings.social.map((s) => s.link),
  };
}

export function websiteSchema(site: URL, locale: Locale) {
  const settings = loadSettings();
  return {
    '@type': 'WebSite',
    '@id': abs(site, SITE_ID),
    url: abs(site, '/'),
    name: settings.siteName,
    inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
    publisher: { '@id': abs(site, ORG_ID) },
  };
}

/** Trail shown under the result title in Google. `items` are [name, path] pairs. */
export function breadcrumbSchema(site: URL, items: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: abs(site, path),
    })),
  };
}

/** Wraps the nodes a page contributes into a single @graph document. */
export function graph(site: URL, locale: Locale, nodes: unknown[] = []) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [organizationSchema(site, locale), websiteSchema(site, locale), ...nodes],
  });
}

// Page-level schema.org nodes, handed to <Base schema={...}>.
import { breadcrumbSchema, ORG_ID, SITE_ID } from './schema';
import { loadProjects, loadSettings, type Project } from '../db';
import { localePath, useTranslations, type Locale } from '../i18n/ui';

const abs = (site: URL, path: string) => new URL(path, site).href;

/** Root-relative URL of a project page in the given locale. */
export function projectPath(locale: Locale, slug: string): string {
  return localePath(locale, `${locale === 'tr' ? '/projeler' : '/projects'}/${slug}`);
}

/** Home page: the page itself plus the portfolio as a crawlable item list. */
export function homeSchema(site: URL, locale: Locale) {
  const url = abs(site, localePath(locale, '/'));
  const t = useTranslations(locale);
  const projects = loadProjects();

  return [
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: t('meta.title'),
      description: t('meta.description'),
      inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
      isPartOf: { '@id': abs(site, SITE_ID) },
      about: { '@id': abs(site, ORG_ID) },
      primaryImageOfPage: abs(site, loadSettings().seo.ogImage),
    },
    {
      '@type': 'ItemList',
      name: t('projects.title'),
      numberOfItems: projects.length,
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        url: abs(site, projectPath(locale, p.slug)),
      })),
    },
  ];
}

/** Project page: the work itself plus the breadcrumb trail Google shows. */
export function projectSchema(site: URL, locale: Locale, project: Project) {
  const url = abs(site, projectPath(locale, project.slug));
  const t = useTranslations(locale);

  return [
    {
      '@type': 'CreativeWork',
      '@id': url,
      url,
      name: project.title,
      description: project.excerpt[locale],
      image: [project.cover, ...project.gallery].map((src) => abs(site, src)),
      dateCreated: project.year,
      genre: project.category[locale],
      inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
      locationCreated: { '@type': 'Place', name: project.location[locale] },
      creator: { '@id': abs(site, ORG_ID) },
      isPartOf: { '@id': abs(site, SITE_ID) },
    },
    breadcrumbSchema(site, [
      [loadSettings().siteName, localePath(locale, '/')],
      [t('projects.title'), localePath(locale, '/#projeler')],
      [project.title, projectPath(locale, project.slug)],
    ]),
  ];
}

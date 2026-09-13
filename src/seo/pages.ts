// Page-level schema.org nodes, handed to <Base schema={...}>.
import { breadcrumbSchema, ORG_ID, SITE_ID } from './schema';
import { loadProjects, loadSettings, metaText, projectTitle, resolveProjectMedia, type Project } from '../db';
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
        name: projectTitle(p, locale),
        url: abs(site, projectPath(locale, p.slug)),
      })),
    },
  ];
}

/** Project page: the work itself plus the breadcrumb trail Google shows. */
export function projectSchema(site: URL, locale: Locale, project: Project) {
  const url = abs(site, projectPath(locale, project.slug));
  const t = useTranslations(locale);

  /* Read by key off the meta strip, which a project may no longer carry. A
     missing property is dropped from the JSON-LD rather than emitted empty:
     Google reading an invented year is worse than reading none. */
  const year = metaText(project, 'year', locale);
  const category = metaText(project, 'category', locale);
  const location = metaText(project, 'location', locale);

  return [
    {
      '@type': 'CreativeWork',
      '@id': url,
      url,
      name: projectTitle(project, locale),
      description: project.excerpt[locale],
      /* WARNING: `project.gallery` IS NOT READ DIRECTLY. The editor's media list
         REPLACES it — a project the strip has been saved on has no `gallery`
         at all, and spreading it threw "not iterable" and took the page down
         (measured). The cover leads because it is the share image; films are
         left out because schema.org's `image` wants pictures. */
      image: [
        ...new Set([
          project.cover,
          ...resolveProjectMedia(project)
            .filter((m) => m.kind === 'image')
            .map((m) => m.src),
        ]),
      ]
        .filter(Boolean)
        .map((src) => abs(site, src)),
      dateCreated: year || undefined,
      genre: category || undefined,
      inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
      locationCreated: location ? { '@type': 'Place', name: location } : undefined,
      creator: { '@id': abs(site, ORG_ID) },
      isPartOf: { '@id': abs(site, SITE_ID) },
    },
    breadcrumbSchema(site, [
      [loadSettings().siteName, localePath(locale, '/')],
      [t('projects.title'), localePath(locale, '/#projeler')],
      [projectTitle(project, locale), projectPath(locale, project.slug)],
    ]),
  ];
}

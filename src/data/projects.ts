import type { Locale } from '../i18n/ui';

export interface Project {
  slug: string;
  title: string;
  year: string;
  area: string;
  location: Record<Locale, string>;
  category: Record<Locale, string>;
  status: Record<Locale, string>;
  excerpt: Record<Locale, string>;
  body: Record<Locale, string[]>;
  cover: string;
  gallery: string[];
}

// Projects are loaded from /content/projects/*.json, ordered by file name
// (01-, 02-, ...). See CONTENT-GUIDE.md for how to add or edit one.
const modules = import.meta.glob<{ default: Project }>('../../content/projects/*.json', {
  eager: true,
});

const required: (keyof Project)[] = [
  'slug',
  'title',
  'year',
  'area',
  'location',
  'category',
  'status',
  'excerpt',
  'body',
  'cover',
  'gallery',
];

export const projects: Project[] = Object.keys(modules)
  .sort()
  .map((path) => {
    const project = modules[path].default;
    const file = path.split('/').pop();
    for (const key of required) {
      if (project[key] === undefined) {
        throw new Error(`content/projects/${file}: "${key}" alanı eksik / missing field`);
      }
    }
    return project;
  });

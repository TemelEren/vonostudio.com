import type { Locale } from '../i18n/locale';

/** A value that has a Turkish and an English version. */
export type Localized<T = string> = Record<Locale, T>;

export interface Settings {
  siteName: string;
  legalName: string;
  founded: string;
  email: string;
  phone: string;
  address: Localized;
  seo: {
    ogImage: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
    priceRange: string;
    areaServed: Localized;
  };
  social: { name: string; link: string }[];
  stats: { value: string; label: Localized }[];
}

export interface About {
  photo: string;
  intro: Localized<string[]>;
  vision: Localized;
  mission: Localized;
  values: { title: Localized; description: Localized }[];
  awards: { year: string; name: Localized; prize: Localized }[];
  team: { name: string; role: Localized; bio: Localized }[];
}

export interface Service {
  title: Localized;
  description: Localized;
}

export interface Reference {
  name: string;
  logo: string;
}

/**
 * One row of the meta strip under a project title.
 *
 * `key` is the row's identity, not its caption: the card and the structured
 * data look `year`, `location` and `category` up by key, so a renamed row keeps
 * feeding them. Rows an editor adds carry no key.
 *
 * `label` is written only once someone renames the row — while it is absent a
 * default row falls back to the `project.<key>` interface string, so a wording
 * change still reaches every project at once.
 *
 * The value's shape says whether it is translated: a plain string reads the
 * same in both languages (a year, a m² figure), a `{ tr, en }` pair does not.
 */
export interface ProjectMeta {
  key?: string;
  label?: Localized;
  value: string | Localized;
}

export interface Project {
  slug: string;
  title: string;
  /**
   * The meta strip. Absent on projects written before it became editable —
   * those fall back to the five fields below. See db/projectMeta.ts; never read
   * these directly, or a renamed strip and the card will disagree.
   */
  meta?: ProjectMeta[];
  year?: string;
  area?: string;
  location?: Localized;
  category?: Localized;
  status?: Localized;
  excerpt: Localized;
  body: Localized<string[]>;
  cover: string;
  gallery: string[];
}

export interface Asset {
  path: string;
  mime: string;
  /** Narrowed to ArrayBuffer so the blob can go straight into a Response body. */
  bytes: Uint8Array<ArrayBuffer>;
  updated: number;
}

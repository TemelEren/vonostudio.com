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

export interface Project {
  slug: string;
  title: string;
  year: string;
  area: string;
  location: Localized;
  category: Localized;
  status: Localized;
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

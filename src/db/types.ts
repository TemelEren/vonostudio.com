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

/**
 * One item in a project's media strip.
 *
 * A project page is mostly pictures, and the order they appear in is an
 * editorial decision, not a consequence of which field they were typed into.
 * That is why there is ONE list rather than a cover plus a gallery: the editor
 * moves rows, and the page follows.
 *
 * `kind` is normally read off the extension; it is only written when the file
 * name cannot say (an external URL). `span` is how many of the three columns
 * the item takes, and `ratio` a DELIBERATE crop — absent, a picture keeps its
 * own shape and nothing is cut off.
 *
 * See db/projectMedia.ts; never read this array directly, or a project written
 * before the list existed shows an empty page.
 */
export interface ProjectMediaItem {
  src: string;
  kind?: 'image' | 'video';
  /** Still shown before a video starts. Absent: the first frame. */
  poster?: string;
  /** 1–3. Absent: a repeating rhythm, so an untouched project still varies. */
  span?: number;
  /** 'w/h', e.g. '16/9'. Absent: natural for a picture, 16/9 for a video. */
  ratio?: string;
  /**
   * What the picture shows, for search engines and screen readers (§5.231).
   * A plain string reads the same in both languages. Absent: the project
   * title and the item's number — never an empty alt, which would tell a
   * search engine the picture is decoration.
   */
  alt?: string | Localized;
}

export interface Project {
  slug: string;
  /**
   * A plain string reads the same in both languages (every project written
   * before titles were translatable); a { tr, en } pair is translated.
   * Never print this directly: db/projectMeta.ts → projectTitle() picks the
   * language and falls back to the other side when one is empty.
   */
  title: string | Localized;
  /**
   * The meta strip. Absent on projects written before it became editable —
   * those fall back to the five fields below. See db/projectMeta.ts; never read
   * these directly, or a renamed strip and the card will disagree.
   */
  meta?: ProjectMeta[];
  /**
   * Filter buttons this project appears under (db/projectCategories.ts).
   * Keys, never labels — renaming a category must not detach its projects.
   * Absent means the project shows only under "all", which is also what every
   * project did before the filter row existed.
   */
  categories?: string[];
  year?: string;
  area?: string;
  location?: Localized;
  category?: Localized;
  status?: Localized;
  excerpt: Localized;
  /**
   * Search keywords for this project's page, comma separated (§5.231). Absent
   * or empty in a language: the site-wide `meta.keywords` string is used.
   */
  seoKeywords?: Localized;
  body: Localized<string[]>;
  /**
   * The card and share image. Kept apart from `media` on purpose: it is what
   * the grid and every shared link show, whether or not the detail page opens
   * with it.
   */
  cover: string;
  /**
   * The ordered media strip of the detail page. Absent on projects written
   * before it existed — those fall back to `[cover, ...gallery]`. See
   * db/projectMedia.ts; never read this or `gallery` directly.
   */
  media?: ProjectMediaItem[];
  /** Superseded by `media`, which the editor writes instead once it is used. */
  gallery: string[];
}


/**
 * The editable look: colours, typefaces and the two lengths the layout is built
 * on. Stored under the `theme` content key.
 *
 * `fonts` holds CATALOGUE KEYS, not CSS (see db/theme.ts) — the site turns a key
 * into a font stack, so an editor can never write raw CSS into a stylesheet the
 * site serves, and a family that is not installed cannot be selected into a
 * silent fallback.
 */
export interface Theme {
  colors: { bg: string; ink: string; muted: string; line: string; soft: string };
  fonts: { display: string; body: string };
  /** rem. `pad` becomes clamp(padMin, 4vw, padMax). */
  layout: { padMin: number; padMax: number; navH: number };
  /**
   * How the page moves. `projectFilter` is a CATALOGUE KEY (db/theme.ts), never
   * CSS: it names one of a fixed set of transitions the stylesheet already
   * carries, so an editor picks a behaviour rather than writing one.
   */
  motion?: {
    projectFilter: string;
    filterMs: number;
    /** Total length of the opening logo animation, ms (db/theme.ts → INTRO_MS). */
    introMs?: number;
  };
  /** Fonts the editor uploaded. Validated in db/theme.ts before they reach CSS. */
  customFonts?: { key: string; label: string; path: string }[];
}

export interface Asset {
  path: string;
  mime: string;
  /** Narrowed to ArrayBuffer so the blob can go straight into a Response body. */
  bytes: Uint8Array<ArrayBuffer>;
  updated: number;
}

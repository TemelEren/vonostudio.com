/* ================================================================
   COOKIES AND STORAGE THIS SITE ACTUALLY USES - the policy table is built
   from this list, and the consent script reads its keys.

   WARNING: THIS IS AN INVENTORY OF THE CODE, NOT COPY. It was taken by reading
   the site (2026-09-13): no analytics, no advertising, fonts and videos served
   from our own server. What touches the visitor's browser is exactly:
     - the consent choice itself (local storage, first party);
     - the preview session cookie - only for the editor looking at an
       unpublished draft (middleware.ts), never for a visitor;
     - Google Maps in the contact section, which sets GOOGLE's cookies.
   Add a row here in the same change that adds a cookie, a tracker or an embed.
   The prose around the table is editable in the panel; the table is not,
   because a table that disagrees with the code is a false statement.

   WARNING: THIRD-PARTY NAMES ARE EXAMPLES AND SAY SO. Google decides which
   cookies its map sets and changes them; the row names the common ones, says
   "for example", and links to Google's own list rather than claiming to be it.
   ================================================================ */

import type { Locale } from '../i18n/locale';

/** Bumped when the list of optional cookies changes: every visitor is asked again. */
export const CONSENT_VERSION = 1;
/** Where the choice is kept (local storage). */
export const CONSENT_KEY = 'vono-cerez';
/** A choice older than this is asked again. */
export const CONSENT_MAX_DAYS = 365;

export type CookieCategory = 'necessary' | 'external';

export interface CookieRow {
  name: string;
  provider: string;
  category: CookieCategory;
  purpose: Record<Locale, string>;
  duration: Record<Locale, string>;
  /** The provider's own page about its cookies. */
  more?: string;
}

export const COOKIES: CookieRow[] = [
  {
    name: CONSENT_KEY,
    provider: 'vonostudio.com',
    category: 'necessary',
    purpose: {
      tr: 'Çerez tercihinizi (kabul ya da ret) hatırlar; tarayıcınızın yerel depolamasında durur, sunucuya gönderilmez.',
      en: 'Remembers your cookie choice (accept or reject); kept in your browser’s local storage and never sent to our server.',
    },
    duration: { tr: `${CONSENT_MAX_DAYS / 30 | 0} ay`, en: `${CONSENT_MAX_DAYS / 30 | 0} months` },
  },
  {
    name: 'vono_onizleme',
    provider: 'vonostudio.com',
    category: 'necessary',
    purpose: {
      tr: 'Yalnızca site yöneticisi yayınlanmamış taslağı önizlerken oluşur; ziyaretçilerin tarayıcısına yerleştirilmez.',
      en: 'Set only while the site’s editor previews an unpublished draft; never placed in a visitor’s browser.',
    },
    duration: { tr: 'Oturum (tarayıcı kapanınca silinir)', en: 'Session (deleted when the browser closes)' },
  },
  {
    name: 'NID, AEC, SOCS …',
    provider: 'Google (google.com)',
    category: 'external',
    purpose: {
      tr: 'İletişim bölümündeki haritayı gösterir. Harita Google tarafından sunulur ve Google kendi çerezlerini (örneğin bu adlarla) yerleştirir. Yalnızca izin verirseniz yüklenir.',
      en: 'Shows the map in the contact section. The map is served by Google, which sets its own cookies (for example under these names). It loads only with your permission.',
    },
    duration: { tr: '6–13 ay (Google belirler)', en: '6–13 months (set by Google)' },
    more: 'https://policies.google.com/technologies/cookies',
  },
];

export const CATEGORY_LABEL: Record<CookieCategory, Record<Locale, string>> = {
  necessary: { tr: 'Zorunlu', en: 'Necessary' },
  external: { tr: 'Harici içerik (izne bağlı)', en: 'External content (with consent)' },
};

/** The policy page's address in each language - the banner and footer link to it. */
export const POLICY_PATH: Record<Locale, string> = { tr: '/cerez-politikasi', en: '/cookie-policy' };

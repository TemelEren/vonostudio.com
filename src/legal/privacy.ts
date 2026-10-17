/* The KVKK privacy notice (aydınlatma metni, KVKK m.10) - ERP §5.349.

   The text is the editor's copy (privacy.title / privacy.link / privacy.body, panel →
   Arayüz Metinleri). WARNING: THE LIVE content.db HAS NO ROW FOR A KEY ADDED
   AFTER THE FIRST INSTALL - the seed is written only once, and a missing key
   would print its own name on a legal page. The fallback is the seed itself,
   read here, so the site has one default text and not a second copy that
   drifts from it (the panel's copy is checked against the seed by the ERP's
   kvkk-test). */
import type { Locale } from '../i18n/ui';
import trSeed from '../../seed/content/strings.tr.json';
import enSeed from '../../seed/content/strings.en.json';

/** The notice's address in each language - the footer links to it. */
export const PRIVACY_PATH: Record<Locale, string> = { tr: '/kvkk', en: '/privacy-notice' };

/* privacy.link is the short footer label ("KVKK"); the page itself is titled by privacy.title. */
type PrivacyKey = 'privacy.title' | 'privacy.link' | 'privacy.body';

const SEED: Record<Locale, Record<string, string>> = { tr: trSeed, en: enSeed };

type Translate = (key: PrivacyKey) => string;

/** The stored copy, or the seed's when the row is missing. */
export function privacyText(locale: Locale, t: Translate, key: PrivacyKey): string {
  const raw = t(key);
  return raw === key ? SEED[locale][key] : raw;
}

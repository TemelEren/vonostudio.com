/**
 * Which host counts as the real site.
 *
 * Anything else — a staging box, a local preview on another domain — is kept
 * out of search results automatically: `robots.txt` disallows everything and
 * every page carries `noindex`. That way a copy of the site can never be
 * indexed and compete with the real one for the same content.
 *
 * The live site is the default (SITE_URL in astro.config.mjs); the former
 * preview domain next.vonostudio.com no longer exists.
 */
export const PRODUCTION_HOST = 'vonostudio.com';

export function isProductionSite(site: URL | undefined): boolean {
  return site?.hostname === PRODUCTION_HOST;
}

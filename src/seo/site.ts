/**
 * Which host counts as the real site.
 *
 * Anything else — next.vonostudio.com, a staging box, a local preview — is kept
 * out of search results automatically: `robots.txt` disallows everything and
 * every page carries `noindex`. That way the preview domain can never be
 * indexed and compete with the real one for the same content.
 *
 * Going live is a one-line change: point SITE_URL at https://vonostudio.com
 * (or edit the default in astro.config.mjs) and rebuild.
 */
export const PRODUCTION_HOST = 'vonostudio.com';

export function isProductionSite(site: URL | undefined): boolean {
  return site?.hostname === PRODUCTION_HOST;
}

import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// The domain the site is served on. Preview deployments keep the default; the
// live one sets SITE_URL=https://vonostudio.com. Anything other than the
// production host is served noindex with a closed robots.txt — see src/seo/site.ts.
const site = process.env.SITE_URL ?? 'https://next.vonostudio.com';

// Rendered on demand: every page reads its content from the SQLite database at
// request time, so edits are live without a rebuild. There is no `base` — the
// site is served from the root of its own domain.
export default defineConfig({
  site,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'ignore',
  /* WARNING: ASTRO'S ORIGIN CHECK REFUSED EVERY CONTACT FORM IN PRODUCTION.
     It compares the browser's Origin with the URL it rebuilt for the request,
     and behind the proxy that URL is wrong: without security.allowedDomains
     the node adapter (astro 5.18) ignores the Host header and uses
     "localhost", and TLS ends at the proxy so the scheme is "http". Measured
     on the production build and in a real browser: every submission,
     same-origin included, got 403 "Cross-site POST form submissions are
     forbidden" and no enquiry reached the ERP. The one POST endpoint
     (src/pages/api/iletisim.ts) checks the Origin itself, by HOST.
     ⚠ A NEW POST ENDPOINT MUST CALL THE SAME CHECK - nothing global guards it. */
  security: {
    checkOrigin: false,
  },
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});

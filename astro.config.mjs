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
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The domain the build is for. Preview builds keep the default; the live build
// sets SITE_URL=https://vonostudio.com. Anything other than the production host
// is automatically served with noindex + a closed robots.txt — see src/seo/site.ts.
const site = process.env.SITE_URL ?? 'https://next.vonostudio.com';

// The site is served from the root of its own domain, so there is no `base`.
// Keep it that way: `npm run dev` and production then behave identically.
export default defineConfig({
  site,
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      // The two locales use different path words (/projeler vs /en/projects),
      // so the built-in i18n pairing can't match them — pair them by slug here.
      serialize(item) {
        const { origin, pathname } = new URL(item.url);
        const tr = pathname.replace('/en/projects/', '/projeler/').replace(/^\/en\/$/, '/');
        const en = pathname.startsWith('/en/')
          ? pathname
          : pathname.replace('/projeler/', '/en/projects/').replace(/^\/$/, '/en/');

        item.links = [
          { lang: 'tr-TR', url: new URL(tr, origin).href },
          { lang: 'en-US', url: new URL(en, origin).href },
        ];
        item.changefreq = 'monthly';
        item.priority = pathname === '/' || pathname === '/en/' ? 1 : 0.8;
        return item;
      },
    }),
  ],
});

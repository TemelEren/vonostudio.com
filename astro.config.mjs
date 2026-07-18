import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://vonostudio.com',
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});

import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://TemelEren.github.io',
  base: '/vonostudio.com',
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  }
});

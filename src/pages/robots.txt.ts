import type { APIRoute } from 'astro';
import { isProductionSite } from '../seo/site';

// Generated rather than kept in /public so the preview domain stays closed to
// crawlers without anyone having to remember to edit a file before going live.
export const GET: APIRoute = ({ site }) => {
  const body = isProductionSite(site)
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`
    : `# Preview domain — deliberately kept out of search results.\nUser-agent: *\nDisallow: /\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

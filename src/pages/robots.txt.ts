import type { APIRoute } from 'astro';
import { isProductionSite } from '../seo/site';

// Generated rather than kept as a static file so the preview domain stays closed
// to crawlers without anyone having to remember to edit it before going live.
export const GET: APIRoute = ({ site }) => {
  const body = isProductionSite(site)
    ? ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('/sitemap.xml', site)}`, ''].join('\n')
    : ['# Preview domain — deliberately kept out of search results.', 'User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
};

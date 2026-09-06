import type { APIRoute } from 'astro';
import { loadProjects } from '../db';
import { localePath } from '../i18n/ui';
import { projectPath } from '../seo/pages';

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * Built per request rather than at build time — projects live in the database
 * now, so a project added by the editing tool is in the sitemap immediately.
 *
 * Each entry declares both language versions. The pair can't be derived from
 * the path alone (/projeler/… vs /en/projects/…), so it is spelled out here.
 */
export const GET: APIRoute = ({ site }) => {
  const base = site!;
  const abs = (path: string) => escape(new URL(path, base).href);

  const pages: { tr: string; en: string; priority: string }[] = [
    { tr: localePath('tr', '/'), en: localePath('en', '/'), priority: '1.0' },
    ...loadProjects().map((project) => ({
      tr: projectPath('tr', project.slug),
      en: projectPath('en', project.slug),
      priority: '0.8',
    })),
  ];

  const entries = pages.flatMap(({ tr, en, priority }) =>
    [tr, en].map(
      (loc) => `  <url>
    <loc>${abs(loc)}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="tr-TR" href="${abs(tr)}"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="${abs(en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(tr)}"/>
  </url>`
    )
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
};

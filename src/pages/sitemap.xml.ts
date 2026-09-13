import type { APIRoute } from 'astro';
import { loadProjects, resolveProjectMedia } from '../db';
import { localePath } from '../i18n/ui';
import { projectPath } from '../seo/pages';
import { POLICY_PATH } from '../consent/cookies';

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

  /* ---- image entries (§5.231) ----
     Project pictures are listed under their page so image search finds them
     even before it renders the page. Only `<image:loc>`: Google dropped the
     caption/title children in 2022, and writing them would be dead weight.
     Films are left out - they are not images. Capped at 1000 per page, the
     protocol's own limit. */
  const imagesOf = (project: ReturnType<typeof loadProjects>[number]) => [
    ...new Set(
      [project.cover, ...resolveProjectMedia(project).filter((m) => m.kind === 'image').map((m) => m.src)]
        .filter((src) => typeof src === 'string' && src.startsWith('/'))
    ),
  ].slice(0, 1000);

  const pages: { tr: string; en: string; priority: string; images: string[] }[] = [
    { tr: localePath('tr', '/'), en: localePath('en', '/'), priority: '1.0', images: [] },
    ...loadProjects().map((project) => ({
      tr: projectPath('tr', project.slug),
      en: projectPath('en', project.slug),
      priority: '0.8',
      images: imagesOf(project),
    })),
    { tr: localePath('tr', POLICY_PATH.tr), en: localePath('en', POLICY_PATH.en), priority: '0.2', images: [] },
  ];

  const entries = pages.flatMap(({ tr, en, priority, images }) =>
    [tr, en].map(
      (loc) => `  <url>
    <loc>${abs(loc)}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="tr-TR" href="${abs(tr)}"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="${abs(en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(tr)}"/>${images
      .map((src) => `\n    <image:image><image:loc>${abs(src)}</image:loc></image:image>`)
      .join('')}
  </url>`
    )
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
};

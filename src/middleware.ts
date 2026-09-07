import { defineMiddleware } from 'astro:middleware';
import { loadAsset, previewAllowed, withDatabase } from './db';

/** Query parameter and cookie that hold the preview token. */
const PREVIEW_PARAM = 'onizleme';
const PREVIEW_COOKIE = 'vono_onizleme';

/**
 * Every request runs inside one database connection (see withDatabase), and the
 * files that used to sit in /public are served straight out of it.
 *
 * Responses carry an ETag but are marked `no-cache`: browsers re-check on every
 * request, so a replaced photo shows up at once, while unchanged ones cost a
 * 304 instead of the whole file.
 *
 * PREVIEW MODE reads the unpublished draft instead of the live database. The
 * token arrives once as ?onizleme=… and is then kept in a session cookie, so
 * every follow-up request — pages, images, the other language — stays inside the
 * same preview. Without a matching token nothing changes and the public site is
 * served, so a guessed link leaks no unpublished work.
 */
export const onRequest = defineMiddleware((context, next) => {
  const fromQuery = context.url.searchParams.get(PREVIEW_PARAM);
  const fromCookie = context.cookies.get(PREVIEW_COOKIE)?.value;
  const preview = previewAllowed(fromQuery) || previewAllowed(fromCookie);

  if (preview && fromQuery) {
    // Session cookie, not persistent: closing the tab ends the preview, so a
    // shared machine cannot keep showing unpublished pages to the next person.
    context.cookies.set(PREVIEW_COOKIE, fromQuery, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: context.url.protocol === 'https:',
    });
  }
  // An explicit ?onizleme=0 (or any value that no longer matches) leaves preview.
  if (!preview && fromCookie) context.cookies.delete(PREVIEW_COOKIE, { path: '/' });

  context.locals.preview = preview;

  return withDatabase(async () => {
    const asset = loadAsset(decodeURIComponent(context.url.pathname));
    if (!asset) {
      const response = await next();
      /* WARNING: A PREVIEW IS NEVER CACHED AND NEVER INDEXED. It shows work that
         has not been published; a proxy or a crawler holding on to it would put
         unfinished pages in front of the public. Base.astro adds the robots tag;
         this adds the transport-level half. */
      if (preview) {
        response.headers.set('Cache-Control', 'no-store');
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      }
      return response;
    }

    const etag = `W/"${asset.updated.toString(36)}-${asset.bytes.byteLength.toString(36)}"`;
    const headers: Record<string, string> = {
      'Content-Type': asset.mime,
      'Cache-Control': preview ? 'no-store' : 'no-cache',
      ETag: etag,
      'Last-Modified': new Date(asset.updated).toUTCString(),
    };

    if (context.request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(asset.bytes, {
      status: 200,
      headers: { ...headers, 'Content-Length': String(asset.bytes.byteLength) },
    });
  }, preview);
});

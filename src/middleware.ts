import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { defineMiddleware } from 'astro:middleware';
import { loadAssetBytes, loadAssetMeta, loadAssetSlice, previewAllowed, withDatabase } from './db';

/** Query parameter and cookie that hold the preview token. */
const PREVIEW_PARAM = 'onizleme';
const PREVIEW_COOKIE = 'vono_onizleme';

/**
 * One single byte range out of a `Range:` header, or null.
 *
 * WARNING: A VIDEO IS NOT FETCHED, IT IS SEEKED. Browsers ask for a film in
 * pieces and Safari refuses to play one at all unless the server answers 206;
 * without this the strip would show a still frame that never moves and nothing
 * would say why. Only a single range is honoured — a multi-range request is
 * answered with the whole file, which the specification allows and which no
 * player asks for.
 */
function parseRange(header: string | null, size: number): { start: number; end: number } | 'invalid' | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') return 'invalid';

  let start: number;
  let end: number;
  if (rawStart === '') {
    // "bytes=-500" is the LAST 500 bytes, not the first.
    const suffix = Number(rawEnd);
    if (suffix <= 0) return 'invalid';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return 'invalid';
  return { start, end };
}

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
    /* A malformed escape ("/%E0%A4%A") makes decodeURIComponent throw. The
       production server answers such a URL with 400 before it gets here; the
       dev server did not and returned 500 (measured). Treat it as "not a file"
       and let the router decide. */
    let path = '';
    try {
      path = decodeURIComponent(context.url.pathname);
    } catch {
      /* not a file */
    }
    const asset = path ? loadAssetMeta(path) : undefined;
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

    const etag = `W/"${asset.updated.toString(36)}-${asset.size.toString(36)}"`;
    const headers: Record<string, string> = {
      'Content-Type': asset.mime,
      'Cache-Control': preview ? 'no-store' : 'no-cache',
      ETag: etag,
      /* Says a seek is possible. A player that does not see this downloads the
         whole file before it will let anyone scrub it. */
      'Accept-Ranges': 'bytes',
      /* The stored type is the only type. Without this a browser may sniff an
         upload into something executable and run it on this origin. */
      'X-Content-Type-Options': 'nosniff',
    };

    /* `updated` is epoch SECONDS — what the editing panel writes
       (SiteContentService.SaveAsset). It was read as milliseconds and every
       file claimed to date from January 1970 (measured). Rows written by the
       old seed script hold a truncated, future-looking number; a date the
       server cannot stand behind is left out rather than sent. */
    const degisti = asset.updated * 1000;
    if (degisti > 0 && degisti < Date.now() + 86_400_000) {
      headers['Last-Modified'] = new Date(degisti).toUTCString();
    }

    /* WARNING: AN SVG IS A DOCUMENT, NOT A PICTURE. Inside an <img> a browser
       already refuses its scripts, but a visitor who opens the file's own URL
       gets a full document on this origin - so an uploaded logo could read the
       preview cookie and rewrite the page. The policy leaves drawing alone and
       takes scripting away; it costs nothing for the honest logos we serve. */
    if (asset.mime === 'image/svg+xml') {
      headers['Content-Security-Policy'] =
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";
    }

    if (context.request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers });
    }

    /* `If-Range` guards a resumed download: if the file changed since the
       player started, the pieces it already has are stale and it must be given
       the whole thing rather than a chunk of a different file. */
    const ifRange = context.request.headers.get('if-range');
    const range =
      ifRange && ifRange !== etag ? null : parseRange(context.request.headers.get('range'), asset.size);

    if (range === 'invalid') {
      return new Response(null, {
        status: 416,
        headers: { ...headers, 'Content-Range': `bytes */${asset.size}` },
      });
    }

    /* A FILM IS STREAMED FROM DISK (panel §5.223): only the bytes a player
       asks for are read, and nothing is held in memory — a 2 GB video costs
       the same as a 2 MB one. A HEAD request opens no file at all. */
    if (asset.filePath) {
      const head = context.request.method === 'HEAD';
      const stream = (start: number, end: number) =>
        head ? null : (Readable.toWeb(createReadStream(asset.filePath!, { start, end })) as ReadableStream);
      if (range) {
        return new Response(stream(range.start, range.end), {
          status: 206,
          headers: {
            ...headers,
            'Content-Range': `bytes ${range.start}-${range.end}/${asset.size}`,
            'Content-Length': String(range.end - range.start + 1),
          },
        });
      }
      return new Response(asset.size > 0 ? stream(0, asset.size - 1) : null, {
        status: 200,
        headers: { ...headers, 'Content-Length': String(asset.size) },
      });
    }

    if (range) {
      const length = range.end - range.start + 1;
      const chunk = loadAssetSlice(path, range.start, length);
      if (chunk) {
        return new Response(chunk, {
          status: 206,
          headers: {
            ...headers,
            'Content-Range': `bytes ${range.start}-${range.end}/${asset.size}`,
            'Content-Length': String(chunk.byteLength),
          },
        });
      }
    }

    const bytes = loadAssetBytes(path);
    if (!bytes) return new Response(null, { status: 404, headers });
    return new Response(bytes, {
      status: 200,
      headers: { ...headers, 'Content-Length': String(bytes.byteLength) },
    });
  }, preview);
});

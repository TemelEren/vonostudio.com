import { defineMiddleware } from 'astro:middleware';
import { loadAsset, withDatabase } from './db';

/**
 * Every request runs inside one database connection (see withDatabase), and the
 * files that used to sit in /public are served straight out of it.
 *
 * Responses carry an ETag but are marked `no-cache`: browsers re-check on every
 * request, so a replaced photo shows up at once, while unchanged ones cost a
 * 304 instead of the whole file.
 */
export const onRequest = defineMiddleware((context, next) =>
  withDatabase(async () => {
    const asset = loadAsset(decodeURIComponent(context.url.pathname));
    if (!asset) return next();

    const etag = `W/"${asset.updated.toString(36)}-${asset.bytes.byteLength.toString(36)}"`;
    const headers = {
      'Content-Type': asset.mime,
      'Cache-Control': 'no-cache',
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
  })
);

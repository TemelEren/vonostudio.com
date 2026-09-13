// The Instagram strip under the contact map — an OPTIONAL, editor-owned list.

/**
 * One post in the strip: a file uploaded through the panel plus the link that
 * opens the post on Instagram.
 *
 * WARNING: THE FILES ARE OURS, NOT INSTAGRAM'S. An Instagram embed does not
 * autoplay, cannot be styled from here and brings Meta's script and cookies
 * into the page. The editor downloads the reel and uploads it (panel → Web
 * Sitesi → Instagram); the site plays it from its own assets table like every
 * other picture and film.
 */
export interface InstagramPost {
  src: string;
  kind: 'image' | 'video';
  /** Still shown before a film starts. Empty: the first frame. */
  poster: string;
  /** https only. Empty: the tile is not a link. */
  link: string;
}

/** More than this is a gallery, not a strip — and every film is a decoder. */
export const INSTAGRAM_MAX = 24;

const VIDEO_RE = /\.(mp4|webm)$/i;

/* A site path, never a protocol-relative one: "//evil.example/x.mp4" also
   starts with a slash and would load a third party's file into the page. */
const localPath = (v: unknown): string => {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  return s.startsWith('/') && !s.startsWith('//') ? s : '';
};

/* WARNING: THE LINK GOES STRAIGHT INTO href. `javascript:` and `data:` are not
   links, so only https survives; anything else leaves the tile unlinked rather
   than clickable into something the editor did not mean. */
const httpsLink = (v: unknown): string => {
  if (typeof v !== 'string') return '';
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
};

/**
 * A stored row turned into something safe to render.
 *
 * WARNING: THE PANEL HOLDS THE SAME RULES (lib/siteIcerik.js → instagramCoz).
 * The two repositories share no code, so the rules are written twice and a
 * test compares them - if they drift the panel shows one strip and the visitor
 * another.
 */
export function resolveInstagram(raw: unknown): InstagramPost[] {
  if (!Array.isArray(raw)) return [];
  const out: InstagramPost[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const src = localPath(o.src);
    if (!src) continue;
    const kind = VIDEO_RE.test(src) ? 'video' : 'image';
    out.push({
      src,
      kind,
      poster: kind === 'video' ? localPath(o.poster) : '',
      link: httpsLink(o.link),
    });
    if (out.length >= INSTAGRAM_MAX) break;
  }
  return out;
}

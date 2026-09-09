import type { Project, ProjectMediaItem } from './types';

/**
 * The media strip of a project detail page — the pictures and films, in the
 * order the editor put them in.
 *
 * These used to be two fields: one `cover` that opened the page full-bleed and
 * a `gallery` that followed it in a fixed two-column grid. The order was a
 * consequence of which field a file had been typed into, and the sizes were the
 * same for every project. This module turns whatever a project happens to carry
 * into one ordered, printable list.
 *
 * Three rules make that safe:
 *
 * 1. A project written before the list existed still has a page. `media`
 *    absent means "not migrated", and the strip is derived from
 *    `[cover, ...gallery]` — nothing is lost and nothing has to be rewritten.
 *    An EMPTY list is not the same thing: `media: []` is a deliberate "this
 *    project has no pictures".
 *
 * 2. `cover` stays its own field. It is the card image and the picture every
 *    shared link shows, so it must exist whether or not the detail page happens
 *    to open with it.
 *
 * 3. WHAT REACHES A STYLE ATTRIBUTE IS VALIDATED, NOT ESCAPED. `span` and
 *    `ratio` are written into the element's inline style, and they come out of
 *    a database an editor can type into. Numbers are parsed and clamped and a
 *    ratio has to match a shape; anything else falls back to the default rather
 *    than being passed through (same rule the theme colours follow, db/theme.ts).
 */

export type MediaKind = 'image' | 'video';

/** Columns the strip is laid out on. Referenced by the CSS, so it lives here. */
export const MEDIA_COLUMNS = 3;

/**
 * Files the site plays rather than draws.
 *
 * WARNING: this list has to agree with what the panel is allowed to upload
 * (SiteContentService.AssetMime) and with what the middleware will serve. A
 * type only the site knows about would be picked as a video and then arrive as
 * a download.
 */
const VIDEO_EXT = ['.mp4', '.webm'];

/**
 * The widths an untouched project falls into, cycled.
 *
 * The scatter comes from HEIGHT, not width. The strip is packed (see the note
 * in ProjectDetail.astro): items of one width but different proportions each
 * follow the shortest column, which is how the reference this was measured
 * against gets its look — one width, nine different starting heights. These
 * covers run 1.26:1 to 3.29:1, so equal columns already stagger by a lot.
 *
 * The first item is the exception, and deliberately so: it is the picture the
 * page opens on, and most projects here carry only a cover — one item alone
 * should be the full width rather than two thirds of it.
 *
 * HISTORICAL NOTE, so nobody re-derives it the hard way: a 2+1 rhythm was tried
 * while the strip was still laid out in ROWS and left a 447px band of white,
 * because a row was as tall as its tallest item and nothing fell back into the
 * gap. Packing removes that particular trap, but a two-column item still needs
 * two adjacent free columns, so wide items placed at random can stair-step. The
 * default therefore stays plain and any single item can still be given its own
 * `span` — an editor who wants a 2+1 row can ask for one.
 */
export const SPAN_RHYTHM = [3, 1, 1, 1];

/** Default box for a film: its real shape is unknown until the file loads. */
const VIDEO_RATIO = '16/9';

/** A ratio is two positive numbers and a slash. Anything else is not one. */
const RATIO_RE = /^\d{1,4}(?:\.\d{1,3})?\s*\/\s*\d{1,4}(?:\.\d{1,3})?$/;

export interface ResolvedMedia {
  src: string;
  kind: MediaKind;
  /** Empty when there is none — the player then shows its first frame. */
  poster: string;
  span: number;
  /** Empty means "keep the file's own shape"; only a picture can do that. */
  ratio: string;
}

/**
 * Whether a source is played or drawn.
 *
 * The extension decides, because that is what the stored file actually is. An
 * explicit `kind` is only consulted when the name cannot say — an address with
 * no extension — so a `.jpg` can never be declared a film.
 */
export function mediaKind(src: string, declared?: MediaKind): MediaKind {
  const path = String(src ?? '').split(/[?#]/)[0].toLowerCase();
  if (VIDEO_EXT.some((ext) => path.endsWith(ext))) return 'video';
  if (/\.[a-z0-9]{2,5}$/.test(path)) return 'image';
  return declared === 'video' ? 'video' : 'image';
}

function span(value: unknown, index: number): number {
  const n = Math.round(Number(value));
  if (Number.isFinite(n) && n >= 1 && n <= MEDIA_COLUMNS) return n;
  return SPAN_RHYTHM[index % SPAN_RHYTHM.length];
}

function ratio(value: unknown, kind: MediaKind): string {
  const text = String(value ?? '').trim();
  if (RATIO_RE.test(text)) return text.replace(/\s+/g, '');
  // A film has no shape until it loads; without a box the page would jump.
  return kind === 'video' ? VIDEO_RATIO : '';
}

/** The strip, ready to print: every row has a kind, a width and a box. */
export function resolveProjectMedia(project: Project): ResolvedMedia[] {
  const list: ProjectMediaItem[] = Array.isArray(project.media)
    ? project.media
    : [project.cover, ...(project.gallery ?? [])].map((src) => ({ src: String(src ?? '') }));

  return list
    .filter((item): item is ProjectMediaItem => !!item && !!String(item.src ?? '').trim())
    .map((item, i) => {
      const src = String(item.src).trim();
      const kind = mediaKind(src, item.kind);
      return {
        src,
        kind,
        poster: kind === 'video' ? String(item.poster ?? '').trim() : '',
        span: span(item.span, i),
        ratio: ratio(item.ratio, kind),
      };
    });
}

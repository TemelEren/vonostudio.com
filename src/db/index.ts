import { AsyncLocalStorage } from 'node:async_hooks';
import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Locale } from '../i18n/locale';
import type { About, Project, Reference, Service, Settings, Theme } from './types';
import { resolveTheme } from './theme';

export type * from './types';
export * from './projectMeta';
export * from './projectMedia';
export * from './instagram';
import { resolveInstagram, type InstagramPost } from './instagram';
export * from './projectCategories';
export * from './sectionOrder';
import { resolveCategories, type ProjectCategory } from './projectCategories';
import { resolveSectionOrder, type SectionKey } from './sectionOrder';
export * from './theme';

/** Path to the content database. Overridable so staging/live can differ. */
export const DB_PATH = process.env.CONTENT_DB ?? 'content.db';

interface Scope {
  db: DatabaseSync;
  /** Per-request memo, so a page that asks for the strings six times reads once. */
  memo: Map<string, unknown>;
}

const scope = new AsyncLocalStorage<Scope>();

/**
 * The DRAFT database, when the editing tool is set up to use one.
 *
 * The panel writes every edit here and copies it onto {@link DB_PATH} only when
 * someone publishes, so a preview request has to be able to read it. Unset (the
 * default) means there is no draft and preview mode can never turn on.
 */
export const DRAFT_DB_PATH = process.env.CONTENT_DRAFT_DB ?? '';

/**
 * Shared secret the panel appends to a preview link.
 *
 * WARNING: THE SITE DECIDES, NOT THE CALLER. Draft content is unpublished work;
 * without a token that matches this value the request is served from the live
 * database, so a guessed URL leaks nothing. An empty value disables preview
 * outright — the safe default for a production box that never previews.
 */
export const PREVIEW_TOKEN = process.env.PREVIEW_TOKEN ?? '';

/** Whether a token unlocks the draft. Both sides must be configured. */
export function previewAllowed(token: string | null | undefined): boolean {
  if (!DRAFT_DB_PATH || !PREVIEW_TOKEN) return false;
  return typeof token === 'string' && token.length > 0 && token === PREVIEW_TOKEN;
}

/* WARNING: A READER MUST WAIT FOR THE PANEL, NOT FAIL. content.db runs in
   rollback-journal mode, and while the editing panel commits (a publish
   rewrites every row in one transaction, ~30 ms) new readers are refused.
   node:sqlite's busy timeout defaults to 0, so the refusal became an immediate
   "database is locked" and a 500 for whoever was loading a page — measured:
   5 of 63 visitor requests failed during 12 publishes. Waiting a few
   milliseconds is invisible; failing is not. (WAL would avoid the lock, but it
   needs a writable -shm file, which this process may not have when the panel
   runs as a different user.) */
const BUSY_MS = 5000;

function open(path: string): DatabaseSync {
  try {
    return new DatabaseSync(path, { readOnly: true, timeout: BUSY_MS });
  } catch (error) {
    // A database left in WAL mode can refuse read-only connections when no
    // writer has created the -shm file yet. Fall back to a normal connection;
    // this process still never writes.
    if (String(error).includes('unable to open database file')) {
      return new DatabaseSync(path, { timeout: BUSY_MS });
    }
    throw error;
  }
}

/**
 * Runs `fn` with a freshly opened database, closed again when it settles.
 *
 * One connection per request is what makes edits show up immediately: nothing
 * is carried over between requests, so the next page load sees whatever the
 * editing tool has committed — even if it replaced the file wholesale.
 *
 * `draft` swaps in the unpublished database for this request only. It is chosen
 * per request rather than per process so one server can serve the public site
 * and its preview at the same time; the middleware is the only caller that may
 * ask for it, and only after {@link previewAllowed} has said yes.
 */
export async function withDatabase<T>(fn: () => Promise<T>, draft = false): Promise<T> {
  // A draft that is asked for but missing must not silently fall back to live:
  // the preview would look correct while showing the wrong content.
  const path = draft ? DRAFT_DB_PATH : DB_PATH;
  const db = open(path);
  try {
    return await scope.run({ db, memo: new Map() }, fn);
  } finally {
    db.close();
  }
}

function read<T>(key: string, fn: (db: DatabaseSync) => T): T {
  const active = scope.getStore();
  if (!active) {
    throw new Error(
      'Content was requested outside a request scope — did the middleware not run?'
    );
  }
  if (!active.memo.has(key)) active.memo.set(key, fn(active.db));
  return active.memo.get(key) as T;
}

/** Reads one JSON document out of the `content` table. */
function document<T>(key: string): T {
  return read(`content:${key}`, (db) => {
    const row = db.prepare('SELECT data FROM content WHERE key = ?').get(key) as
      | { data: string }
      | undefined;
    if (!row) throw new Error(`content.db: "${key}" satırı yok / row missing`);
    return JSON.parse(row.data) as T;
  });
}


/**
 * Reads a JSON document that MAY NOT EXIST YET.
 *
 * WARNING: `document` throws on a missing row and that is right for the six the
 * site cannot render without. A row added later — the theme is the first — must
 * not take the site down on databases written before it existed; the caller
 * falls back to the built-in default instead.
 */
function optionalDocument<T>(key: string): T | null {
  return read(`content?:${key}`, (db) => {
    const row = db.prepare('SELECT data FROM content WHERE key = ?').get(key) as
      | { data: string }
      | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data) as T;
    } catch {
      // Unreadable JSON is treated as absent: a half-written theme should show
      // the default look, not a stack trace where the home page used to be.
      return null;
    }
  });
}

/** The editable look. Missing or invalid rows resolve to the original design. */
export const loadTheme = (): Theme => resolveTheme(optionalDocument<Theme>('theme'));

/* Optional like the theme: no row means no filter row, and the grid renders
   exactly as it did before categories existed. */
export const loadProjectCategories = (): ProjectCategory[] =>
  resolveCategories(optionalDocument<unknown>('projectCategories'));

/* Also optional, and it can only REORDER: a missing or broken row leaves the
   page in its shipped order rather than dropping a section (db/sectionOrder.ts). */
export const loadSectionOrder = (): SectionKey[] =>
  resolveSectionOrder(optionalDocument<unknown>('sectionOrder'));

/* Optional as well: no row means no Instagram strip under the map (db/instagram.ts). */
export const loadInstagram = (): InstagramPost[] =>
  resolveInstagram(optionalDocument<unknown>('instagram'));

export const loadSettings = () => document<Settings>('settings');
export const loadAbout = () => document<About>('about');
export const loadServices = () => document<Service[]>('services');
export const loadReferences = () => document<Reference[]>('references');
export const loadStrings = (locale: Locale) => document<Record<string, string>>(`strings.${locale}`);

export function loadProjects(): Project[] {
  return read('projects', (db) => {
    const rows = db
      .prepare('SELECT data FROM projects ORDER BY position, slug')
      .all() as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as Project);
  });
}

export function loadProject(slug: string): Project | undefined {
  return read(`project:${slug}`, (db) => {
    const row = db.prepare('SELECT data FROM projects WHERE slug = ?').get(slug) as
      | { data: string }
      | undefined;
    return row ? (JSON.parse(row.data) as Project) : undefined;
  });
}

/**
 * Folder the films live in, beside the live database.
 *
 * WARNING: FILMS ARE NOT IN THE DATABASE (panel §5.223). Reading a range of a
 * blob with `substr` loads the WHOLE value first — measured: 470 ms and the full
 * 400 MB for every 4 MB a player asks for — and one SQLite value cannot exceed
 * 1 GB at all. A film row keeps `bytes` empty and `file` names
 * "<sha256>.<ext>" in this folder. Draft and live share it: the name is the
 * content's hash, so the file never changes under a published row.
 */
export const MEDIA_DIR = process.env.CONTENT_MEDIA_DIR || join(dirname(DB_PATH), 'content-medya');

/** The only names ever joined to {@link MEDIA_DIR}.
 *
 * WARNING: EVERY UPLOADED TYPE, NOT ONLY FILMS (panel §5.229). Pictures and fonts
 * are written to the folder too now; a pattern that still said mp4|webm would
 * answer every new photograph with a 404. The list is the panel's AssetMime
 * keys (SiteContentService.cs) - a test compares the two. */
const MEDIA_NAME = /^[0-9a-f]{64}\.(avif|gif|ico|jpeg|jpg|png|svg|webp|pdf|txt|woff2|woff|ttf|otf|mp4|webm)$/;

/** What a stored file is, without reading the file. */
export interface AssetMeta {
  path: string;
  mime: string;
  /** Bytes on disk. Needed for Content-Length and for range arithmetic. */
  size: number;
  updated: number;
  /** Absolute path of a film stored outside the database; absent for the rest. */
  filePath?: string;
}

/* Databases seeded before films moved to disk have no `file` column. Asked once
   per request: the panel adds the column the first time it writes a film, and
   the site must keep serving pictures from a database it has not touched. */
function hasFileColumn(db: DatabaseSync): boolean {
  return read('assets-file-column', () =>
    (db.prepare("SELECT count(*) AS n FROM pragma_table_info('assets') WHERE name = 'file'").get() as { n: number }).n > 0
  );
}

/**
 * Looks up a file that used to live under /public, by its URL path.
 *
 * WARNING: THE BYTES ARE NOT READ HERE. A film is tens of megabytes and a
 * browser asks for it in pieces; materialising the whole blob to answer "does
 * this exist and how big is it" would pull the entire file into memory for
 * every seek. The caller asks for the part it is about to send.
 *
 * WARNING: A ROW IS NOT A TRUSTED PATH. Only a "<64 hex>.<ext>" name is joined
 * to the media folder, so an edited row ("../../etc/passwd") serves nothing. A
 * film whose file is missing answers as not found — sending the row's empty
 * `bytes` would be a video that silently never plays.
 */
export function loadAssetMeta(path: string): AssetMeta | undefined {
  return read(`asset-meta:${path}`, (db) => {
    const withFile = hasFileColumn(db);
    const row = db
      .prepare(
        `SELECT path, mime, length(bytes) AS size, updated${withFile ? ', file' : ''} FROM assets WHERE path = ?`
      )
      .get(path) as (AssetMeta & { file?: string | null }) | undefined;
    if (!row) return undefined;
    const { file, ...meta } = row;
    if (!file) return meta;
    if (!MEDIA_NAME.test(file)) return undefined;
    const filePath = join(MEDIA_DIR, file);
    try {
      return { ...meta, size: statSync(filePath).size, filePath };
    } catch {
      console.warn(`[assets] ${path}: film file missing in ${MEDIA_DIR} (${file})`);
      return undefined;
    }
  });
}

/** The whole file. */
export function loadAssetBytes(path: string): Uint8Array<ArrayBuffer> | undefined {
  return read(`asset:${path}`, (db) => {
    const row = db.prepare('SELECT bytes FROM assets WHERE path = ?').get(path) as
      | { bytes: Uint8Array<ArrayBuffer> }
      | undefined;
    return row?.bytes;
  });
}

/**
 * `length` bytes starting at `start` (0-based).
 *
 * WARNING: SQLite's `substr` is 1-BASED. Passing an HTTP range offset straight
 * through would shift every chunk by one byte — which a picture survives and a
 * video container does not.
 */
export function loadAssetSlice(
  path: string,
  start: number,
  length: number
): Uint8Array<ArrayBuffer> | undefined {
  return read(`asset-slice:${path}:${start}:${length}`, (db) => {
    const row = db
      .prepare('SELECT substr(bytes, ?, ?) AS chunk FROM assets WHERE path = ?')
      .get(start + 1, length, path) as { chunk: Uint8Array<ArrayBuffer> } | undefined;
    return row?.chunk;
  });
}

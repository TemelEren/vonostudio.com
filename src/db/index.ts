import { AsyncLocalStorage } from 'node:async_hooks';
import { DatabaseSync } from 'node:sqlite';
import type { Locale } from '../i18n/locale';
import type { About, Asset, Project, Reference, Service, Settings, Theme } from './types';
import { resolveTheme } from './theme';

export type * from './types';
export * from './projectMeta';
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

function open(path: string): DatabaseSync {
  try {
    return new DatabaseSync(path, { readOnly: true });
  } catch (error) {
    // A database left in WAL mode can refuse read-only connections when no
    // writer has created the -shm file yet. Fall back to a normal connection;
    // this process still never writes.
    if (String(error).includes('unable to open database file')) {
      return new DatabaseSync(path);
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

/** Looks up a file that used to live under /public, by its URL path. */
export function loadAsset(path: string): Asset | undefined {
  return read(`asset:${path}`, (db) => {
    const row = db.prepare('SELECT path, mime, bytes, updated FROM assets WHERE path = ?').get(path);
    return row as Asset | undefined;
  });
}

import { AsyncLocalStorage } from 'node:async_hooks';
import { DatabaseSync } from 'node:sqlite';
import type { Locale } from '../i18n/locale';
import type { About, Asset, Project, Reference, Service, Settings } from './types';

export type * from './types';
export * from './projectMeta';

/** Path to the content database. Overridable so staging/live can differ. */
export const DB_PATH = process.env.CONTENT_DB ?? 'content.db';

interface Scope {
  db: DatabaseSync;
  /** Per-request memo, so a page that asks for the strings six times reads once. */
  memo: Map<string, unknown>;
}

const scope = new AsyncLocalStorage<Scope>();

function open(): DatabaseSync {
  try {
    return new DatabaseSync(DB_PATH, { readOnly: true });
  } catch (error) {
    // A database left in WAL mode can refuse read-only connections when no
    // writer has created the -shm file yet. Fall back to a normal connection;
    // this process still never writes.
    if (String(error).includes('unable to open database file')) {
      return new DatabaseSync(DB_PATH);
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
 */
export async function withDatabase<T>(fn: () => Promise<T>): Promise<T> {
  const db = open();
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

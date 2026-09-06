// Builds content.db from the files in seed/ — the starting point for the
// editing tool, and the way to reset a preview environment to known content.
//
//   node scripts/seed.mjs [--db content.db] [--from seed]
//
// The schema it creates is the contract this site reads; see DATA-MODEL.md.
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const dbPath = flag('db', process.env.CONTENT_DB ?? 'content.db');
const seedDir = flag('from', 'seed');
const contentDir = join(seedDir, 'content');
const publicDir = join(seedDir, 'public');

const MIME = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const mimeFor = (name) => {
  const dot = name.lastIndexOf('.');
  return MIME[name.slice(dot).toLowerCase()] ?? 'application/octet-stream';
};

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name !== '.gitkeep') yield full;
  }
}

const json = (path) => readFileSync(path, 'utf8');

const db = new DatabaseSync(dbPath);
db.exec(`
  DROP TABLE IF EXISTS content;
  DROP TABLE IF EXISTS projects;
  DROP TABLE IF EXISTS assets;

  -- Single documents: settings, about, services, references, strings.tr, strings.en
  CREATE TABLE content (
    key  TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  -- One row per project. 'position' sets the order on the site.
  CREATE TABLE projects (
    slug     TEXT PRIMARY KEY,
    position INTEGER NOT NULL,
    data     TEXT NOT NULL
  );

  -- Everything that used to live under /public, keyed by its URL path.
  CREATE TABLE assets (
    path    TEXT PRIMARY KEY,
    mime    TEXT NOT NULL,
    bytes   BLOB NOT NULL,
    updated INTEGER NOT NULL
  );
`);

const insertContent = db.prepare('INSERT INTO content (key, data) VALUES (?, ?)');
const insertProject = db.prepare('INSERT INTO projects (slug, position, data) VALUES (?, ?, ?)');
const insertAsset = db.prepare(
  'INSERT INTO assets (path, mime, bytes, updated) VALUES (?, ?, ?, ?)'
);

db.exec('BEGIN');

for (const key of ['settings', 'about', 'services', 'references', 'strings.tr', 'strings.en']) {
  insertContent.run(key, json(join(contentDir, `${key}.json`)));
}

// Files are named 01-slug.json, 02-… — that number becomes the sort position.
const projectFiles = readdirSync(join(contentDir, 'projects')).filter((f) => f.endsWith('.json'));
for (const [index, file] of projectFiles.sort().entries()) {
  const data = json(join(contentDir, 'projects', file));
  const { slug } = JSON.parse(data);
  if (!slug) throw new Error(`${file}: "slug" alanı eksik / missing field`);
  insertProject.run(slug, (index + 1) * 10, data);
}

let assets = 0;
for (const file of walk(publicDir)) {
  const path = `/${relative(publicDir, file).split(sep).join('/')}`;
  insertAsset.run(path, mimeFor(file), readFileSync(file), statSync(file).mtimeMs | 0);
  assets += 1;
}

db.exec('COMMIT');
db.close();

console.log(
  `${dbPath}: 6 content rows, ${projectFiles.length} projects, ${assets} assets`
);

import type { Locale } from '../i18n/locale';
import type { Localized, Project } from './types';

/**
 * The project meta strip — the "Yıl · Konum · Alan · Durum · Kategori" line
 * under a project title.
 *
 * These used to be five fixed fields on `Project`. They are rows now: an
 * editor can rename them, reorder them, drop the ones a project has no answer
 * for, and add anything else it needs ("Sahip: Ali"). This module is the one
 * place that turns whatever a row happens to hold into something printable.
 *
 * Two rules make that safe:
 *
 * 1. `key` is the row's IDENTITY, its label is only its caption. The project
 *    card and the structured data look `category`, `location` and `year` up by
 *    key, so renaming "Yıl" to "Tarih" keeps them working — while deleting the
 *    row genuinely removes the value, and nothing invents it back.
 *
 * 2. The value's SHAPE says whether it is translated. A plain string reads the
 *    same in both languages (a year, a m² figure); a `{ tr, en }` pair is text
 *    that must be translated, and its empty side is reported by the editor's
 *    health check. A separate boolean next to the value could disagree with it.
 */

/** The rows a project starts with, in the order they are printed. */
export const DEFAULT_META_KEYS = ['year', 'location', 'area', 'status', 'category'] as const;

export type DefaultMetaKey = (typeof DEFAULT_META_KEYS)[number];

/** The interface string a default row falls back to when it has no label. */
export type MetaLabelKey = `project.${DefaultMetaKey}`;

const isDefaultKey = (key: string | undefined): key is DefaultMetaKey =>
  !!key && (DEFAULT_META_KEYS as readonly string[]).includes(key);

export interface ResolvedMeta {
  key?: string;
  /** Written only once someone renames the row; otherwise `labelKey` is used. */
  label?: Localized;
  /** Set on the five defaults so an untouched label still follows the UI strings. */
  labelKey?: MetaLabelKey;
  value: string | Localized;
}

/** Reads one side of a value that may or may not be translated. */
export function pick(value: string | Localized | undefined | null, locale: Locale): string {
  if (value == null) return '';
  return typeof value === 'string' ? value : (value[locale] ?? '');
}

/**
 * The strip a project should print, whatever shape its row is stored in.
 *
 * A project written before the strip became editable carries the five typed
 * fields and no `meta` list; it keeps working untouched, and its labels keep
 * coming from the interface strings. Once `meta` exists it is the only source —
 * an empty list means the editor deliberately cleared the strip.
 */
export function resolveProjectMeta(project: Project): ResolvedMeta[] {
  if (Array.isArray(project.meta)) {
    return project.meta.map((row) => ({
      key: row?.key,
      label: row?.label,
      labelKey: isDefaultKey(row?.key) ? (`project.${row.key}` as MetaLabelKey) : undefined,
      value: row?.value ?? '',
    }));
  }

  const legacy: Record<DefaultMetaKey, string | Localized | undefined> = {
    year: project.year,
    location: project.location,
    area: project.area,
    status: project.status,
    category: project.category,
  };
  return DEFAULT_META_KEYS.map((key) => ({
    key,
    labelKey: `project.${key}` as MetaLabelKey,
    value: legacy[key] ?? '',
  }));
}

/** One keyed value, or '' when the project no longer carries that row. */
export function metaText(project: Project, key: DefaultMetaKey, locale: Locale): string {
  const row = resolveProjectMeta(project).find((r) => r.key === key);
  return row ? pick(row.value, locale).trim() : '';
}

/**
 * The subtitle under a project card: "Kategori · Konum, Yıl".
 *
 * Each part is dropped when its row is gone rather than leaving a stray
 * separator. If none of the three keyed rows survive, the first few values the
 * project does carry are used — an empty subtitle would read as missing data.
 */
export function projectCardLine(project: Project, locale: Locale): string {
  const head = [metaText(project, 'category', locale), metaText(project, 'location', locale)]
    .filter(Boolean)
    .join(' · ');
  const line = [head, metaText(project, 'year', locale)].filter(Boolean).join(', ');
  if (line) return line;

  return resolveProjectMeta(project)
    .map((row) => pick(row.value, locale).trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');
}

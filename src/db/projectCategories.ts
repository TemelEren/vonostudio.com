// The filter row above the project grid — an OPTIONAL, editor-owned grouping.
import type { Localized, Project } from './types';
import type { Locale } from '../i18n/locale';
import { pick } from './projectMeta';

/**
 * One filter button.
 *
 * WARNING: `key` IS THE IDENTITY, `label` IS ONLY WHAT IT SAYS. Projects store
 * keys, so renaming "Konut" to "Yaşam Alanları" must not detach a single
 * project. The panel generates the key once and never rewrites it.
 */
export interface ProjectCategory {
  key: string;
  label: Localized;
}

const KEY_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

const localized = (v: unknown): Localized | null => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const tr = typeof o.tr === 'string' ? o.tr.trim() : '';
  const en = typeof o.en === 'string' ? o.en.trim() : '';
  return tr || en ? { tr, en } : null;
};

/**
 * A stored row turned into something safe to render.
 *
 * An invalid entry is dropped rather than rendered as an empty button: a filter
 * with no name cannot be understood, and one with a malformed key can never
 * match a project. Duplicated keys collapse to the first — two buttons carrying
 * the same key would filter identically and read as a bug.
 */
export function resolveCategories(raw: unknown): ProjectCategory[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ProjectCategory[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const key = typeof o.key === 'string' ? o.key.trim().toLowerCase() : '';
    const label = localized(o.label);
    if (!KEY_RE.test(key) || !label || seen.has(key)) continue;
    seen.add(key);
    out.push({ key, label });
  }
  return out.slice(0, 24);
}

/** The keys a project claims, cleaned the same way the catalogue is. */
export function projectCategoryKeys(project: Project): string[] {
  const raw = (project as { categories?: unknown }).categories;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    const key = typeof v === 'string' ? v.trim().toLowerCase() : '';
    if (KEY_RE.test(key) && !out.includes(key)) out.push(key);
  }
  return out;
}

/**
 * The categories that are worth showing, with the number of projects behind each.
 *
 * WARNING: AN EMPTY CATEGORY IS NOT RENDERED. A button that filters the grid
 * down to nothing is a dead control; the visitor cannot tell it from a bug. The
 * editor still sees it in the panel, where the emptiness is the useful signal.
 */
export function usableCategories(
  categories: ProjectCategory[],
  projects: Project[]
): (ProjectCategory & { count: number })[] {
  return categories
    .map((c) => ({
      ...c,
      count: projects.filter((p) => projectCategoryKeys(p).includes(c.key)).length,
    }))
    .filter((c) => c.count > 0);
}

/** The label in this locale; falls back to the other rather than showing blank. */
export const categoryLabel = (c: ProjectCategory, locale: Locale): string =>
  pick(c.label, locale) || c.label.tr || c.label.en || c.key;

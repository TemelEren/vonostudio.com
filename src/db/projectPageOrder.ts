// The order of the blocks under a project's name — an OPTIONAL, editor-owned list (2026-10-17).

/**
 * Every block the project page stacks under the name, in the order it ships with.
 *
 * Editor, 2026-10-17: "Proje sayfasında proje adının altında proje bilgisi onun
 * altında da uzun yazılan proje metni olsun istiyorum. Aynı zamanda erp
 * sisteminden de bunların yer değişikliğini yapabilmeliyim." So the shipped order
 * is name → info → text → pictures, and the panel (Web Sitesi → Görünüm) can
 * reorder the three blocks.
 *
 * WARNING: THIS REVERSES 2026-09-12 ON PURPOSE. Then the text was moved under the
 * pictures because it pushed the first photograph down; the editor now wants it
 * above them and can put it back below with one click — the choice is theirs.
 *
 * WARNING: THE NAME IS NOT IN THE LIST. It is the page's heading (h1) with the
 * back link above it; a heading under the gallery would not be a heading. Same
 * reasoning as the home page's opening animation, which is not reorderable either.
 *
 * WARNING: THE PANEL SHIPS ITS OWN COPY (lib/siteSchema.js → PROJE_BLOKLARI) and a
 * test compares the two; keys are the storage identity — never rename one.
 */
export const PROJECT_BLOCKS = ['info', 'text', 'media'] as const;

export type ProjectBlock = (typeof PROJECT_BLOCKS)[number];

/**
 * A stored order turned into something safe to render.
 *
 * WARNING: THIS ORDERS, IT NEVER OMITS (the sectionOrder.ts rule). A list that
 * dropped a block would let a half-saved row silently delete a project's
 * pictures from the published site. Anything the stored list does not mention is
 * appended in its shipped position.
 */
export function resolveProjectPageOrder(raw: unknown): ProjectBlock[] {
  const out: ProjectBlock[] = [];
  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (typeof v !== 'string') continue;
      const key = v.trim().toLowerCase() as ProjectBlock;
      if (PROJECT_BLOCKS.includes(key) && !out.includes(key)) out.push(key);
    }
  }
  for (const key of PROJECT_BLOCKS) if (!out.includes(key)) out.push(key);
  return out;
}

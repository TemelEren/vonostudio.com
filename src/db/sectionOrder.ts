// The order the home page stacks its sections in — an OPTIONAL, editor-owned list.

/** Every section the home page can stack, in the order it shipped with. */
export const SECTIONS = ['projects', 'services', 'about', 'references', 'contact'] as const;

export type SectionKey = (typeof SECTIONS)[number];

/**
 * The anchor each section carries, and whether the nav links to it.
 *
 * WARNING: THE ANCHORS ARE TURKISH AND STAY THAT WAY. They are in links people
 * have already shared and in the nav of the published site; renaming one turns
 * every existing "/#projeler" into a link that lands nowhere. The KEY beside it
 * is the identity used in storage - that one is English like the rest of the code.
 */
export const SECTION_ANCHOR: Record<SectionKey, string> = {
  projects: 'projeler',
  services: 'hizmetler',
  about: 'hakkimizda',
  references: 'referanslar',
  contact: 'iletisim',
};

/**
 * A stored order turned into something safe to render.
 *
 * WARNING: THIS ORDERS, IT NEVER OMITS. A list that dropped a section would let
 * a half-saved row silently delete Referanslar from the published site, and the
 * editor would have no way to tell a deliberate removal from a bug. Anything the
 * stored list does not mention is appended in its shipped position, so the worst
 * a broken row can do is leave the page in its original order.
 */
export function resolveSectionOrder(raw: unknown): SectionKey[] {
  const out: SectionKey[] = [];
  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (typeof v !== 'string') continue;
      const key = v.trim().toLowerCase() as SectionKey;
      if (SECTIONS.includes(key) && !out.includes(key)) out.push(key);
    }
  }
  for (const key of SECTIONS) if (!out.includes(key)) out.push(key);
  return out;
}

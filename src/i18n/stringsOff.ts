/**
 * Interface strings the editor has switched OFF (§5.231).
 *
 * An editor can hide a piece of copy - a section heading, a label, the phone
 * buttons - from the panel without deleting its text: the row stays, only the
 * element carrying it is not drawn. Stored as the optional `stringsOff` content
 * row, an array of keys. No row: every string is on, exactly as before.
 *
 * WARNING: SOME STRINGS CANNOT BE SWITCHED OFF, AND THE SITE ENFORCES IT, NOT
 * ONLY THE PANEL. The panel ships its own copy of this list (the two repos share
 * only content.db, UI-GELISTIRME section 1) and a copy can drift; a key in this
 * list is ignored in the row whatever the panel wrote. The reasons are not
 * taste:
 *  - the page title and description ARE the search result;
 *  - a button needs a name (the menu toggle, "All", "Show more") or it is an
 *    unlabelled control;
 *  - an image and a frame need a text alternative;
 *  - the cookie notice, its two equal buttons, its settings link and the policy
 *    are the consent mechanism (KVKK cookie guideline, §5.226) - hiding one of
 *    them would leave a consent flow that cannot be completed or withdrawn;
 *  - the 404 page has nothing else to say;
 *  - the project.* labels are not printed at all, so a switch would do nothing
 *    and only suggest that it did.
 */
export const LOCKED_STRINGS: readonly string[] = [
  'meta.title',
  'meta.description',
  'nav.menu',
  'projects.all',
  'projects.more',
  'about.photo.alt',
  'contact.map.title',
  'cookie.banner.text',
  'cookie.accept',
  'cookie.reject',
  'cookie.settings',
  'cookie.map.blocked',
  'cookie.map.load',
  'cookie.policy.title',
  'cookie.policy.body',
  'notfound.title',
  'notfound.home',
  'project.year',
  'project.location',
  'project.area',
  'project.status',
  'project.category',
];

/* A key is plain dotted identifiers - the same shape as the seed's keys. */
const KEY_RE = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/;

/** The switched-off keys a stored row may actually turn off. */
export function resolveStringsOff(raw: unknown): Set<string> {
  const list = Array.isArray(raw) ? raw : [];
  const out = new Set<string>();
  for (const item of list) {
    if (typeof item !== 'string') continue;
    const key = item.trim();
    if (!KEY_RE.test(key) || LOCKED_STRINGS.includes(key)) continue;
    out.add(key);
  }
  return out;
}

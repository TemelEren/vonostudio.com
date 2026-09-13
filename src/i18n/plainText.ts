/* Editable long copy - plain text with line breaks - turned into paragraphs.

   Used by the note under the contact mail (contact.email.note) and the cookie
   policy page (cookie.policy.body). The value comes from a text box in the
   panel, so it is NEVER HTML: nothing typed there can put markup on the page.

   Rules:
   - a blank line starts a new paragraph;
   - inside a paragraph the first line is its lead when more lines follow;
   - WARNING: A LEAD LEFT ON ITS OWN IS STILL A LEAD. Written the natural way -
     "…için," then an empty line then the sentence - the lead would become a
     one-line paragraph; a single line ending in a comma or colon is joined to
     the paragraph after it;
   - mail addresses become mailto links and https addresses become links - the
     text says "write to info@…" or "see Google's policy", and a visitor on a
     phone should be able to tap it. */

export type Piece = { text: string; href: string };
export type Paragraph = { lead: Piece[]; lines: Piece[][] };

const LINK_RE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+|https:\/\/[^\s<>"')]+)/g;

export function pieces(line: string): Piece[] {
  return line
    .split(LINK_RE)
    .filter((p) => p !== '')
    .map((p) => {
      if (p.startsWith('https://')) {
        /* A sentence may end right after the address: keep the full stop out. */
        const clean = p.replace(/[.,;:]+$/, '');
        return { text: clean, href: clean };
      }
      return { text: p, href: /^[^\s@]+@[^\s@]+$/.test(p) ? `mailto:${p}` : '' };
    });
}

export function paragraphs(text: string): Paragraph[] {
  const blocks = String(text || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.split('\n').map((x) => x.trim()).filter(Boolean))
    .filter((b) => b.length);
  const out: { lead: string; lines: string[] }[] = [];
  let pending = '';
  for (const b of blocks) {
    if (b.length === 1 && /[,:]$/.test(b[0]) && !pending) {
      pending = b[0];
      continue;
    }
    if (pending) out.push({ lead: pending, lines: b });
    else if (b.length > 1) out.push({ lead: b[0], lines: b.slice(1) });
    else out.push({ lead: '', lines: b });
    pending = '';
  }
  if (pending) out.push({ lead: pending, lines: [] });
  return out.map((p) => ({ lead: p.lead ? pieces(p.lead) : [], lines: p.lines.map(pieces) }));
}

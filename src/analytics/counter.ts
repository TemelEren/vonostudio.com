import { createHash, randomBytes } from 'node:crypto';

/* ================= VISIT COUNTER (ERP §5.327, 2026-10-02) =================
   The office asked to see the site's visitors in the ERP (PR → Analiz). This
   counts on THIS server and sends only numbers to the ERP every few minutes.

   WARNING: NO COOKIE, NO STORAGE, NO THIRD PARTY. Nothing is written into the
   visitor's browser and no analytics script is loaded, so the consent banner
   and the cookie inventory (consent/cookies.ts) do not change.

   WARNING: NOTHING PERSONAL LEAVES THIS PROCESS. To tell two visitors apart the
   IP and user agent are hashed with a salt that is random, held in memory and
   replaced every day; only the COUNT of distinct hashes is sent. The hashes
   themselves are never written down and die with the day (KVKK: the IP is
   personal data and there is no reason to keep it).

   What is counted: a successful GET of an HTML page, not in preview, not by a
   crawler. Per day: views, distinct visitors, mobile/desktop (per visitor),
   views per path, and where visits came from (another site's host, or "" for
   a typed address / bookmark). A restart starts a new visitor set; the ERP
   keeps the day's highest figure, so that day under-counts rather than doubles.
   ================================================================= */

const ERP_URL = (process.env.ERP_INTAKE_URL ?? '').replace(/\/+$/, '');
const ERP_KEY = process.env.ERP_INTAKE_KEY ?? '';
/* ANALYTICS_FLUSH_MS: only for a local test run; production keeps five minutes. */
const FLUSH_MS = Math.max(5_000, Number(process.env.ANALYTICS_FLUSH_MS) || 5 * 60 * 1000);
const MAX_PAGES = 300;
const MAX_REFS = 150;

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|monitor|uptime|curl|wget|python|java\/|go-http|headless|lighthouse|pingdom/i;
const MOBILE = /Mobi|Android|iPhone|iPad|iPod/i;

interface Day {
  salt: string;
  visitors: Set<string>;
  mobile: number;
  desktop: number;
  views: number;
  pages: Map<string, number>;
  referrers: Map<string, number>;
  dirty: boolean;
}

const days = new Map<string, Day>();
let timer: ReturnType<typeof setInterval> | null = null;

/** Today in Istanbul, yyyy-mm-dd — the ERP's day. */
export function istanbulDay(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** "/projeler/" → "/projeler"; query and fragment never arrive here (pathname). */
export function cleanPath(p: string): string | null {
  if (!p || !p.startsWith('/') || p.startsWith('//') || p.length > 200) return null;
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

/** The referring site's host when it is another site; "" when none; null when it is us. */
export function refHost(referer: string | null, ownHost: string): string | null {
  if (!referer) return '';
  try {
    const h = new URL(referer).host.toLowerCase();
    const own = ownHost.toLowerCase().replace(/^www\./, '');
    return h.replace(/^www\./, '') === own ? null : h.slice(0, 120);
  } catch {
    return '';
  }
}

export const isBot = (ua: string) => !ua || BOT.test(ua);

function dayOf(key: string): Day {
  let d = days.get(key);
  if (!d) {
    d = { salt: randomBytes(16).toString('hex'), visitors: new Set(), mobile: 0, desktop: 0, views: 0, pages: new Map(), referrers: new Map(), dirty: false };
    days.set(key, d);
    /* yesterday is kept for one flush (a late post), anything older is dropped */
    for (const k of [...days.keys()].sort().slice(0, Math.max(0, days.size - 2))) days.delete(k);
  }
  return d;
}

function add(m: Map<string, number>, k: string, cap: number) {
  if (!m.has(k) && m.size >= cap) return;
  m.set(k, (m.get(k) ?? 0) + 1);
}

/** Called by the middleware for each HTML page answered with 200. */
export function recordView(input: { path: string; ip: string; ua: string; referer: string | null; host: string }): void {
  if (!ERP_URL || !ERP_KEY) return;
  if (isBot(input.ua)) return;
  const path = cleanPath(input.path);
  if (!path) return;
  ensureTimer();
  const d = dayOf(istanbulDay());
  const id = createHash('sha256').update(d.salt + '|' + input.ip + '|' + input.ua).digest('hex').slice(0, 20);
  if (!d.visitors.has(id)) {
    d.visitors.add(id);
    if (MOBILE.test(input.ua)) d.mobile++; else d.desktop++;
  }
  d.views++;
  add(d.pages, path, MAX_PAGES);
  const ref = refHost(input.referer, input.host);
  if (ref !== null) add(d.referrers, ref, MAX_REFS);
  d.dirty = true;
}

function ensureTimer() {
  if (timer) return;
  timer = setInterval(() => { void flush(); }, FLUSH_MS);
  timer.unref?.();
}

/** Sends what was counted since the last successful post; on failure it is kept for the next one. */
export async function flush(): Promise<void> {
  const send = [...days.entries()].filter(([, d]) => d.dirty).slice(-3);
  if (!send.length || !ERP_URL || !ERP_KEY) return;
  const body = {
    days: send.map(([day, d]) => ({
      day, views: d.views, visitors: d.visitors.size, mobile: d.mobile, desktop: d.desktop,
      pages: Object.fromEntries(d.pages), referrers: Object.fromEntries(d.referrers),
    })),
  };
  try {
    const res = await fetch(`${ERP_URL}/api/analiz/web/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Vono-Intake-Key': ERP_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[sayaç] ERP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return;
    }
    /* What was SENT is taken off — views counted while the post was on its way stay for the
       next one. The visitor set stays (distinct for the whole day). */
    const sub = (m: Map<string, number>, sent: Record<string, number>) => {
      for (const [k, n] of Object.entries(sent)) {
        const left = (m.get(k) ?? 0) - n;
        if (left > 0) m.set(k, left); else m.delete(k);
      }
    };
    send.forEach(([, d], i) => {
      const b = body.days[i];
      d.views -= b.views;
      sub(d.pages, b.pages);
      sub(d.referrers, b.referrers);
      d.dirty = d.views > 0;
    });
  } catch (e) {
    console.warn('[sayaç] ERP ulaşılamadı:', (e as Error).message);
  }
}

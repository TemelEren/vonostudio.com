import type { APIRoute } from 'astro';

/* ================= CONTACT FORM INTAKE =================
   The visitor posts here; this route forwards to the ERP. The browser never
   touches the ERP and never sees its address or key.

   WARNING: THE ERP HAS NO PUBLIC WRITE SURFACE, AND THIS IS WHY. Everything
   under its /api requires a session. The one exception is an intake endpoint
   that demands a shared secret which only this server holds - so the door is
   opened by a server we control, not by whatever is in a browser.

   WARNING: SPAM IS STOPPED HERE, NOT THERE. By the time the ERP sees a
   request every visitor looks like this server, so per-visitor limiting can
   only work at this end. Two cheap gates, no third-party captcha and no
   cookie: a honeypot field a person never fills in, and a per-IP window.

   WARNING: NOTHING IS STORED HERE. The IP is used for the rate window and
   kept in memory only; under KVKK it is personal data and there is no reason
   to write it down.
   ================================================================= */

/** Where the ERP listens, e.g. https://erp.vonostudio.com.
 *  Empty = the form is off and says so, rather than failing silently. */
const ERP_URL = process.env.ERP_INTAKE_URL ?? '';
const ERP_KEY = process.env.ERP_INTAKE_KEY ?? '';

/* Caps repeated from the ERP on purpose: the first gate should reject a
   megabyte before it travels, and the last gate should never trust the first. */
const CAP = { name: 200, email: 320, phone: 40, message: 4000, url: 500 };

/* Per-IP window. Deliberately generous for a person and useless for a script:
   an office enquiry is written once, not five times an hour. */
const PENCERE_MS = 60 * 60 * 1000;
const PENCERE_ADET = 5;
const gecmis = new Map<string, number[]>();

/* ---- Ziyaretçinin gerçek adresi ----
   WARNING: ASTRO'S `clientAddress` IS THE *FIRST* X-Forwarded-For ENTRY.
   Read in the node adapter (astro 5.18, core/app/node.js): it takes the first
   value of that header and falls back to the socket only when the header is
   missing. The first value is whatever the CLIENT sent - a script that varies
   it per request got a fresh rate-limit bucket every time, and the old
   TRUSTED_PROXY list, compared against that value, never matched anything.

   The LAST entry is the one our own proxy appended (HAProxy `option
   forwardfor`, nginx `$proxy_add_x_forwarded_for`): the address it actually
   saw. It is the only one this server can trust, and only because the port is
   not reachable except through that proxy (compose binds 127.0.0.1). With no
   header at all the request came straight to the socket and Astro's value is
   the socket address. */
function ziyaretciIp(istek: Request, astroAdresi: string): string {
  const xff = (istek.headers.get('x-forwarded-for') ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : astroAdresi;
}

function hizAsildiMi(ip: string): boolean {
  const simdi = Date.now();
  const liste = (gecmis.get(ip) ?? []).filter((t) => simdi - t < PENCERE_MS);
  liste.push(simdi);
  gecmis.set(ip, liste);
  /* The map is swept opportunistically; a contact form does not see enough
     traffic to justify a timer, and an unbounded map would be a slow leak. */
  if (gecmis.size > 5000) {
    for (const [k, v] of gecmis) if (v.every((t) => simdi - t >= PENCERE_MS)) gecmis.delete(k);
  }
  return liste.length > PENCERE_ADET;
}

/* ---- Formun geldiği yer ----
   WARNING: ASTRO'S OWN ORIGIN CHECK IS OFF (astro.config.mjs) AND THIS REPLACES
   IT. Astro compared the browser's Origin with the URL it rebuilt for the
   request, and behind the proxy that URL was "http://localhost": EVERY
   submission, same-origin included, got 403 and no enquiry ever reached the
   ERP (measured on the production build and in a real browser).

   Only HOSTS are compared - the scheme is the proxy's business (TLS ends
   there). A browser cannot be made to send someone else's Host, so a
   cross-site post always shows its own origin and is refused. No Origin at all
   means the caller is not a browser: cross-site form posting is a browser
   attack, and the honeypot and the rate limit below still apply to scripts. */
const SITE_HOSTLARI = (() => {
  try {
    const host = new URL(import.meta.env.SITE ?? '').host.toLowerCase();
    if (!host) return [];
    return [host, host.startsWith('www.') ? host.slice(4) : 'www.' + host];
  } catch {
    return [];
  }
})();

function kaynakUygun(istek: Request): boolean {
  const origin = istek.headers.get('origin');
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false; // "null" (sandboxed frame) or garbage
  }
  if (!host) return false;
  const ilk = (v: string | null) => (v ?? '').split(',')[0].trim().toLowerCase();
  return [ilk(istek.headers.get('x-forwarded-host')), ilk(istek.headers.get('host')), ...SITE_HOSTLARI]
    .filter(Boolean)
    .includes(host);
}

const kirp = (v: FormDataEntryValue | null | undefined, n: number) =>
  (typeof v === 'string' ? v : '').trim().slice(0, n);

/* Not a validator, a sanity check: the real test of an address is whether the
   reply arrives. Rejecting anything more here would turn away real people. */
const epostaBenzer = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const json = (durum: number, govde: Record<string, unknown>) =>
  new Response(JSON.stringify(govde), {
    status: durum,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/* WARNING: THE FORM MUST WORK WITHOUT JAVASCRIPT. A plain POST would otherwise
   land the visitor on a page of raw JSON. The script adds a hidden js=1; when
   it is absent we send them back to the page they came from with ?talep=…,
   which the section reads and turns into the same message.

   WARNING: THE RETURN ADDRESS IS RELATIVE. The request URL Astro builds behind
   the proxy is "http://localhost/…" (see kaynakUygun), so an absolute Location
   derived from it would send the visitor to localhost. A path is resolved by
   the browser against the address it actually used.

   WARNING: AND IT IS OURS. It arrives in a form field; only a path on this
   site is accepted. "//evil" and "/\evil" are protocol-relative to a browser
   and "https://…" is another site - all fall back to "/". */
const donus = (sayfa: string, durum: string) => {
  const TABAN = 'http://site.invalid';
  const yol = /^\/(?![/\\])/.test(sayfa) && !sayfa.includes('\\') ? sayfa : '/';
  let hedef: URL;
  try {
    hedef = new URL(yol, TABAN);
  } catch {
    hedef = new URL('/', TABAN);
  }
  if (hedef.origin !== TABAN) hedef = new URL('/', TABAN);
  hedef.searchParams.set('talep', durum);
  hedef.hash = 'iletisim';
  return new Response(null, {
    status: 303,
    headers: { Location: hedef.pathname + hedef.search + hedef.hash, 'Cache-Control': 'no-store' },
  });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  /* Read before validation so an early exit can still send a no-JS visitor
     back to the page they were on. */
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'bicim' });
  }
  const jsVar = kirp(form.get('js'), 4) === '1';
  const sayfaAlani = kirp(form.get('sayfa'), CAP.url);
  const bitir = (durum: number, govde: Record<string, unknown>) =>
    jsVar ? json(durum, govde) : donus(sayfaAlani, govde.ok ? 'ok' : 'hata');

  /* A form posted from another site is refused before anything travels. */
  if (!kaynakUygun(request)) return bitir(403, { error: 'kaynak' });

  if (!ERP_URL || !ERP_KEY) {
    /* Configuration is missing, which is an operator problem, not a visitor
       problem: say it plainly in the log and give the visitor the honest
       "could not be sent" rather than a silent success. */
    console.error('[iletisim] ERP_INTAKE_URL / ERP_INTAKE_KEY tanımlı değil — form kapalı.');
    return bitir(503, { error: 'kapali' });
  }

  /* ---- Honeypot ----
     A field that is present in the markup, hidden from people and left empty by
     them. A bot fills every input it finds. Answering 200 is deliberate: a
     script that is told it failed will come back with the field cleared. */
  if (kirp(form.get('website'), 100)) return bitir(200, { ok: true });

  const ad = kirp(form.get('ad'), CAP.name);
  const eposta = kirp(form.get('eposta'), CAP.email);
  const telefon = kirp(form.get('telefon'), CAP.phone);
  const mesaj = kirp(form.get('mesaj'), CAP.message);
  const onay = kirp(form.get('onay'), 10) !== '';

  /* WARNING: CONSENT IS NOT A FORMALITY, IT IS THE RECORD. Without it there is
     no lawful basis to keep the row, so the row is not created. */
  if (!onay) return bitir(400, { error: 'onay' });
  if (!eposta && !telefon) return bitir(400, { error: 'iletisim' });
  if (eposta && !epostaBenzer(eposta)) return bitir(400, { error: 'eposta' });
  if (mesaj.length < 2) return bitir(400, { error: 'mesaj' });

  if (hizAsildiMi(ziyaretciIp(request, clientAddress || 'anon'))) return bitir(429, { error: 'cok-istek' });

  try {
    const r = await fetch(new URL('/api/inquiries/intake', ERP_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Vono-Intake-Key': ERP_KEY },
      body: JSON.stringify({
        name: ad,
        email: eposta,
        phone: telefon,
        message: mesaj,
        consent: true,
        /* When consent was given, kept as evidence alongside the text that was
           shown. The server's clock, not the browser's. */
        consentAt: new Date().toISOString(),
        page: sayfaAlani,
        utm: kirp(form.get('utm'), CAP.url),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      console.error('[iletisim] ERP yanıtı:', r.status, await r.text().catch(() => ''));
      return bitir(502, { error: 'iletilemedi' });
    }
  } catch (e) {
    console.error('[iletisim] ERP ulaşılamadı:', e);
    return bitir(502, { error: 'iletilemedi' });
  }

  return bitir(200, { ok: true });
};

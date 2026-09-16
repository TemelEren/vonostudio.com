import type { Theme } from './types';

/**
 * The typefaces an editor may choose, and the CSS stack each one resolves to.
 *
 * WARNING: THE STORED VALUE IS THE KEY, NEVER THE CSS. The panel writes
 * `space-grotesk`; this file turns it into a font stack. A panel that wrote raw
 * CSS could put anything into a stylesheet the site serves, and a family the
 * site has not installed would silently fall back to the browser default with
 * no way to tell why.
 *
 * WARNING: AN UNKNOWN KEY FALLS BACK, IT DOES NOT BREAK. The panel ships its own
 * copy of this list (it cannot import from this repo — the two share only
 * content.db, see UI-GELISTIRME section 1), so the lists can drift. A key this
 * site has never heard of resolves to the default instead of writing an invalid
 * `font-family` line.
 *
 * WARNING: EVERY ENTRY MUST BE INSTALLED AND IMPORTED IN Base.astro. Declaring a
 * family here without the package means choosing it renders in the fallback and
 * nobody can see why. The `system` entries are the exception: they need no file.
 */
export const FONTS: Record<string, { label: string; stack: string; webfont: boolean }> = {
  'space-grotesk': {
    label: 'Space Grotesk',
    stack: "'Space Grotesk Variable', ui-sans-serif, system-ui, sans-serif",
    webfont: true,
  },
  inter: {
    label: 'Inter',
    stack: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
    webfont: true,
  },
  'dm-sans': {
    label: 'DM Sans',
    stack: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif",
    webfont: true,
  },
  manrope: {
    label: 'Manrope',
    stack: "'Manrope Variable', ui-sans-serif, system-ui, sans-serif",
    webfont: true,
  },
  archivo: {
    label: 'Archivo',
    stack: "'Archivo Variable', ui-sans-serif, system-ui, sans-serif",
    webfont: true,
  },
  syne: {
    label: 'Syne',
    stack: "'Syne Variable', ui-sans-serif, system-ui, sans-serif",
    webfont: true,
  },
  fraunces: {
    label: 'Fraunces (serif)',
    stack: "'Fraunces Variable', ui-serif, Georgia, serif",
    webfont: true,
  },
  lora: {
    label: 'Lora (serif)',
    stack: "'Lora Variable', ui-serif, Georgia, serif",
    webfont: true,
  },
  system: {
    label: 'Sistem yazı tipi',
    stack: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    webfont: false,
  },
  'system-serif': {
    label: 'Sistem serif',
    stack: 'ui-serif, Georgia, Cambria, Times New Roman, serif',
    webfont: false,
  },
};

/**
 * How the project grid changes when a category is chosen.
 *
 * WARNING: THE STORED VALUE IS A KEY, LIKE A FONT. The stylesheet carries every
 * one of these transitions already and the key only selects which set of rules
 * applies (`<html data-anim>`); nothing an editor types reaches CSS. A key this
 * site has never heard of falls back to the default rather than leaving the
 * grid with no transition at all.
 *
 * WARNING: THE PANEL SHIPS ITS OWN COPY of this list — the two repos share only
 * content.db (UI-GELISTIRME section 1) — so the lists can drift. Drift is
 * harmless in one direction only: the panel offering a key this site drops
 * shows the visitor the default, which is why the fallback exists.
 *
 * `stagger` is deliberately its own entry rather than a flag: an editor picks a
 * behaviour they can see, not two settings they have to combine in their head.
 */
export const FILTER_ANIMS: Record<string, { label: string }> = {
  yok: { label: 'Animasyon yok' },
  fade: { label: 'Soluklaşarak' },
  'fade-up': { label: 'Aşağıdan yükselerek' },
  scale: { label: 'Hafifçe büyüyerek' },
  blur: { label: 'Bulanıklaşarak' },
  stagger: { label: 'Sırayla (kart kart)' },
};

/** Bounds a transition can hold without becoming either invisible or a wait. */
export const FILTER_MS = { min: 120, max: 1200, default: 420 };

/**
 * How long the opening logo animation takes, end to end (ms): the wordmark
 * draws itself, fills in, then flies into the menu bar while the white cover
 * fades away.
 *
 * WARNING: THE DEFAULT IS THE MEASURED LENGTH OF THE SHIPPED TIMELINE, not a
 * round number. Intro.astro's timings add up to ~2.8s (draw 1.77s + a 0.2s
 * pause + the 0.85s flight), and the script scales every one of them by
 * `introMs / INTRO_MS.default`. A default that differed from the real length
 * would silently speed up or slow down a site nobody had touched.
 *
 * WARNING: THE PAGE IS LOCKED WHILE IT RUNS. The ceiling exists because every
 * extra second is a second a visitor cannot scroll or click; the floor because
 * below ~1s the drawing is no longer readable as a drawing.
 */
export const INTRO_MS = { min: 1000, max: 8000, default: 2800 };

/**
 * Every text size an editor may change from the ERP (§5.239), and the CSS
 * variable it drives. Values are REM, copied from global.css: `min` + `vw` +
 * `max` is a fluid role (clamp), `max` alone is a fixed one.
 *
 * WARNING: THE THEME STORES PIXELS, THE STYLESHEET GETS REM. An editor thinks
 * "44px title"; writing rem keeps the page honouring a visitor's browser zoom.
 *
 * WARNING: AN UNTOUCHED ROLE IS NOT WRITTEN AT ALL. themeCss only emits a role
 * whose size differs from the default, so global.css keeps its exact clamp -
 * a theme row that merely changed a colour cannot shift a single glyph.
 *
 * WARNING: THE CURVE SCALES WITH THE CEILING. A resized fluid role keeps the
 * original `vw` multiplied by new max / old max, so it still reaches its ceiling
 * at the same screen width it did before instead of plateauing early or late.
 *
 * WARNING: THE PANEL SHIPS ITS OWN COPY (data/siteTema.js → SITE_YAZILARI) and
 * a test compares the two. A role the panel does not know is simply not
 * offered; one this site does not know is ignored.
 */
export const TYPE_SCALE: Record<string, { css: string; max: number; min?: number; vw?: number }> = {
  hero: { css: '--t-hero', min: 1.7, vw: 3.1, max: 2.75 },
  section: { css: '--t-section', min: 1.45, vw: 2.3, max: 2.05 },
  display: { css: '--t-display', min: 1.15, vw: 1.85, max: 1.65 },
  item: { css: '--t-item', min: 1.05, vw: 1.55, max: 1.35 },
  itemSm: { css: '--t-item-sm', min: 1, vw: 1.35, max: 1.2 },
  lead: { css: '--t-lead', min: 1.1, vw: 1.7, max: 1.4 },
  serviceText: { css: '--t-service-text', min: 0.98, vw: 1.2, max: 1.15 },
  kicker: { css: '--t-kicker', min: 0.8, vw: 0.95, max: 0.92 },
  cardTitle: { css: '--t-card-title', min: 0.76, vw: 0.95, max: 0.9 },
  cardMeta: { css: '--t-card-meta', min: 0.66, vw: 0.78, max: 0.74 },
  filter: { css: '--t-filter', min: 0.7, vw: 0.82, max: 0.78 },
  body: { css: '--t-body', max: 1 },
  projectBody: { css: '--t-project-body', max: 1.05 },
  note: { css: '--t-note', max: 0.95 },
  nav: { css: '--t-nav', max: 0.875 },
  small: { css: '--t-small', max: 0.8 },
  caption: { css: '--t-caption', max: 0.78 },
  label: { css: '--t-label', max: 0.75 },
};

/** Pixel bounds a text size may take: below 8px nothing is readable, above
 *  120px a word no longer fits a phone. */
export const TYPE_PX = { min: 8, max: 120 };

/**
 * Where "phone" ends (§5.243). The same breakpoint the stylesheet already uses
 * for the short phone bar and the smaller logo (global.css), so a phone size an
 * editor sets switches over exactly where the rest of the phone layout does.
 */
export const MOBILE_MAX_PX = 700;

/**
 * Letter case an editor may choose for headings and the menu (§5.243).
 * WARNING: A KEY, NEVER CSS — the value is mapped here, an unknown key falls
 * back to the default instead of reaching the stylesheet.
 */
export const TEXT_CASES: Record<string, string> = {
  upper: 'uppercase',
  none: 'none',
  capitalize: 'capitalize',
};

/** Bounds for the letterform settings (§5.243). Weights snap to hundreds -
 *  variable fonts honour every step, a static upload falls to its nearest. */
export const TEXT_BOUNDS = {
  weight: { min: 300, max: 900 },
  tracking: { min: -0.05, max: 0.3 },
  headingLine: { min: 0.8, max: 1.8 },
  bodyLine: { min: 1.1, max: 2.4 },
};

/** Bounds for the layout lengths added in §5.243, in rem. */
export const LAYOUT_BOUNDS = {
  logoH: { min: 1.2, max: 4 },
  logoHMobile: { min: 1, max: 3.2 },
  secMin: { min: 1.5, max: 10 },
  secMax: { min: 2, max: 16 },
};

const REM_PX = 16;
const px2 = (n: number): number => Math.round(n * 100) / 100;

function typeDefaults(): NonNullable<Theme['type']> {
  const out: NonNullable<Theme['type']> = {};
  for (const [k, s] of Object.entries(TYPE_SCALE)) {
    out[k] = s.min === undefined
      ? { max: px2(s.max * REM_PX) }
      : { min: px2(s.min * REM_PX), max: px2(s.max * REM_PX) };
  }
  return out;
}

/** The look the site had before any of this was editable. */
export const THEME_DEFAULT: Theme = {
  colors: {
    bg: '#ffffff',
    ink: '#101010',
    muted: '#6f6f6c',
    line: '#e7e7e3',
    soft: '#f4f4f1',
  },
  fonts: { display: 'space-grotesk', body: 'inter', displayMobile: '', bodyMobile: '' },
  /* WARNING: navH MUST MATCH global.css. This value is what a theme row lands
     on, so a drift here means the bar silently changes height the first time
     anyone saves any theme setting at all — it stood at 4.5 while the
     stylesheet said 5, and now both say 5 again (2026-09-13, bar lowered).
     The same goes for every value below: each equals its global.css token. */
  layout: { padMin: 1.25, padMax: 4, navH: 5, logoH: 2.4, logoHMobile: 1.9, secMin: 5, secMax: 9 },
  text: {
    headingWeight: 700, headingCase: 'upper', headingTracking: 0, headingLine: 1.1,
    navWeight: 700, navCase: 'upper', navTracking: 0,
    bodyLine: 1.65,
  },
  motion: { projectFilter: 'fade', filterMs: FILTER_MS.default, introMs: INTRO_MS.default },
  type: typeDefaults(),
};

/* A colour the site is willing to put in a stylesheet.

   WARNING: VALIDATED, NOT ESCAPED. The value ends up inside a `<style>` block,
   so anything that is not plainly a colour is refused and the default is used —
   an editor cannot close the declaration and inject rules. Hex only: named and
   functional colours would widen the surface for no gain here. */

/* ---- Yüklenen yazı tipleri (§5.183) --------------------------------------
   Editörün siteye yüklediği kendi fontları. Dosya `assets` tablosunda durur
   (middleware onu /fonts/... yolundan servis eder), bu satır yalnız hangi
   dosyanın hangi ad altında kullanılacağını söyler.

   WARNING: KEY AND PATH ARE THE ATTACK SURFACE, NOT THE LABEL. Both end up
   inside a stylesheet the site serves - the family name in `font-family` and
   the file in `url(...)`. A key is therefore restricted to a slug and a path to
   /fonts/<name>.<known extension>; anything else is dropped instead of escaped,
   because an escaped-but-accepted value still widens what an editor can put in
   a <style> block.

   WARNING: A DROPPED FONT FALLS BACK, IT DOES NOT BREAK. An entry that fails
   validation simply is not offered; if the theme selected it, the resolver
   lands on the default family rather than writing an invalid font-family. */
const KEY_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const PATH_RE = /^\/fonts\/[A-Za-z0-9._-]{1,80}\.(woff2|woff|ttf|otf)$/;
const FORMAT: Record<string, string> = {
  woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype',
};

export interface CustomFont {
  key: string;
  label: string;
  path: string;
}

function customFonts(raw: unknown): CustomFont[] {
  if (!Array.isArray(raw)) return [];
  const gorulen = new Set<string>();
  const out: CustomFont[] = [];
  for (const item of raw) {
    const f = (item ?? {}) as Partial<CustomFont>;
    const key = typeof f.key === 'string' ? f.key.trim().toLowerCase() : '';
    const path = typeof f.path === 'string' ? f.path.trim() : '';
    if (!KEY_RE.test(key) || !PATH_RE.test(path)) continue;
    // A custom key must not shadow a built-in family: the site would then have
    // two different meanings for one name depending on load order.
    if (Object.hasOwn(FONTS, key) || gorulen.has(key)) continue;
    gorulen.add(key);
    const label = typeof f.label === 'string' && f.label.trim() ? f.label.trim().slice(0, 60) : key;
    out.push({ key, label, path });
  }
  return out.slice(0, 12);
}

/** The face declarations for the uploaded fonts, ready to sit in a <style>. */
export function fontFaceCss(fonts: CustomFont[]): string {
  return fonts
    .map((f) => {
      const ext = f.path.slice(f.path.lastIndexOf('.') + 1).toLowerCase();
      // `font-display: swap` — text stays readable while the file loads instead
      // of leaving an invisible paragraph behind.
      return `@font-face{font-family:'${f.key}';src:url('${f.path}') format('${FORMAT[ext]}');font-display:swap;}`;
    })
    .join('');
}

/** Built-in stack, or an uploaded family, or the default. */
function stackFor(key: string, fonts: CustomFont[], fallback: string): string {
  if (Object.hasOwn(FONTS, key)) return FONTS[key].stack;
  if (fonts.some((f) => f.key === key)) return `'${key}', ui-sans-serif, system-ui, sans-serif`;
  return FONTS[fallback].stack;
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const color = (value: unknown, fallback: string): string =>
  typeof value === 'string' && HEX.test(value.trim()) ? value.trim() : fallback;

/** A length in rem, clamped to a range a layout can survive. */
const rem = (value: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

/* A font weight: a number snapped to hundreds inside the allowed range. */
const weight = (value: unknown, fallback: number): number =>
  Math.round(rem(value, fallback, TEXT_BOUNDS.weight.min, TEXT_BOUNDS.weight.max) / 100) * 100;

/* A letter case key from TEXT_CASES, or the default. */
const textCase = (value: unknown, fallback: string): string =>
  typeof value === 'string' && Object.hasOwn(TEXT_CASES, value) ? value : fallback;

/* A key the theme may select: a built-in family or one the editor uploaded. */
const fontKey = (value: unknown, fallback: string, yuklenen: CustomFont[]): string => {
  if (typeof value !== 'string') return fallback;
  if (Object.hasOwn(FONTS, value)) return value;
  return yuklenen.some((f) => f.key === value) ? value : fallback;
};

/**
 * A stored theme row turned into something safe to render.
 *
 * Every field falls back on its own: a row that only sets one colour keeps the
 * original değer for everything else, and a row that is missing entirely renders the
 * site exactly as it looked before themes existed.
 */
export function resolveTheme(raw: unknown): Theme {
  const t = (raw ?? {}) as Partial<Theme>;
  const c = (t.colors ?? {}) as Partial<Theme['colors']>;
  const f = (t.fonts ?? {}) as Partial<Theme['fonts']>;
  const l = (t.layout ?? {}) as Partial<Theme['layout']>;
  const m = (t.motion ?? {}) as Partial<NonNullable<Theme['motion']>>;
  const x = (t.text ?? {}) as Partial<NonNullable<Theme['text']>>;
  const yuklenen = customFonts(t.customFonts);
  const ty = (t.type && typeof t.type === 'object' ? t.type : {}) as Record<string, unknown>;
  const d = THEME_DEFAULT;
  return {
    colors: {
      bg: color(c.bg, d.colors.bg),
      ink: color(c.ink, d.colors.ink),
      muted: color(c.muted, d.colors.muted),
      line: color(c.line, d.colors.line),
      soft: color(c.soft, d.colors.soft),
    },
    fonts: {
      display: fontKey(f.display, d.fonts.display, yuklenen),
      body: fontKey(f.body, d.fonts.body, yuklenen),
      /* Empty means "same as the web family": an unknown key is dropped to
         empty rather than to the default, so a stale phone choice never
         overrides the web family the editor can see (§5.243). */
      displayMobile: fontKey(f.displayMobile, '', yuklenen),
      bodyMobile: fontKey(f.bodyMobile, '', yuklenen),
    },
    customFonts: yuklenen,
    layout: {
      padMin: rem(l.padMin, d.layout.padMin, 0.5, 4),
      padMax: rem(l.padMax, d.layout.padMax, 1, 10),
      navH: rem(l.navH, d.layout.navH, 3, 8),
      logoH: rem(l.logoH, d.layout.logoH!, LAYOUT_BOUNDS.logoH.min, LAYOUT_BOUNDS.logoH.max),
      logoHMobile: rem(l.logoHMobile, d.layout.logoHMobile!, LAYOUT_BOUNDS.logoHMobile.min, LAYOUT_BOUNDS.logoHMobile.max),
      secMin: rem(l.secMin, d.layout.secMin!, LAYOUT_BOUNDS.secMin.min, LAYOUT_BOUNDS.secMin.max),
      secMax: rem(l.secMax, d.layout.secMax!, LAYOUT_BOUNDS.secMax.min, LAYOUT_BOUNDS.secMax.max),
    },
    text: {
      headingWeight: weight(x.headingWeight, d.text!.headingWeight),
      headingCase: textCase(x.headingCase, d.text!.headingCase),
      headingTracking: px2(rem(x.headingTracking, d.text!.headingTracking, TEXT_BOUNDS.tracking.min, TEXT_BOUNDS.tracking.max)),
      headingLine: px2(rem(x.headingLine, d.text!.headingLine, TEXT_BOUNDS.headingLine.min, TEXT_BOUNDS.headingLine.max)),
      navWeight: weight(x.navWeight, d.text!.navWeight),
      navCase: textCase(x.navCase, d.text!.navCase),
      navTracking: px2(rem(x.navTracking, d.text!.navTracking, TEXT_BOUNDS.tracking.min, TEXT_BOUNDS.tracking.max)),
      bodyLine: px2(rem(x.bodyLine, d.text!.bodyLine, TEXT_BOUNDS.bodyLine.min, TEXT_BOUNDS.bodyLine.max)),
    },
    motion: {
      projectFilter: Object.hasOwn(FILTER_ANIMS, String(m.projectFilter))
        ? String(m.projectFilter)
        : d.motion!.projectFilter,
      filterMs: Math.round(
        rem(m.filterMs, d.motion!.filterMs, FILTER_MS.min, FILTER_MS.max)
      ),
      introMs: Math.round(
        rem(m.introMs, d.motion!.introMs!, INTRO_MS.min, INTRO_MS.max)
      ),
    },
    /* Numbers only, clamped: nothing an editor types can reach the stylesheet
       as text. A role missing from the row keeps its default on its own. */
    type: Object.fromEntries(
      Object.entries(d.type!).map(([k, def]) => {
        const raw = (ty[k] && typeof ty[k] === 'object' ? ty[k] : {}) as { min?: unknown; max?: unknown };
        const max = px2(rem(raw.max, def.max, TYPE_PX.min, TYPE_PX.max));
        if (def.min === undefined) {
          /* A fixed role has no phone size of its own until the editor gives it
             one (§5.243); a value that is not a number is simply not one. */
          const n = typeof raw.min === 'number' ? raw.min : Number.parseFloat(String(raw.min ?? ''));
          return Number.isFinite(n)
            ? [k, { min: px2(Math.min(Math.max(n, TYPE_PX.min), TYPE_PX.max)), max }]
            : [k, { max }];
        }
        return [k, { min: px2(rem(raw.min, def.min, TYPE_PX.min, TYPE_PX.max)), max }];
      })
    ),
  };
}

/* Only the roles that moved away from global.css.

   WARNING: TWO OUTPUTS, WEB AND PHONE (§5.243). `web` goes in the main :root
   block; `mobile` in a (max-width: MOBILE_MAX_PX) block after it, so the phone
   size an editor typed is the phone size a visitor gets - exactly, not
   "wherever the clamp happens to land at 390px". A fixed role only writes a
   phone line once it has a phone size. */
function typeCss(t: Theme): { web: string; mobile: string } {
  const d = THEME_DEFAULT.type!;
  const r = (px: number) => `${Math.round((px / REM_PX) * 10000) / 10000}rem`;
  const out: string[] = [];
  const mob: string[] = [];
  for (const [k, s] of Object.entries(TYPE_SCALE)) {
    const v = t.type?.[k];
    const def = d[k];
    if (!v || !def) continue;
    if (v.max === def.max && v.min === def.min) continue;
    if (v.min !== undefined) mob.push(`${s.css}:${r(v.min)};`);
    if (s.min === undefined || v.min === undefined || def.min === undefined) {
      out.push(`${s.css}:${r(v.max)};`);
      continue;
    }
    /* WARNING: A PHONE SIZE ABOVE THE WIDE ONE IS NOT HONOURED AS IS — clamp()
       with min > max always resolves to min and the role would stop shrinking
       at all. The smaller of the two is the floor; the panel says so. */
    const lo = Math.min(v.min, v.max);
    const vw = Math.round(s.vw! * (v.max / def.max) * 1000) / 1000;
    out.push(`${s.css}:clamp(${r(lo)}, ${vw}vw, ${r(v.max)});`);
  }
  return { web: out.join(''), mobile: mob.join('') };
}

/* Letterform and layout tokens, ONLY where they moved away from the default -
   global.css keeps its own values untouched (§5.243). Numbers and catalogue
   keys only: nothing an editor types reaches the stylesheet as text. */
function styleCss(t: Theme): string {
  const d = THEME_DEFAULT;
  const x = t.text!, dx = d.text!;
  const l = t.layout, dl = d.layout;
  const out: string[] = [];
  const add = (cond: boolean, line: string) => { if (cond) out.push(line); };
  add(x.headingWeight !== dx.headingWeight, `--h-weight:${x.headingWeight};`);
  add(x.headingCase !== dx.headingCase, `--h-case:${TEXT_CASES[x.headingCase]};`);
  add(x.headingTracking !== dx.headingTracking, `--h-tracking:${x.headingTracking}em;`);
  add(x.headingLine !== dx.headingLine, `--h-line:${x.headingLine};`);
  add(x.navWeight !== dx.navWeight, `--nav-weight:${x.navWeight};`);
  add(x.navCase !== dx.navCase, `--nav-case:${TEXT_CASES[x.navCase]};`);
  add(x.navTracking !== dx.navTracking, `--nav-tracking:${x.navTracking}em;`);
  add(x.bodyLine !== dx.bodyLine, `--body-line:${x.bodyLine};`);
  add(l.logoH !== dl.logoH, `--logo-h:${l.logoH}rem;`);
  add(l.logoHMobile !== dl.logoHMobile, `--logo-h-mobile:${l.logoHMobile}rem;`);
  add(l.secMin !== dl.secMin, `--sec-min:${l.secMin}rem;`);
  /* A ceiling below the floor would freeze the spacing at the floor: the larger
     of the two is the ceiling, and the panel says so. */
  add(l.secMax !== dl.secMax || l.secMin! > l.secMax!, `--sec-max:${Math.max(l.secMax!, l.secMin!)}rem;`);
  return out.join('');
}

/**
 * The `:root` block that overrides global.css.
 *
 * WARNING: IT ONLY OVERRIDES — global.css keeps every default. A theme row that
 * goes missing, or a value that fails validation, therefore lands on the design
 * the site shipped with instead of an unstyled page.
 *
 * WARNING: `:root:root` IS NOT A TYPO, AND WITHOUT IT NOTHING HERE APPLIES.
 * A plain `:root` has exactly the specificity of the `:root` in global.css, so
 * the winner is whichever the browser reads LAST — and that is decided by where
 * the bundler puts the stylesheet, which is not ours to control. Measured with
 * a theme asking for `--bg:#123456`: the page computed `#ffffff` in the dev
 * server AND in a production build, i.e. every colour, typeface and length an
 * editor set was being discarded. Repeating the pseudo-class doubles the
 * specificity and settles it by weight instead of by order.
 */
export function themeCss(theme: Theme): string {
  const d = THEME_DEFAULT;
  const t = resolveTheme(theme);
  const pad = `clamp(${t.layout.padMin}rem, 4vw, ${Math.max(t.layout.padMax, t.layout.padMin)}rem)`;
  const yuklenen = t.customFonts ?? [];
  const tipi = typeCss(t);
  /* WARNING: THE PHONE BLOCK COMES AFTER THE WEB ONE WITH THE SAME WEIGHT
     (:root:root), so inside its media query it wins by order - both live in
     this single <style>, where the order IS ours to decide (§5.243). */
  const mobil = [
    t.fonts.displayMobile ? `--font-display:${stackFor(t.fonts.displayMobile, yuklenen, d.fonts.display)};` : '',
    t.fonts.bodyMobile ? `--font-body:${stackFor(t.fonts.bodyMobile, yuklenen, d.fonts.body)};` : '',
    tipi.mobile,
  ].join('');
  return [
    /* Faces first: a :root that names a family the browser has not been told
       about would render in the fallback for the first paint. */
    fontFaceCss(yuklenen),
    ':root:root{',
    `--bg:${t.colors.bg};`,
    `--ink:${t.colors.ink};`,
    `--muted:${t.colors.muted};`,
    `--line:${t.colors.line};`,
    `--soft:${t.colors.soft};`,
    `--font-display:${stackFor(t.fonts.display, yuklenen, d.fonts.display)};`,
    `--font-body:${stackFor(t.fonts.body, yuklenen, d.fonts.body)};`,
    `--pad:${pad};`,
    `--nav-h:${t.layout.navH}rem;`,
    /* The stylesheet owns WHICH transition runs (`data-anim`); this is only
       HOW LONG it takes, so one number covers every variant. */
    `--filter-ms:${t.motion!.filterMs}ms;`,
    styleCss(t),
    tipi.web,
    '}',
    mobil ? `@media (max-width: ${MOBILE_MAX_PX}px){:root:root{${mobil}}}` : '',
  ].join('');
}

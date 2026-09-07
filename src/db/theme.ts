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

/** The look the site had before any of this was editable. */
export const THEME_DEFAULT: Theme = {
  colors: {
    bg: '#ffffff',
    ink: '#101010',
    muted: '#6f6f6c',
    line: '#e7e7e3',
    soft: '#f4f4f1',
  },
  fonts: { display: 'space-grotesk', body: 'inter' },
  layout: { padMin: 1.25, padMax: 4, navH: 4.5 },
};

/* A colour the site is willing to put in a stylesheet.

   WARNING: VALIDATED, NOT ESCAPED. The value ends up inside a `<style>` block,
   so anything that is not plainly a colour is refused and the default is used —
   an editor cannot close the declaration and inject rules. Hex only: named and
   functional colours would widen the surface for no gain here. */
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const color = (value: unknown, fallback: string): string =>
  typeof value === 'string' && HEX.test(value.trim()) ? value.trim() : fallback;

/** A length in rem, clamped to a range a layout can survive. */
const rem = (value: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const fontKey = (value: unknown, fallback: string): string =>
  typeof value === 'string' && Object.hasOwn(FONTS, value) ? value : fallback;

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
      display: fontKey(f.display, d.fonts.display),
      body: fontKey(f.body, d.fonts.body),
    },
    layout: {
      padMin: rem(l.padMin, d.layout.padMin, 0.5, 4),
      padMax: rem(l.padMax, d.layout.padMax, 1, 10),
      navH: rem(l.navH, d.layout.navH, 3, 8),
    },
  };
}

/**
 * The `:root` block that overrides global.css.
 *
 * WARNING: IT ONLY OVERRIDES — global.css keeps every default. A theme row that
 * goes missing, or a value that fails validation, therefore lands on the design
 * the site shipped with instead of an unstyled page.
 */
export function themeCss(theme: Theme): string {
  const t = resolveTheme(theme);
  const pad = `clamp(${t.layout.padMin}rem, 4vw, ${Math.max(t.layout.padMax, t.layout.padMin)}rem)`;
  return [
    ':root{',
    `--bg:${t.colors.bg};`,
    `--ink:${t.colors.ink};`,
    `--muted:${t.colors.muted};`,
    `--line:${t.colors.line};`,
    `--soft:${t.colors.soft};`,
    `--font-display:${FONTS[t.fonts.display].stack};`,
    `--font-body:${FONTS[t.fonts.body].stack};`,
    `--pad:${pad};`,
    `--nav-h:${t.layout.navH}rem;`,
    '}',
  ].join('');
}

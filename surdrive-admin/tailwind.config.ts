import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Dark mode is opt-in via a `.dark` class on an ancestor element rather than
  // the OS preference. Nothing reads this yet — the themed colour tokens in
  // app/globals.css are the only consumers of the `.dark` selector today.
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Design tokens (colors, spacing, radii, fonts) ───
      // NOTE: a few values were interpolated from the page — confirm the exact
      // measurement with the design owner before relying on them.
      colors: {
        // ─── Themed tokens (light + dark) — values live in app/globals.css ───
        surface: {
          page: 'rgb(var(--color-surface-page) / <alpha-value>)',
          card: 'rgb(var(--color-surface-card) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
          toggleTrack: 'rgb(var(--color-surface-toggle-track) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-subtle) / <alpha-value>)',
          chip: 'rgb(var(--color-surface-chip) / <alpha-value>)',
        },
        chip: {
          'teal-bg': 'rgb(var(--color-chip-teal-bg) / <alpha-value>)',
          'teal-text': 'rgb(var(--color-chip-teal-text) / <alpha-value>)',
          'amber-text': 'rgb(var(--color-chip-amber-text) / <alpha-value>)',
          'violet-text': 'rgb(var(--color-chip-violet-text) / <alpha-value>)',
          'green-text': 'rgb(var(--color-chip-green-text) / <alpha-value>)',
        },
        'toggle-active': 'rgb(var(--color-toggle-active) / <alpha-value>)',
        action: {
          'danger-bg': 'rgb(var(--color-action-danger-bg) / <alpha-value>)',
          'danger-hover': 'rgb(var(--color-action-danger-hover) / <alpha-value>)',
          'success-bg': 'rgb(var(--color-action-success-bg) / <alpha-value>)',
          'success-hover': 'rgb(var(--color-action-success-hover) / <alpha-value>)',
          'warning-bg': 'rgb(var(--color-action-warning-bg) / <alpha-value>)',
          'warning-hover': 'rgb(var(--color-action-warning-hover) / <alpha-value>)',
        },
        brand: {
          // ─── Themed tokens (light + dark) — values live in app/globals.css ───
          primary: 'rgb(var(--color-brand-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-brand-primary-hover) / <alpha-value>)',
          accent: 'rgb(var(--color-brand-accent) / <alpha-value>)',
          'accent-hover': 'rgb(var(--color-brand-accent-hover) / <alpha-value>)',
          tint: 'rgb(var(--color-brand-tint-bg) / <alpha-value>)',
        },
        // ─── Themed line/hairline tokens (light + dark) — values in app/globals.css ───
        // Flat keys: border-line-card, border-line-pill, border-line-hover, border-line-divider
        line: {
          card: 'rgb(var(--color-border-card) / <alpha-value>)',
          pill: 'rgb(var(--color-border-pill) / <alpha-value>)',
          hover: 'rgb(var(--color-border-hover) / <alpha-value>)',
          divider: 'rgb(var(--color-border-divider) / <alpha-value>)',
          input: 'rgb(var(--color-border-line-input) / <alpha-value>)',
        },
        // ─── Themed tokens (light + dark) — values live in app/globals.css ───
        // Body copy/first-class ink. Distinct from `text` (footer legal copy).
        ink: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          placeholder: 'rgb(var(--color-text-placeholder) / <alpha-value>)',
        },
        status: {
          'success-text': 'rgb(var(--color-status-success-text) / <alpha-value>)',
          'success-bg': 'rgb(var(--color-status-success-bg) / <alpha-value>)',
          'danger-text': 'rgb(var(--color-status-danger-text) / <alpha-value>)',
        'danger-text-strong': 'rgb(var(--color-status-danger-text-strong) / <alpha-value>)',
          'danger-text-vivid': 'rgb(var(--color-status-danger-text-vivid) / <alpha-value>)',
          'danger-bg': 'rgb(var(--color-status-danger-bg) / <alpha-value>)',
          'warning-text': 'rgb(var(--color-status-warning-text) / <alpha-value>)',
          'warning-bg': 'rgb(var(--color-status-warning-bg) / <alpha-value>)',
          'info-text': 'rgb(var(--color-status-info-text) / <alpha-value>)',
          'info-bg': 'rgb(var(--color-status-info-bg) / <alpha-value>)',
          'neutral-text': 'rgb(var(--color-status-neutral-text) / <alpha-value>)',
          'neutral-bg': 'rgb(var(--color-status-neutral-bg) / <alpha-value>)',
        },
        // SOS incident marker (identical in both themes by design)
        sos: 'rgb(var(--color-sos-marker) / <alpha-value>)',
      },
      // borderColor: Tailwind already derives border-* from the colors table, so
      // border-status-danger-text resolves there. This explicit key exists so the
      // border colour is named independently of text-* (same var, same value —
      // NOT a duplicate custom property).
      borderColor: {
        'danger-text': 'rgb(var(--color-status-danger-text) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // body copy (Outfit Regular 400)
        'body': ['14px', { lineHeight: '20px' }],
        // display (Outfit SemiBold 600)
        'display': '150px',
      },
      // Repeated padding/gap values observed across the page
      spacing: {
        '2xs': '6px',
        'xs': '8px',
        'sm': '10px',
        'md': '12px',
        'nav': '15px',
        'row': '14px',
        'card': '16px',
        'lg': '20px',
        'inner': '32px',
        'section': '40px',
        'page': '64px',
      },
      borderRadius: {
        'sm': '10px',
        'md': '12px',
        'lg': '20px',
        'xl': '24px',
        // settings panel corner radius
        'settings': '13px',
        // left-flush nav item
        'navLeft': '12px 0px 0px 12px',
      },
    },
  },
  plugins: [],
};

export default config;

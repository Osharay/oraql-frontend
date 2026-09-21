import type { Config } from 'tailwindcss';

/**
 * OraQL_ Design System v2 — Tailwind Configuration
 * Editorial warm/dark mix from the design system.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Colors: OraQL_ Design System v2 ───
      colors: {
        // Warm Light Surfaces
        warm: {
          white: '#FAF8F5',
          cream: '#F0ECE4',
          sand: '#E5DFD3',
          stone: '#D4CCBD',
          taupe: '#B8AFA0',
        },
        // Dark Surfaces
        dark: {
          ink: '#1A1A1E',
          charcoal: '#222226',
          graphite: '#2C2C32',
          slate: '#38383F',
          ash: '#48484F',
        },
        // Brand
        oracle: {
          gold: '#C8A44E',
          'gold-light': '#DBBF6F',
          'gold-dark': '#A88A3A',
          'gold-muted': 'rgba(200,164,78,0.12)',
        },
        // Semantic — Probabilities.
        // Absolute probability only. Do NOT use these to rank streaks: a 90%
        // market whose baseline is 80% would render bright green while being
        // the least interesting thing on screen.
        prob: {
          high: '#2ECC71',
          mid: '#F0AD4E',
          low: '#8A8A94',
        },
        // Semantic — Lift over baseline. Signed, so the scale diverges:
        // below baseline, at baseline, above it. This is what ranking uses.
        lift: {
          neg: '#B8AFA0',
          flat: '#8A8A94',
          pos: '#2ECC71',
          strong: '#1FA85C',
        },
        // Category Accents
        cat: {
          goals: '#C8E64E',     // Lime — Goals markets
          corners: '#B49AFA',   // Purple — Corners markets
          cards: '#E5DFD3',     // Sand — Cards markets
          result: '#5C4A3A',    // Brown — Match result
        },
        // Special
        value: '#A78BFA',
        live: '#22D3EE',
        danger: '#EF4444',
        // Text
        txt: {
          primary: '#1A1A1E',
          secondary: '#5A5A64',
          tertiary: '#8A8A94',
          inverse: '#FAF8F5',
          'inverse-2': '#CCCCC4',
        },
      },

      // ─── Typography ───
      fontFamily: {
        display: ['var(--font-display)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },

      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'heading':    ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'subhead':    ['1rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg':    ['1rem', { lineHeight: '1.6' }],
        'body':       ['0.875rem', { lineHeight: '1.6' }],
        'body-sm':    ['0.8125rem', { lineHeight: '1.5' }],
        'caption':    ['0.75rem', { lineHeight: '1.5' }],
        'mono-sm':    ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
        // Section headings. These were used across the streak, cluster and
        // admin pages without being defined, so they produced no CSS and every
        // one of those headings fell back to the default size.
        'h2':         ['2rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3':         ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'h4':         ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h5':         ['1.0625rem', { lineHeight: '1.35', fontWeight: '600' }],
      },

      // ─── Spacing ───
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },

      // ─── Border Radius ───
      borderRadius: {
        'oracle-sm': '8px',
        'oracle-md': '14px',
        'oracle-lg': '20px',
        'oracle-xl': '28px',
      },

      // ─── Shadows ───
      boxShadow: {
        'soft': '0 2px 8px rgba(26,26,30,0.06), 0 1px 3px rgba(26,26,30,0.04)',
        'card': '0 4px 16px rgba(26,26,30,0.08), 0 2px 6px rgba(26,26,30,0.04)',
        'card-dark': '0 4px 20px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)',
        'glow': '0 0 20px rgba(200,164,78,0.15), 0 0 40px rgba(200,164,78,0.06)',
      },

      // ─── Animations ───
      transitionTimingFunction: {
        'oracle': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        'fast': '120ms',
        'normal': '200ms',
        'slow': '400ms',
      },

      // ─── Keyframes ───
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'pulse-live': 'pulse-live 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;

const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // --- Event Queue tokens (see docs/design-system.md) ---
        'primary-deep': 'hsl(var(--primary-deep))',
        'ink-subtle': 'hsl(var(--ink-subtle))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        'atmosphere-indigo': 'hsl(var(--atmosphere-indigo))',

        status: {
          draft: 'hsl(var(--status-draft))',
          active: 'hsl(var(--status-active))',
          finished: 'hsl(var(--status-finished))',
          cancelled: 'hsl(var(--status-cancelled))',
        },

        // Theme-independent by design — the ticket is shared as an image and the
        // door floods must not depend on the host's colour scheme.
        door: {
          ok: 'hsl(var(--door-ok))',
          deny: 'hsl(var(--door-deny))',
          ground: 'hsl(var(--door-ground))',
        },
        ticket: {
          ground: 'hsl(var(--ticket-ground))',
          ink: 'hsl(var(--ticket-ink))',
          accent: 'hsl(var(--ticket-accent))',
        },
      },
      fontFamily: {
        display: ['Unbounded_700Bold', 'sans-serif'],
        sans: ['Archivo_400Regular', 'sans-serif'],
        medium: ['Archivo_500Medium', 'sans-serif'],
        bold: ['Archivo_700Bold', 'sans-serif'],
        mono: ['JetBrainsMono_400Regular', 'monospace'],
      },
      borderRadius: {
        // Sharp geometry — 4px is the maximum. See design-system.md § Corners.
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '4px',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

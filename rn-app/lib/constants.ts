/**
 * React Navigation theme.
 *
 * These values MIRROR the CSS variables in `global.css` — React Navigation cannot read
 * them, so they are duplicated here. If you change a token in global.css, change it here
 * too. Source of truth and rationale: docs/design-system.md.
 */
export const NAV_THEME = {
  light: {
    background: 'hsl(240 20% 96.5%)', // --background
    border: 'hsl(240 16% 84%)', // --border
    card: 'hsl(0 0% 100%)', // --card
    notification: 'hsl(0 64% 47%)', // --destructive
    primary: 'hsl(185 100% 28%)', // --primary
    text: 'hsl(240 33% 12.5%)', // --foreground
  },
  dark: {
    background: 'hsl(240 28% 14%)', // --background
    border: 'hsl(240 19% 30%)', // --border
    card: 'hsl(240 26% 17.5%)', // --card
    notification: 'hsl(0 85% 60%)', // --destructive
    primary: 'hsl(187 81% 45.5%)', // --primary
    text: 'hsl(240 24% 96%)', // --foreground
  },
};

# Design System

> Maintained by `/designer`. Visual language and component inventory for Event Queue.

## Design Language

**Geometric and sharp.** Angular shapes, hard edges, bold typography. The app has its own visual identity — not a standard UI library look. **Not another generic app.**

### Creative Principles
- **Unique feel over safe defaults.** Follow best UI/UX patterns for usability, but the platform must have its own distinctive character. Every screen should feel intentional, not templated.
- **No AI slop.** Avoid generic font families (Inter, Roboto, Arial), cliched color schemes (purple gradients on white), predictable layouts, and cookie-cutter component patterns.
- **Atmosphere over flatness.** Use layered gradients, geometric patterns, and contextual effects. Solid white backgrounds are a last resort.
- **Motion with purpose.** Staggered reveals on page load, deliberate micro-interactions. One orchestrated moment beats scattered animations. Use CSS-only where possible, Motion library for React Native when needed.
- **Dominant palette.** Bold primary colors with sharp accents. No timid, evenly-distributed palettes. Draw from nightlife aesthetics, editorial design, and IDE themes.
- **Dark-first.** Screens default to dark backgrounds. Light surfaces are used for cards and inputs, not backgrounds.

## Colors

### Core Palette
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | Deep blue (#1a237e) | Primary actions, headers, filled buttons |
| `primary-light` | Teal (#00838f) | Accents, links, active states, section labels |
| `surface` | White (#ffffff) | Card backgrounds, input text, headings on dark |
| `background` | Near black (#1a1a2e) | Screen backgrounds, base layer |
| `text-primary` | Near black (#1a1a2e) | Body text on light surfaces |
| `text-secondary` | Gray (#64748b) | Labels, placeholders, secondary text |
| `error` | Red (#dc2626) | Error states, destructive actions, cancel |
| `success` | Green (#16a34a) | Success states, confirmations |

### Status Colors
| Token | Value | Usage |
|-------|-------|-------|
| `status-draft` | `text-secondary` (#64748b) | Draft badge border/text — restrained, muted |
| `status-active` | `primary-light` (#00838f) | Active badge fill — alive, vibrant |
| `status-finished` | `primary` at 60% (#1a237e99) | Finished badge fill — cooled down |
| `status-cancelled` | `error` at 60% (#dc262699) | Cancelled badge fill — desaturated warning |

## Typography

- **Font family:** Space Grotesk (wide/extended sans-serif)
- **Headings:** Bold, wide tracking, uppercase for section headers
- **Body:** Regular weight, standard tracking
- **Scale:** 11 / 12 / 13 / 14 / 16 / 20 / 24 / 28 / 32 / 40
- **Section labels:** 11px, uppercase, tracking-widest, `primary-light`, bold — used consistently across all screens

## Spacing

Base unit: 4px. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

## Corners

**Sharp geometry.** Maximum border-radius is 4px. No rounded pills, no fully-rounded corners.
- Buttons: 4px
- Cards: 4px
- Badges/chips: 2px
- Bottom sheets: 0px (fully angular top edge)
- Inputs: 4px (inherited from existing TextInput)

## Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `page-stagger-delay` | 60ms | Delay between staggered card/section reveals |
| `page-fade-duration` | 200ms | Standard fade-in duration |
| `page-slide-distance` | 24px | Slide-up distance for staggered reveals |
| `transition-smooth` | 300ms ease-out | Status transitions, filter changes, crossfades |

### Animation Patterns
- **Page load:** Header fades in first, then secondary elements slide in from left/bottom with stagger delays. Primary content cards stagger in from bottom (fade + 24px slide-up, 60ms between each).
- **State transitions:** Crossfade (300ms ease-out) when status changes affect background gradient or badge color.
- **Expand/collapse:** 200ms ease-out for toggling sections (e.g., door sales tier config).
- **Skeleton loading:** Horizontal gradient sweep — `text-primary` at 20% opacity base with lighter band sweeping left-to-right, 1.5s loop.

## Component Inventory

| Component | File | Status |
|-----------|------|--------|
| TextInput | `rn-app/components/ui/input.tsx` | ✅ Built |
| Button | `rn-app/components/ui/button.tsx` | ✅ Built |
| Card | `rn-app/components/ui/card.tsx` | ✅ Built |
| Text | `rn-app/components/ui/text.tsx` | ✅ Built |
| Avatar | `rn-app/components/ui/avatar.tsx` | ✅ Built |
| Progress | `rn-app/components/ui/progress.tsx` | ✅ Built |
| Tooltip | `rn-app/components/ui/tooltip.tsx` | ✅ Built |
| EventCard | — | ⬚ Planned |
| StatusBadge | — | ⬚ Planned |
| SectionHeader | — | ⬚ Planned |
| DateTimePicker | — | ⬚ Planned |
| BottomSheet | — | ⬚ Planned |
| VenuePickerSheet | — | ⬚ Planned |
| CreateVenueSheet | — | ⬚ Planned |
| ToggleGroup | — | ⬚ Planned |
| TierRow | — | ⬚ Planned |
| ConfirmDialog | — | ⬚ Planned |
| SkeletonLoader | — | ⬚ Planned |
| EmptyState | — | ⬚ Planned |
| FloatingActionButton | — | ⬚ Planned |

*Components added here as they are built.*

## Layout Principles

- **Mobile (host flow):** Full-bleed, immersive. Big bold headers, edge-to-edge lists, minimal chrome. Dark gradient backgrounds with geometric overlays.
- **Desktop (manager/promoter):** Grid panels. Sharp geometric design language prevents generic admin look.
- **Status-driven atmosphere:** Background gradients, badge colors, and action availability all shift based on entity status. ACTIVE feels alive, DRAFT is restrained, FINISHED cools down, CANCELLED desaturates.

## Background Patterns

- **Primary gradient:** `primary` (#1a237e) at top → `background` (#1a1a2e) at bottom. Used for list screens.
- **Geometric overlay:** Thin diagonal lines (45deg, 1px, `surface` at 4% opacity, 32px spacing). Adds texture without noise.
- **Status radials (detail screens):** Radial gradient from status color at low opacity (8-15%) emanating from top-center into `background`. Creates mood without overwhelming content.
- **Solid dark:** `background` (#1a1a2e) for form screens where content density is high and atmosphere should recede.

# Design System

> Maintained by `/designer`. Visual language and component inventory for Event Queue.

## Design Language

**Geometric and sharp.** Angular shapes, hard edges, bold typography. The app has its own visual identity — not a standard UI library look.

## Colors

### Core Palette
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | Deep blue (#1a237e) | Primary actions, headers |
| `primary-light` | Teal (#00838f) | Accents, links, active states |
| `surface` | White (#ffffff) | Card backgrounds, inputs |
| `background` | Cool gray (#f5f7fa) | Screen backgrounds |
| `text-primary` | Near black (#1a1a2e) | Body text, headings |
| `text-secondary` | Gray (#64748b) | Labels, placeholders |
| `error` | Red (#dc2626) | Error states, destructive actions |
| `success` | Green (#16a34a) | Success states, confirmations |

*Note: Exact values TBD — these are starting points to be refined by `/designer`.*

## Typography

- **Font family:** Space Grotesk (wide/extended sans-serif)
- **Headings:** Bold, wide tracking, uppercase for section headers
- **Body:** Regular weight, standard tracking
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 40

## Spacing

Base unit: 4px. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

## Component Inventory

| Component | File | Status |
|-----------|------|--------|
| TextInput | `rn-app/components/ui/input.tsx` | ✅ Built |

*Components added here as they are built.*

## Layout Principles

- **Mobile (host flow):** Full-bleed, immersive. Big bold headers, edge-to-edge lists, minimal chrome.
- **Desktop (manager/promoter):** Grid panels. Sharp geometric design language prevents generic admin look.

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

> **Authoritative.** These tokens are defined in `rn-app/global.css` as HSL CSS variables and exposed
> through `rn-app/tailwind.config.js`. Never hardcode a hex value in a screen or component.

### Architecture decision — shadcn plumbing, Event Queue values

The app inherited the stock shadcn token set. We **keep shadcn's variable names and mechanism**
(`--background`, `--foreground`, `--primary`, … consumed as `hsl(var(--x))`) and **replace its values**
with the palette below, then add the tokens shadcn has no concept of (elevation ladder, status,
ticket, door).

Rationale: eleven files — including `button.tsx`, `card.tsx`, `input.tsx`, `text.tsx`, `progress.tsx`,
`tooltip.tsx` and both auth screens — already consume those class names. Keeping the names means every
one of them inherits the brand with no code change. Keeping the stock *values* was never an option:
they are the generic look the brand exists to avoid.

**Colour is defined in three places and all three must agree:**

| Place | Role |
|-------|------|
| `rn-app/global.css` | Source of truth — HSL variables, `:root` (light) and `.dark:root` (dark) |
| `rn-app/tailwind.config.js` | Maps variables to utility classes |
| `rn-app/lib/constants.ts` | `NAV_THEME` for React Navigation — must mirror global.css |

### Core palette (dark — the default theme)

| Token | Class | Value | Contrast on bg | Usage |
|-------|-------|-------|----------------|-------|
| `background` | `bg-background` | `#1A1A2E` | — | Screen base layer |
| `card` / surface-1 | `bg-card` | `#212138` | — | Cards, list rows, raised panels |
| `secondary` / surface-2 | `bg-secondary` | `#2A2A45` | — | Inputs, chips, pressed states |
| `popover` / surface-3 | `bg-popover` | `#333352` | — | Sheets, modals, menus |
| `border` | `border-border` | `#3F3F5C` | — | Hairlines, dividers, input borders |
| `foreground` (ink) | `text-foreground` | `#F2F2F7` | 15.3:1 AAA | Headings and body text |
| `muted-foreground` | `text-muted-foreground` | `#A2A2BE` | 6.9:1 AA | Labels, secondary text, placeholders |
| `ink-subtle` | `text-ink-subtle` | `#6E6E8A` | 3.5:1 | **Disabled and decorative only** — never body text |
| `primary` | `bg-primary` `text-primary` | `#16BDD2` | 7.5:1 AAA | Accents, links, active states, section labels, filled CTAs |
| `primary-deep` | `bg-primary-deep` | `#00838F` | 3.8:1 | Fills on **light** surfaces only |
| `success` | `text-success` | `#31C57D` | 7.7:1 AAA | Confirmations, checked-in state |
| `destructive` | `text-destructive` | `#F04444` | 4.6:1 AA | Errors, destructive actions, cancel |
| `warning` | `text-warning` | `#F5A623` | 8.4:1 AAA | Capacity warnings, expiring holds, door alerts |

**`primary` flips between themes.** `#16BDD2` scores 2.07:1 on a light ground — unusable. On the light
(desktop manager) theme, `--primary` resolves to `#00838F` for fills and `#006670` for text. Always use
the `primary` token and let the theme resolve it; never reference the hex directly.

### What changed, and why

Three of the previously documented values are **not** carried forward. This is not a style preference —
each failed a measured contrast check against the app's own background:

| Old token | Value | Measured | Verdict |
|-----------|-------|----------|---------|
| `primary` | `#1a237e` | **1.29:1** | Effectively invisible on `background`. Demoted to `atmosphere-indigo`, gradients only — never text, never a fill that carries meaning. Its 2 uses in code versus teal's 22 confirm the app had already stopped using it. |
| `text-secondary` | `#64748b` | **3.58:1** | Fails AA for body text, and it is the **most-used colour in the app (83 occurrences)**. Replaced by `muted-foreground` `#A2A2BE`. |
| `surface: #ffffff` | white | — | Contradicts dark-first. White cards on a near-black ground are harsh and flatten the atmosphere. Replaced by the elevation ladder above; white becomes ink, not a surface. |

`primary-light` (`#00838f`) is promoted to `primary` and brightened to `#16BDD2` for on-dark use. Same
hue family — this is the existing brand colour made legible, not a new one.

### Status colours

| Token | Class | Value | Contrast | Feel |
|-------|-------|-------|----------|------|
| `status-draft` | `text-status-draft` | `#A2A2BE` | 6.9:1 | Restrained, not yet real |
| `status-active` | `text-status-active` | `#16BDD2` | 7.5:1 | Alive, vibrant |
| `status-finished` | `text-status-finished` | `#8080AD` | 4.6:1 | Cooled down |
| `status-cancelled` | `text-status-cancelled` | `#B34D4D` | 4.0:1 | Desaturated warning |

Opacity-based status colours (`#1a237e99`) are removed — they compose unpredictably over the elevation
ladder and were the reason the finished badge was unreadable on cards.

### Surface-specific tokens

These exist because three surfaces carry disproportionate commercial weight.

**Door check-in — `door-*`.** A host reads *colour before text* across a dark room with a queue behind
them. Scan results are full-bleed floods, not badges.

| Token | Value | Usage |
|-------|-------|-------|
| `door-ok` | `#31C57D` | Full-screen flood on a valid scan |
| `door-deny` | `#F04444` | Full-screen flood on an invalid or already-used scan |
| `door-ground` | `#101019` | Deepest ground — scanner viewfinder chrome |

Never flood with pure white: at 1am a full-brightness white screen costs the host several seconds of
night vision. Floods cap at 80% luminance and last 600ms before returning to `door-ground`.

**Guest ticket — `ticket-*`.** The ticket leaves the app as a screenshot into WhatsApp. It is the only
free distribution channel in the product, and it is rendered into an image.

| Token | Value | Usage |
|-------|-------|-------|
| `ticket-ground` | `#101019` | Ticket background |
| `ticket-ink` | `#FFFFFF` | Ticket text (18.9:1) |
| `ticket-accent` | `#16BDD2` | Event name, tier, brand mark (8.3:1) |
| `ticket-quiet` | `#FFFFFF` | QR quiet zone — **must stay pure white** for scanner reliability |

**Ticket tokens are theme-independent by design.** They must never resolve through `:root` /
`.dark:root`, because the rendered image has no theme — it inherits whatever the *sender's* phone had
when it was captured. A theme-reactive ticket produces unreadable screenshots for half your guests.

**Promoter earnings — money.** Currency uses `text-success` for earned amounts, tabular numerals, and
the mono face. Never abbreviate a value a promoter is owed.

## Typography

**Two families, both verified available via `@expo-google-fonts`.**

| Role | Family | Package | Usage |
|------|--------|---------|-------|
| Display | **Unbounded** | `@expo-google-fonts/unbounded` | Screen titles, event names, door-scan guest name, ticket headline. Wide, geometric, architectural — takes up space with confidence. |
| Body / UI | **Archivo** | `@expo-google-fonts/archivo` | All body copy, labels, buttons, inputs. Grotesque with excellent small-size legibility. |
| Numeric | **JetBrains Mono** | `@expo-google-fonts/jetbrains-mono` | Prices, CPF and passport numbers, QR payloads, promoter earnings, analytics tables. Tabular figures and unambiguous `0/O` `1/l` — this is a legibility requirement at the door, not a stylistic one. |

**Space Grotesk is dropped.** It is now one of the most recognisable markers of generated design, which
puts it in direct conflict with the No-AI-Slop principle above. Unbounded delivers the same
wide/architectural brief with far more character. (`@expo-google-fonts/archivo-expanded` does not
exist — Archivo's expanded cut is not published, so width comes from Unbounded, not from Archivo.)

- **Headings:** Unbounded 700–800, tight tracking (`-0.02em`), never uppercase above 20px
- **Body:** Archivo 400/500, standard tracking
- **Section labels:** 11px, uppercase, `tracking-widest`, `text-primary`, Archivo 700
- **Scale:** 11 / 12 / 13 / 14 / 16 / 20 / 24 / 28 / 32 / 40
- **Door minimums:** guest name ≥ 32px, document number ≥ 20px mono. A host must read both at arm's length.

> ⚠️ **Fonts are not loaded yet.** `expo-font` is not in `rn-app/package.json` and no `useFonts` call
> exists. Until the install lands (below), the app renders system faces and this section is intent, not
> reality. Everything else in this document is live in code.

```bash
pnpm --filter rn-app add expo-font @expo-google-fonts/unbounded @expo-google-fonts/archivo @expo-google-fonts/jetbrains-mono
```

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
| Input | `rn-app/components/ui/input.tsx` | ✅ Built |
| EventCard | `rn-app/components/ui/event-card.tsx` | ✅ Built |
| StatusBadge | `rn-app/components/ui/status-badge.tsx` | ✅ Built |
| SectionHeader | `rn-app/components/ui/section-header.tsx` | ✅ Built |
| ToggleGroup | `rn-app/components/ui/toggle-group.tsx` | ✅ Built |
| TierRow | `rn-app/components/ui/tier-row.tsx` | ✅ Built |
| ConfirmDialog | `rn-app/components/ui/confirm-dialog.tsx` | ✅ Built |
| SkeletonLoader | `rn-app/components/ui/skeleton-loader.tsx` | ✅ Built |
| EmptyState | `rn-app/components/ui/empty-state.tsx` | ✅ Built |
| FloatingActionButton | `rn-app/components/ui/floating-action-button.tsx` | ✅ Built |
| ThemeToggle | `rn-app/components/ThemeToggle.tsx` | ✅ Built |
| DateTimePicker | — | ⬚ Planned |
| BottomSheet | — | ⬚ Planned |
| VenuePickerSheet | — | ⬚ Planned (venue picker is currently duplicated inline in `create.tsx` and `edit.tsx`) |
| CreateVenueSheet | — | ⬚ Planned |

*Components added here as they are built.*

> ✅ **Tokens are live in code** as of 2026-08-31. The palette above is defined in `rn-app/global.css`,
> exposed in `rn-app/tailwind.config.js`, and mirrored in `rn-app/lib/constants.ts`. The class names in
> the colour tables are real and usable today.
>
> ⚠️ **Two things remain.** (1) Fonts are specified but not installed — see the Typography note.
> (2) **127 hardcoded hex values across 12 files have not been migrated yet.** Until they are, those
> screens still render the old palette and ignore the theme. Migration list:
>
> | File | Hex occurrences |
> |------|-----------------|
> | `app/(app)/events/[id]/edit.tsx`, `create.tsx`, `[id]/index.tsx`, `app/(app)/index.tsx` | bulk of the 83 `#64748b` uses |
> | `components/ui/` — `status-badge`, `event-card`, `section-header`, `tier-row`, `toggle-group`, `confirm-dialog`, `empty-state`, `floating-action-button` | the rest |
>
> Mapping for the migration: `#64748b` → `text-muted-foreground` · `#00838f` → `text-primary` /
> `bg-primary` · `#1a1a2e` → `bg-background` · `#dc2626` → `text-destructive` · `#ffffff` →
> `text-foreground` · `#1a237e` → **do not carry forward** (see What changed) · `#94a3b8` →
> `text-muted-foreground` · `#1e40af` → `text-primary`.

## Layout Principles

- **Mobile (host flow):** Full-bleed, immersive. Big bold headers, edge-to-edge lists, minimal chrome. Dark gradient backgrounds with geometric overlays.
- **Desktop (manager/promoter):** Grid panels. Sharp geometric design language prevents generic admin look.
- **Status-driven atmosphere:** Background gradients, badge colors, and action availability all shift based on entity status. ACTIVE feels alive, DRAFT is restrained, FINISHED cools down, CANCELLED desaturates.

## Background Patterns

- **Primary gradient:** `atmosphere-indigo` (#1A237E) at top → `background` (#1A1A2E) at bottom. Used for list screens. This is the *only* sanctioned use of the indigo — as atmosphere behind content, never as a text or fill colour, where it measures 1.29:1 and disappears.
- **Geometric overlay:** Thin diagonal lines (45deg, 1px, `foreground` at 4% opacity, 32px spacing). Adds texture without noise.
- **Status radials (detail screens):** Radial gradient from the `status-*` colour at low opacity (8–15%) emanating from top-center into `background`. Creates mood without overwhelming content.
- **Solid dark:** `background` for form screens where content density is high and atmosphere should recede.
- **Door screens:** `door-ground` (#101019), darker than `background`. The scanner viewfinder needs the surrounding chrome to recede so the camera feed and the result flood dominate.

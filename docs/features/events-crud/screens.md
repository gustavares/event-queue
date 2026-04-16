# Events CRUD — Screens

## Screen Flow

```
/(app) (My Events)
  → /(app)/events/create (Create Event)
    → [venue picker bottom sheet] → [create venue bottom sheet]
    → success → /(app)/events/[id] (Event Detail)
  → /(app)/events/[id] (Event Detail)
    → /(app)/events/[id]/edit (Edit Event)
      → success → /(app)/events/[id]
    → [status transition actions] → stays on detail
    → [delete confirmation] → success → /(app)
```

## Design Direction

These screens lean into the nightlife context. Dark-dominant backgrounds with layered gradients create atmosphere. Status drives visual energy — ACTIVE events feel alive (teal glow, bright accents), DRAFT events feel restrained (cool muted tones), FINISHED events cool down, CANCELLED events desaturate. Every card and section uses the geometric language: clipped corners, angular dividers, sharp edges.

---

## Screens

### My Events (Home)

**Route:** `/(app)/index`

**Replaces:** current placeholder home screen

**Layout:**
- **Background:** Dark gradient — `primary` (#1a237e) at top fading to `text-primary` (#1a1a2e) at bottom. Subtle diagonal geometric pattern overlay at 4% opacity (thin angled lines, 45deg, spaced 32px apart)
- **Header area (top 120px):**
  - "MY EVENTS" — Space Grotesk, 32px, bold, uppercase, tracking-widest, `surface` color (#ffffff). Left-aligned, 24px horizontal padding
  - Right side: user avatar (initials in `primary-light` circle, 40px) — taps to future profile screen
  - 8px below heading: event count label — "3 EVENTS" — Space Grotesk, 12px, uppercase, tracking-wide, `text-secondary` color
- **Status filter bar (below header, 16px gap):**
  - Horizontal scroll row of filter chips, 24px horizontal padding
  - Chips: ALL / DRAFT / ACTIVE / FINISHED / CANCELLED
  - Active chip: filled `primary-light` background, `surface` text, sharp corners (border-radius: 2px)
  - Inactive chip: transparent background, 1px `text-secondary` border, `text-secondary` text, same sharp corners
  - Chip text: Space Grotesk, 11px, uppercase, tracking-wide, bold
  - 8px gap between chips
- **Event list (below filters, 16px gap):**
  - Vertical scroll, 16px horizontal padding, 12px gap between cards
  - Each card: `EventCard` component (see New Components)
- **Create button:**
  - Fixed position, bottom-right, 24px from edges, above safe area
  - 56px square, sharp corners (border-radius: 4px), `primary-light` background
  - "+" icon, 28px, `surface` color, stroke-width 2.5
  - Subtle shadow: 0 4px 24px rgba(0, 131, 143, 0.3)
- **Page load animation:**
  - Header fades in (200ms)
  - Filter bar slides in from left (300ms, 100ms delay)
  - Event cards stagger in from bottom: each card fades up 24px with 60ms delay between cards (starting 200ms after filter bar)
  - Create button scales in from 0 (400ms, spring, 500ms delay)

**States:**
| State | Description |
|-------|-------------|
| Default | Event cards listed, sorted by startDate descending. Active events first, then draft, then finished/cancelled |
| Loading | 3 skeleton card placeholders with shimmer animation — same card dimensions, `text-primary` at 20% opacity with horizontal gradient sweep |
| Empty | Centered content: geometric diamond icon (64px, `text-secondary` at 40% opacity, sharp angular shape), "NO EVENTS YET" in 20px Space Grotesk bold uppercase tracking-widest, "Create your first event to get started" in 14px regular `text-secondary`. 24px gap between elements |
| Error | Inline error banner at top of list area: `error` background at 15% opacity, 1px `error` left border (4px wide), error message in 14px `error` color, retry icon button |
| Filtered (no results) | Same as empty but text reads "NO [STATUS] EVENTS" and subtext "Try a different filter" |

**Interactions:**
- Tap event card → navigate to `/(app)/events/[id]`
- Tap "+" button → navigate to `/(app)/events/create`
- Tap filter chip → filter list, animate cards out (fade, 100ms) then filtered cards in (stagger)
- Tap avatar → reserved for future profile screen (no-op for now)
- Pull to refresh → re-fetch events

---

### Create Event

**Route:** `/(app)/events/create`

**Layout:**
- **Background:** Solid `text-primary` (#1a1a2e) — dark, immersive
- **Header:**
  - Back arrow (left, `text-secondary`, 24px) — navigates back
  - "NEW EVENT" — Space Grotesk, 24px, bold, uppercase, tracking-widest, `surface` color, centered
  - 48px top padding (below safe area)
- **Form body:** ScrollView, 24px horizontal padding, 24px top gap from header
- **Section: Basic Info**
  - Section label: "DETAILS" — 11px, uppercase, tracking-widest, `primary-light` color, bold, 24px bottom margin
  - Event name input — full width, `TextInput` component with label "Event name"
  - Description input — full width, multiline (4 lines), `TextInput` with label "Description (optional)"
  - 16px gap between inputs
- **Section: Location (24px top margin)**
  - Section label: "LOCATION"
  - Two-option toggle: "Select Venue" / "Custom Location" — same style as filter chips but full width, split 50/50, `primary-light` fill on active, 1px border on inactive
  - **If "Select Venue" active:**
    - Venue selector button — full width, 1px `text-secondary` border, sharp corners. Shows selected venue name + address or placeholder "Tap to select venue". Right chevron icon
    - Tap → opens `VenuePickerSheet` bottom sheet
  - **If "Custom Location" active:**
    - Location name input — `TextInput` with label "Location name"
    - Location address input — `TextInput` with label "Address"
    - 16px gap between inputs
- **Section: Schedule (24px top margin)**
  - Section label: "SCHEDULE"
  - Start date/time picker — `DateTimePicker` component, full width, label "Starts at"
  - End date/time picker — `DateTimePicker` component, full width, label "Ends at (optional)", placeholder "Defaults to 12h after start"
  - 16px gap between pickers
- **Section: Door Sales (24px top margin)**
  - Section label: "DOOR SALES"
  - Toggle row: "Enable door sales" label (14px, `surface`) + switch/toggle on right. `primary-light` when on
  - **If enabled (animated expand, 200ms):**
    - Tier list: each tier is a row with name input (flex 2), price input with "R$" prefix (flex 1), and remove button (X icon, `error` color). 8px gap between rows
    - "Add tier" button — full width, dashed 1px `text-secondary` border, "+" icon + "ADD TIER" text in `text-secondary`. Tapping adds an empty tier row with focus on name
    - 12px gap between tier rows
- **Submit area (32px top margin, 48px bottom padding):**
  - "CREATE EVENT" button — full width, `primary-light` background, `surface` text, Space Grotesk 16px bold uppercase tracking-wide, sharp corners (border-radius: 4px), 56px height
- **Form validation:** Inline — error text appears 4px below invalid input in `error` color, 12px. Triggered on submit attempt (not on blur, to avoid noise during form fill)

**States:**
| State | Description |
|-------|-------------|
| Default | Empty form, all sections visible, door sales collapsed |
| Loading | Submit button shows loading spinner, all inputs disabled, button text changes to "CREATING..." |
| Error | Inline errors below invalid fields. Network error shows toast at top |

**Interactions:**
- Fill form → tap "CREATE EVENT" → validate → call CREATE_EVENT_MUTATION → on success navigate to `/(app)/events/[id]`
- Tap venue selector → opens `VenuePickerSheet`
- Toggle door sales → expand/collapse tier configuration with animation
- Tap "Add tier" → add empty tier row, focus name input
- Tap tier X button → remove tier (no confirmation needed, it's inline)
- Back arrow → navigate back to `/(app)` (confirm if form has unsaved changes)

---

### Venue Picker (Bottom Sheet)

**Component:** `VenuePickerSheet`

**Presentation:** Bottom sheet, slides up to 70% screen height. Dark overlay behind (50% opacity black). Sharp top corners (border-radius: 0 — fully angular).

**Layout:**
- **Handle bar:** centered, 40px wide, 4px tall, `text-secondary` at 30% opacity, 12px top padding
- **Header:** "SELECT VENUE" — 16px, Space Grotesk bold uppercase tracking-widest, `surface` color, 16px horizontal padding, 16px top gap
- **Search input (12px below header):** Full width (16px horizontal padding), compact height (40px), search icon left, placeholder "Search venues..."
- **Create new row (12px below search):** Full width tappable row, 1px dashed `primary-light` border, "CREATE NEW VENUE" text in `primary-light`, 14px bold uppercase, "+" icon left. 48px height
- **Venue list (12px below):** FlatList of venues, each row:
  - Venue name — 16px, `surface`, bold
  - Address — 13px, `text-secondary`, 2px below name
  - Capacity badge (if set) — right side, "CAP: 500" — 11px, `text-secondary`, 1px border, sharp corners, padding 4px 8px
  - Row height: 64px, 16px horizontal padding
  - 1px `text-secondary` at 10% opacity bottom border between rows
  - Selected venue: left 3px `primary-light` border accent

**Interactions:**
- Tap venue row → select venue, close sheet, update venue selector in form
- Tap "CREATE NEW VENUE" → open `CreateVenueSheet` on top
- Type in search → filter venue list by name/address (client-side)
- Drag down or tap overlay → close sheet

---

### Create Venue (Bottom Sheet)

**Component:** `CreateVenueSheet`

**Presentation:** Bottom sheet, slides up to 50% screen height. Stacks on top of VenuePickerSheet if open.

**Layout:**
- **Handle bar:** same as VenuePickerSheet
- **Header:** "NEW VENUE" — same style as VenuePickerSheet header
- **Form (16px below header, 16px horizontal padding):**
  - Venue name input — `TextInput` with label "Venue name"
  - Address input — `TextInput` with label "Address"
  - Capacity input — `TextInput` with label "Capacity (optional)", numeric keyboard
  - 12px gap between inputs
- **Submit (24px below last input, 24px bottom padding):**
  - "CREATE VENUE" button — full width, `primary-light` background, sharp corners, 48px height

**States:**
| State | Description |
|-------|-------------|
| Default | Empty form |
| Loading | Button loading, inputs disabled |
| Error | Inline errors below fields |

**Interactions:**
- Fill form → tap "CREATE VENUE" → validate → call CREATE_VENUE_MUTATION → on success, close sheet, auto-select new venue in VenuePickerSheet/form
- Validation errors inline (name + address required, capacity > 0 if provided)

---

### Event Detail

**Route:** `/(app)/events/[id]`

**Layout:**
- **Background:** Full dark with status-driven accent gradient at the top:
  - DRAFT: `text-primary` (#1a1a2e) solid — no accent, restrained
  - ACTIVE: radial gradient from `primary-light` at 15% opacity (top center) into `text-primary` — the event feels alive
  - FINISHED: radial gradient from `primary` at 10% opacity (top center) into `text-primary` — cooled down
  - CANCELLED: radial gradient from `error` at 8% opacity (top center) into `text-primary` — desaturated warning
- **Header (top, below safe area):**
  - Back arrow (left, `text-secondary`)
  - Status badge (right): pill with sharp corners (border-radius: 2px), padding 6px 12px
    - DRAFT: 1px `text-secondary` border, `text-secondary` text
    - ACTIVE: `primary-light` background, `surface` text
    - FINISHED: `primary` background at 60% opacity, `surface` text
    - CANCELLED: `error` background at 60% opacity, `surface` text
  - Text: 11px, Space Grotesk, uppercase, bold, tracking-wide
- **Event title (16px below header):**
  - Event name — Space Grotesk, 28px, bold, `surface`, 24px horizontal padding. Can wrap to 2 lines
- **Date line (8px below title):**
  - Calendar icon (16px, `primary-light`) + formatted date range — "APR 15, 2026 · 22:00 — APR 16, 2026 · 10:00" — 14px, `text-secondary`, 24px horizontal padding
- **Content sections (24px below date, ScrollView):**
  - Each section: 24px horizontal padding, 24px top margin between sections
  - Section headers: 11px, uppercase, tracking-widest, `primary-light`, bold
  - **Location section:**
    - "LOCATION" header
    - If venue: venue name (16px, `surface`, bold) + address (14px, `text-secondary`, 4px below)
    - If inline: location name (16px, `surface`, bold) + address (14px, `text-secondary`, 4px below)
  - **Description section (if description exists):**
    - "ABOUT" header
    - Description text — 14px, `text-secondary`, line-height 22px
  - **Door Sales section:**
    - "DOOR SALES" header
    - If disabled: "Not enabled" — 14px, `text-secondary` italic
    - If enabled, tier list:
      - Each tier: row with name (16px, `surface`) left, price "R$ 50.00" (16px, `primary-light`, bold, monospace feel) right
      - 1px `text-secondary` at 8% opacity bottom border between tiers
      - Row height: 48px, vertically centered
- **Action bar (fixed bottom, above safe area):**
  - Container: `text-primary` background with 1px `text-secondary` at 10% opacity top border, 16px horizontal padding, 12px vertical padding
  - Layout depends on current status:
  - **DRAFT:**
    - Row: "Edit" (outline button, flex 1) + "Publish" (`primary-light` filled button, flex 1) — 12px gap
    - Second row (8px below): "Cancel Event" text button, `error` color, centered, 13px
    - Third row (8px below): "Delete" text button, `text-secondary`, centered, 13px
  - **ACTIVE:**
    - Row: "Edit" (outline button, flex 1) + "Close Event" (`primary` filled button, flex 1) — 12px gap
    - Second row: "Cancel Event" text button, `error` color, centered, 13px
  - **FINISHED:**
    - Row: "Reopen Event" (outline button, full width)
    - Second row: "Delete" text button, `text-secondary`, centered, 13px
  - **CANCELLED:**
    - Row: "Delete" text button, `text-secondary`, centered, 13px. No other actions (terminal state)
  - All buttons: Space Grotesk, 14px, uppercase, bold, tracking-wide, 48px height, sharp corners (border-radius: 4px)
- **Page load animation:**
  - Status badge fades in (200ms)
  - Title slides up 16px + fades (300ms, 100ms delay)
  - Date line fades in (200ms, 250ms delay)
  - Content sections stagger in from bottom: 24px slide up + fade, 80ms delay between sections

**States:**
| State | Description |
|-------|-------------|
| Default | Full event detail displayed with appropriate action bar |
| Loading | Skeleton: title placeholder (wide bar), date placeholder (narrow bar), 2 section placeholders. Same shimmer as events list |
| Error | Centered error state: "Event not found" with back button. Or network error with retry |

**Interactions:**
- Tap "Edit" → navigate to `/(app)/events/[id]/edit`
- Tap "Publish" → call TRANSITION_EVENT_STATUS_MUTATION (ACTIVE) → refresh, status badge and background gradient update with crossfade (300ms)
- Tap "Close Event" → call TRANSITION_EVENT_STATUS_MUTATION (FINISHED) → refresh
- Tap "Reopen Event" → call TRANSITION_EVENT_STATUS_MUTATION (ACTIVE) → refresh
- Tap "Cancel Event" → confirmation dialog ("Are you sure? This cannot be undone.") → call TRANSITION_EVENT_STATUS_MUTATION (CANCELLED)
- Tap "Delete" → confirmation dialog ("Delete this event? This cannot be undone.") → call DELETE_EVENT_MUTATION → navigate to `/(app)`
- Back arrow → navigate to `/(app)`

---

### Edit Event

**Route:** `/(app)/events/[id]/edit`

**Layout:**
- Identical structure to Create Event, with these differences:
  - Header title: "EDIT EVENT" instead of "NEW EVENT"
  - All fields pre-filled with current event data
  - Submit button: "SAVE CHANGES" instead of "CREATE EVENT"
  - No startDate-in-past validation (edit allows historical corrections per spec)
  - Venue toggle pre-set based on whether event has venueId or inline location
  - Door sales toggle pre-set, tiers pre-filled if they exist

**States:**
| State | Description |
|-------|-------------|
| Default | Form pre-filled with event data |
| Loading (fetch) | Same skeleton as Create Event but with loading bar at top |
| Loading (save) | Submit button shows spinner, "SAVING...", all inputs disabled |
| Error | Inline field errors + network error toast |

**Interactions:**
- Edit fields → tap "SAVE CHANGES" → validate → call UPDATE_EVENT_MUTATION → on success navigate back to `/(app)/events/[id]`
- Door sales toggle / tier add/remove → same as create form
- Back arrow → navigate back to `/(app)/events/[id]` (confirm if unsaved changes)

---

## New Components Needed

| Component | Props | Description |
|-----------|-------|-------------|
| EventCard | `event: EventEntity`, `onPress` | Event list card with status badge, name, date, venue. Geometric styling with angular accent edge. Status-driven left border color |
| StatusBadge | `status: EventStatus` | Compact status pill with sharp corners. Color varies by status (see Event Detail) |
| SectionHeader | `title: string` | 11px uppercase tracking-widest `primary-light` bold label used across all screens |
| DateTimePicker | `label`, `value`, `onChange`, `placeholder` | Date/time selector button that opens native picker. Styled as input-like row |
| BottomSheet | `visible`, `onClose`, `height` | Animated bottom sheet with dark overlay, angular top edge, drag-to-close |
| VenuePickerSheet | `visible`, `onSelect`, `onClose` | Venue list with search + create new, built on BottomSheet |
| CreateVenueSheet | `visible`, `onCreated`, `onClose` | Venue creation form, built on BottomSheet |
| ToggleGroup | `options: string[]`, `selected`, `onChange` | Two-option segmented control with sharp corners, `primary-light` fill on active |
| TierRow | `tier`, `onChange`, `onRemove` | Inline tier editing: name + price inputs + remove button |
| ConfirmDialog | `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`, `destructive?` | Modal confirmation with dark overlay, sharp-cornered card, destructive variant turns confirm button `error` |
| SkeletonLoader | `width`, `height`, `borderRadius` | Shimmer placeholder with horizontal gradient sweep animation |
| EmptyState | `icon`, `title`, `subtitle` | Centered empty content pattern: icon + heading + subtext |
| FloatingActionButton | `icon`, `onPress` | Fixed-position square button with shadow, sharp corners |

## Design System Updates

The following tokens/additions should be reflected in `docs/design-system.md` when these components are built:

### New Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `status-draft` | `text-secondary` (#64748b) | Draft badge border/text |
| `status-active` | `primary-light` (#00838f) | Active badge fill, active accents |
| `status-finished` | `primary` at 60% (#1a237e99) | Finished badge fill |
| `status-cancelled` | `error` at 60% (#dc262699) | Cancelled badge fill |

### Animation Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `page-stagger-delay` | 60ms | Delay between staggered card/section reveals |
| `page-fade-duration` | 200ms | Standard fade-in duration |
| `page-slide-distance` | 24px | Slide-up distance for staggered reveals |
| `transition-smooth` | 300ms ease-out | Status transitions, filter changes |

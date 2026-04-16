# Event Queue - MVP Design

## Vision

Event Queue is a guest list and door management platform for nightlife venues and events in Brazil. The MVP focuses on the promoter/host/manager workflow for managing guest lists and check-ins. Post-MVP, the platform expands into ticketing for concerts, parties, and festivals - competing with high-fee platforms in Brazil.

## Core Concepts

### Users and Roles

A **User** is anyone who signs up. There are no global roles - roles are per-event.

**Event roles** (assigned via EventTeamMember):

| Role | Capabilities |
|------|-------------|
| **Manager** | Full control: edit event, create official lists, assign team, view all lists, view analytics, close/reopen event |
| **Promoter** | Create their own lists, add/remove guests on their lists, view their list stats |
| **Host** | Search guests, scan QR codes, check in guests (any list), record door sales |

- Creating an event makes the creator its Manager.
- A user can have different roles on different events.
- A Manager can promote other users to Manager.

### Venues

A Venue is a saved location (name, address, capacity). It is a reference entity - no permissions or team management for MVP.

Post-MVP: venues can have a default team (hosts, house promoters) that events inherit as a convenience shortcut. This requires a validation/invitation flow to manage who can be added to a venue's team.

### Events

The central entity. Created by a user who becomes its Manager.

- Venue is optional. If no venue is selected, the manager must provide a location name and address inline.
- Optional end time (defaults to 12 hours after start).
- Auto-closes at end time. Manager can manually close or reopen.
- Status lifecycle: `DRAFT → ACTIVE → FINISHED → CANCELLED`
- Door sales can be enabled/disabled per event.

### Lists

Belong to an event. Three types:

| Type | Created by | Purpose |
|------|-----------|---------|
| **OFFICIAL** | Manager | Venue lists (e.g., "VIP", "Free before midnight") |
| **PROMOTER** | Promoter | Promoter's personal list for the event |
| **DOOR_SALES** | System | Auto-created when door sales are enabled (one per tier) |

### Guests and List Entries

**Guest** = a person (name + optional contact info). Not an app user. Can exist on multiple lists.

**ListEntry** = the link between a Guest and a List. This is the critical entity:
- Has its own unique QR code
- Has its own check-in status
- Belongs to one list (and therefore one promoter)
- Promoter credit is tracked through list entries

**Guest identity rule:** Entries on different lists are separate, even for the same person. If "João" is on Promoter A's list and Promoter B's list, those are two independent entries with two QR codes. The one that gets scanned determines which promoter gets credit.

### Document Requirement at Check-in

Adding a guest to a list: document is optional (promoter may not have it).

At check-in: document is **required**. If the guest record has no document, the host must capture it before confirming check-in.

Supported document types:
- **CPF** (Brazilian national ID)
- **Passport** (for foreigners)

### Door Sales

When enabled for an event, the manager configures tiers:
- Each tier has a name and price (e.g., "Pista R$50", "Camarote R$150")
- Hosts record door sales by selecting a tier and capturing guest document (required)
- Guest name is optional for door sales

Post-MVP: door sale tiers can include time-based pricing rules (e.g., "R$30 before midnight, R$50 after"), gender-based pricing, and area-based pricing (camarote, open bar, etc.).

### Check-in Flow (Host)

Three methods:

1. **QR code scan** → guest info displayed → if no document, host captures it → confirm check-in
2. **Name search** → matching entries across all lists shown → host selects entry → if no document, host captures it → confirm check-in
3. **Door sale** → host selects tier → captures document (required) + optional name → records entry

### Notifications

When a guest is added to a list and has contact info, they receive a notification with their QR code. Three channels:

- **WhatsApp** (most common in Brazil)
- **SMS**
- **Email**

Implementation uses an abstract notification interface. Providers will be selected separately.

### Analytics (Post-event)

Available to Managers:

- Total check-ins per event
- Per-list breakdown (checked in vs total guests)
- Promoter performance (guests added, checked in, check-in rate)
- Door sales count and breakdown by tier

Post-MVP: real-time dashboard with live check-in feed, current occupancy, and running door sales totals.

## Data Model

```
User
  id              String (CUID2)
  email           String (unique)
  password        String (hashed, Argon2)
  name            String
  phone           String (optional)
  deleted         Boolean
  createdAt       DateTime
  updatedAt       DateTime
  deletedAt       DateTime (optional)

Venue
  id              String (CUID2)
  name            String
  address         String
  capacity        Int (optional)
  createdBy       → User
  createdAt       DateTime
  updatedAt       DateTime

Event
  id              String (CUID2)
  name            String
  description     String (optional)
  date            DateTime (start time)
  endDate         DateTime (optional, default: date + 12h)
  status          Enum (DRAFT, ACTIVE, FINISHED, CANCELLED)
  venueId         → Venue (optional)
  locationName    String (required if no venue)
  locationAddress String (required if no venue)
  doorSalesEnabled Boolean
  createdBy       → User
  deleted         Boolean
  createdAt       DateTime
  updatedAt       DateTime
  deletedAt       DateTime (optional)

EventTeamMember
  id              String (CUID2)
  eventId         → Event
  userId          → User
  role            Enum (MANAGER, PROMOTER, HOST)
  createdAt       DateTime

DoorSaleTier
  id              String (CUID2)
  eventId         → Event
  name            String
  price           Decimal
  createdAt       DateTime

List
  id              String (CUID2)
  eventId         → Event
  name            String
  type            Enum (OFFICIAL, PROMOTER, DOOR_SALES)
  createdBy       → User
  createdAt       DateTime
  updatedAt       DateTime

Guest
  id              String (CUID2)
  name            String
  email           String (optional)
  phone           String (optional)
  documentType    Enum (CPF, PASSPORT) (optional)
  documentNumber  String (optional)
  createdAt       DateTime

ListEntry
  id              String (CUID2)
  listId          → List
  guestId         → Guest
  qrCode          String (unique token)
  status          Enum (PENDING, CHECKED_IN)
  checkedInAt     DateTime (optional)
  checkedInBy     → User (optional, the host)
  createdAt       DateTime

DoorSaleEntry
  id              String (CUID2)
  eventId         → Event
  tierId          → DoorSaleTier
  guestName       String (optional)
  documentType    Enum (CPF, PASSPORT)
  documentNumber  String
  recordedBy      → User (the host)
  createdAt       DateTime
```

## Tech Stack

### Backend
- Node.js + TypeScript
- GraphQL Yoga
- Drizzle ORM
- PostgreSQL
- JWT auth (JOSE + Argon2)

### Frontend
- React Native + Expo
- Expo Router (file-based routing)
- NativeWind (Tailwind CSS)
- Zustand (state management)
- **urql** (GraphQL client, chosen for smaller bundle, first-party RN offline support, clean Expo compatibility)
- expo-camera (QR scanning)

### Notifications
- Abstract interface with three channel adapters (WhatsApp, SMS, Email)
- Providers to be selected separately

### Infrastructure
- Docker Compose (PostgreSQL)
- Makefile for dev commands

## UI & Design

### Design Language

**Geometric and sharp.** Angular shapes, hard edges, bold typography. The app has its own visual identity - not a standard UI library look.

- **Color palette**: Cool bold - deep blues, teals, bright whites. Clean with edge.
- **Typography**: Wide/extended sans-serif (e.g., Space Grotesk, Outfit). Architectural, modern, takes up space with confidence.
- **Layout**: Hybrid approach based on context:
  - **Mobile (host flow)**: Full-bleed, immersive. Big bold headers, edge-to-edge lists, minimal chrome. Optimized for speed - search bar and results, nothing else.
  - **Desktop (manager/promoter)**: Grid panels for organizing data. Sharp geometric design language and bold typography prevent the generic admin dashboard look.

### Screens

**Auth**
- Sign up / Sign in

**Events (all roles)**
- Events list (my events, filterable by role)
- Create event (manager - single form with optional sections: basic info, door sales config with tiers, team)
- Event detail / overview

**Team management (manager)**
- Invite users by email
- Assign roles (Promoter, Host)
- Remove team members

**Lists (manager + promoter)**
- Lists overview for an event (all lists for manager, own lists for promoter)
- List detail (guest entries with status)
- Add guest to list (name + optional contact info)

**Host screens (mobile-optimized)**
- Check-in home: QR scanner prominent, search bar, door sale button
- Search results: guest entries across all lists, showing which list/promoter
- Check-in confirmation: guest info, document capture if missing, confirm button
- Door sale recording: tier selection, document entry (required), optional guest name

**Analytics (manager, desktop-optimized)**
- Event stats: total check-ins, per-list breakdown, door sales by tier
- Promoter performance: table with guests added, checked in, check-in rate per promoter

## Post-MVP Roadmap (Documented, Not Built)

- **Ticketing**: Paid ticket sales with integrated payments (Pix, credit card), competing with high-fee Brazilian platforms
- **Venue team management**: Venues with permanent staff that events can inherit (requires invitation/validation flow)
- **Guest → User linking**: Allow guests to create accounts and see their event history
- **Real-time dashboard**: Live check-in feed, occupancy, running totals
- **Advanced door sale tiers**: Time-based pricing, gender-based pricing, area-based pricing
- **Event auto-close improvements**: Activity-based closing, manager notifications

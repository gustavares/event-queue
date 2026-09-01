import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Custom scalars
  scalar DateTime

  # Enums
  enum UserRole {
    MANAGER
    PROMOTER
    HOST
  }

  enum EventStatus {
    DRAFT
    ACTIVE
    FINISHED
    CANCELLED
  }

  enum CheckInStatus {
    PENDING
    COMPLETED
  }

  enum EventVisibility {
    PUBLIC
    UNLISTED
  }

  enum EventSource {
    FIRST_PARTY
    CURATED
  }

  # Types
  type User {
    id: ID!
    email: String!
    name: String!
  }

  type Venue {
    id: ID!
    name: String!
    address: String!
    capacity: Int
    city: City
    createdAt: DateTime!
  }

  type Event {
    id: ID!
    name: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    status: EventStatus!
    venue: Venue
    locationName: String
    locationAddress: String
    doorSalesEnabled: Boolean!
    doorSaleTiers: [DoorSaleTier!]!
    createdBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DoorSaleTier {
    id: ID!
    name: String!
    price: Float!
    eventId: ID!
    createdAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Inputs
  input SignUpInput {
    email: String!
    password: String!
    name: String!
  }

  input SignInInput {
    email: String!
    password: String!
  }

  input CreateVenueInput {
    name: String!
    address: String!
    capacity: Int
    "BR-DISC-015. Required for the venue's events to appear in public listings."
    cityId: ID
  }

  input CreateEventInput {
    name: String!
    description: String
    startDate: DateTime!
    endDate: DateTime
    venueId: ID
    locationName: String
    locationAddress: String
    doorSalesEnabled: Boolean
  }

  input UpdateEventInput {
    name: String
    description: String
    startDate: DateTime
    endDate: DateTime
    venueId: ID
    locationName: String
    locationAddress: String
    doorSalesEnabled: Boolean
  }

  input DoorSaleTierInput {
    name: String!
    price: Float!
  }

  input UpdateDoorSaleTierInput {
    name: String
    price: Float
  }

  # ── Public discovery ────────────────────────────────────────────────
  # These types back the unauthenticated surface. PublicEvent is a deliberate
  # ALLOWLIST, not a filtered Event - see BR-DISC-005 and docs/patterns.md.
  # Never add a field here without checking it is safe for anyone on the internet.

  type City {
    id: ID!
    name: String!
    state: String!
    slug: String!
  }

  type Genre {
    id: ID!
    name: String!
    slug: String!
  }

  type Artist {
    id: ID!
    name: String!
    externalUrl: String
  }

  type LineupEntry {
    artist: Artist!
    position: Int!
    isHeadliner: Boolean!
  }

  type PublicEvent {
    id: ID!
    slug: String!
    name: String!
    description: String
    curatorNote: String
    startDate: DateTime!
    endDate: DateTime!
    status: EventStatus!
    source: EventSource!
    venueName: String
    venueAddress: String
    city: City!
    genres: [Genre!]!
    lineup: [LineupEntry!]!
    "Set only for CURATED events - where tickets are actually sold (BR-DISC-007)."
    externalTicketUrl: String
  }

  type SubscribeResult {
    email: String!
    cityName: String!
  }

  # BR-CUR-004. Facts only. There is deliberately no description or image field —
  # the source's prose and pictures are copyrighted, so the extractor has nowhere
  # to put them even if the model returns them.
  type ExtractedLineupEntry {
    name: String!
    isHeadliner: Boolean!
  }

  type ExtractedEvent {
    sourceUrl: String!
    name: String
    startDate: DateTime
    endDate: DateTime
    venueName: String
    venueAddress: String
    lineup: [ExtractedLineupEntry!]!
    priceFrom: Float
    ticketUrl: String
    "Fields the extractor could not determine. Non-empty means this cannot be published (BR-CUR-008)."
    missingFields: [String!]!
  }

  input LineupEntryInput {
    name: String!
    isHeadliner: Boolean
  }

  input ConfirmCuratedEventInput {
    sourceUrl: String!
    name: String!
    startDate: DateTime!
    endDate: DateTime
    cityId: ID!
    venueName: String!
    venueAddress: String!
    externalTicketUrl: String!
    "Our own copy — never the source's (BR-CUR-004/006)."
    description: String
    curatorNote: String
    lineup: [LineupEntryInput!]
    genreSlugs: [String!]
  }

  # Queries
  type Query {
    me: User
    event(id: ID!): Event
    myEvents: [Event!]!
    venues: [Venue!]!
    venue(id: ID!): Venue

    # ── Public, no authentication required ────────────────────────────
    cities: [City!]!
    genres: [Genre!]!
    publicEvents(
      citySlug: String
      genreSlugs: [String!]
      startsBefore: DateTime
      artistId: ID
    ): [PublicEvent!]!
    featuredEvents(citySlug: String!): [PublicEvent!]!
    publicEvent(slug: String!): PublicEvent
    artist(id: ID!): Artist
  }

  # Mutations
  type Mutation {
    signUp(input: SignUpInput!): AuthPayload!
    signIn(input: SignInInput!): AuthPayload!

    createVenue(input: CreateVenueInput!): Venue!

    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    transitionEventStatus(id: ID!, status: EventStatus!): Event!

    addDoorSaleTier(eventId: ID!, input: DoorSaleTierInput!): DoorSaleTier!
    updateDoorSaleTier(id: ID!, input: UpdateDoorSaleTierInput!): DoorSaleTier!
    removeDoorSaleTier(id: ID!): Boolean!

    # ── Public, no authentication required ────────────────────────────
    "BR-SUB-001..005. Capture only — nothing is sent."
    subscribeToCity(email: String!, citySlug: String!): SubscribeResult!

    # ── Publishing (Manager) ──────────────────────────────────────────
    publishEvent(id: ID!, cityId: ID): PublicEvent!
    unpublishEvent(id: ID!): Boolean!

    # ── Curation (curator capability) ─────────────────────────────────
    "BR-CUR-002/003. Reads a source page and returns fields for review. Saves nothing."
    extractEventFromUrl(sourceUrl: String!): ExtractedEvent!
    confirmCuratedEvent(input: ConfirmCuratedEventInput!): PublicEvent!
    setCuratorNote(eventId: ID!, note: String!): PublicEvent!
    setFeatured(eventId: ID!, from: DateTime!, until: DateTime!): PublicEvent!
  }
`;

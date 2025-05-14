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

  # Types
  type User {
    id: ID!
    email: String!
    name: String!
    managedEvents: [Event!]
    promotedEvents: [Event!]
    hostedEvents: [Event!]
  }

  type Venue {
    id: ID!
    name: String!
    address: String!
    events: [Event!]
  }

  type Event {
    id: ID!
    name: String!
    date: DateTime!
    venue: Venue!
    description: String
    status: EventStatus!
    createdBy: User!
    createdAt: DateTime!
    lists: [GuestList!]!
    team: [EventTeamMember!]!
  }

  type GuestList {
    id: ID!
    name: String!
    event: Event!
    entryValue: Float!
    createdBy: User!
    createdAt: DateTime!
    isPublic: Boolean!
    promoters: [User!]!
    guestEntries: [GuestListEntry!]!
  }

  type Guest {
    id: ID!
    firstName: String!
    lastName: String!
    email: String
    phone: String
    lists: [GuestList!]!
    addedBy: User
    checkInStatus: CheckInStatus!
    checkInTimestamp: DateTime
    notes: String
  }

  type GuestListEntry {
    id: ID!
    guestList: GuestList!
    guest: Guest!
    checkInStatus: CheckInStatus!
    checkInTimestamp: DateTime
    addedBy: User!
    createdAt: DateTime!
  }

  type EventTeamMember {
    user: User!
    event: Event!
    role: UserRole!
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

  input VenueInput {
    name: String!
    address: String!
  }

  input CreateEventInput {
    name: String!
    date: DateTime!
    venueId: ID
    newVenue: VenueInput
    description: String
    status: EventStatus
  }

  input UpdateEventInput {
    name: String
    date: DateTime
    venueId: ID
    description: String
    status: EventStatus
  }

  input CreateGuestListInput {
    name: String!
    eventId: ID!
    entryValue: Float!
    isPublic: Boolean!
  }

  input AddGuestInput {
    firstName: String!
    lastName: String!
    email: String
    phone: String
    listId: ID!
    notes: String
  }

  input CheckInGuestInput {
    guestListEntryId: ID!
  }

  # Queries
  type Query {
    me: User
    event(id: ID!): Event
    events: [Event!]!
    venues: [Venue!]!
    venue(id: ID!): Venue
    guestList(id: ID!): GuestList
    guest(id: ID!): Guest
  }

  # Mutations
  type Mutation {
    signUp(input: SignUpInput!): AuthPayload!
    signIn(input: SignInInput!): AuthPayload!
    
    createVenue(input: VenueInput!): Venue!
    updateVenue(id: ID!, input: VenueInput!): Venue!
    
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    
    createGuestList(input: CreateGuestListInput!): GuestList!
    deleteGuestList(id: ID!): Boolean!
    
    addGuest(input: AddGuestInput!): GuestListEntry!
    removeGuestFromList(guestListEntryId: ID!): Boolean!
    
    checkInGuest(input: CheckInGuestInput!): GuestListEntry!
    
    addTeamMember(eventId: ID!, userId: ID!, role: UserRole!): EventTeamMember!
    removeTeamMember(eventId: ID!, userId: ID!): Boolean!
  }
`;

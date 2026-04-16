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
  }

  type Venue {
    id: ID!
    name: String!
    address: String!
    capacity: Int
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

  # Queries
  type Query {
    me: User
    event(id: ID!): Event
    myEvents: [Event!]!
    venues: [Venue!]!
    venue(id: ID!): Venue
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
  }
`;

# Architecture Decision Record: GraphQL Implementation for Event Queue Backend

## Status
Accepted

## Context
We are developing the Event Queue application, which requires a robust backend to manage events, guest lists, and user roles. The backend needs to efficiently serve data to the React Native frontend while maintaining flexibility for future feature additions. We need to decide on the API architecture that will best support our development needs.

## Decision
We will implement GraphQL as our API architecture for the Event Queue backend, using Node.js with PostgreSQL as the database and Drizzle as the ORM.

## Detailed Implementation Plan

### Technology Stack
- **API Layer**: GraphQL with Apollo Server
- **Runtime**: Node.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Authentication**: JWT with Apollo context
- **Deployment**: Docker containers orchestrated with Docker Compose

### Schema Design Principles
We will follow demand-oriented schema design principles:
1. Design fields around specific client use cases
2. Create fine-grained queries and mutations rather than general-purpose ones
3. Avoid nullable arguments where possible to reduce ambiguity
4. Structure types to match the domain model of our application

### Core GraphQL Types
```graphql
type User {
  id: ID!
  email: String!
  name: String!
  managedEvents: [Event!]
  promotedEvents: [Event!]
  hostedEvents: [Event!]
}

type Event {
  id: ID!
  name: String!
  date: DateTime!
  location: String!
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
  guests: [Guest!]!
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

type EventTeamMember {
  user: User!
  event: Event!
  role: UserRole!
}

enum UserRole {
  MANAGER
  PROMOTER
  HOST
}

enum EventStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

enum CheckInStatus {
  PENDING
  COMPLETED
}
```

### Resolver Structure
We will organize resolvers by domain entity:
- User resolvers
- Event resolvers
- GuestList resolvers
- Guest resolvers

Each resolver file will contain query and mutation resolvers related to that entity.

### Authentication & Authorization
We will implement a context-based authentication system:
1. JWT tokens for authentication
2. Role-based authorization checks in resolvers
3. Event-specific permission checks using the EventTeamMember relationship

### Database Schema
We will use Drizzle to define and manage our database schema, with migrations for version control. The schema will closely mirror our GraphQL types while optimizing for database performance.

## Implementation Steps

1. Set up Apollo Server with Express
2. Define GraphQL schema based on our domain model
3. Implement Drizzle ORM with PostgreSQL
4. Create resolvers for each entity type
5. Implement authentication and authorization
6. Set up Docker Compose for local development
7. Create testing infrastructure for GraphQL resolvers
8. Document the API using GraphQL's introspection
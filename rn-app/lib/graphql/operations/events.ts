import { gql } from 'urql';

export const MY_EVENTS_QUERY = gql`
  query MyEvents {
    myEvents {
      id
      name
      description
      startDate
      endDate
      status
      venue {
        id
        name
        address
      }
      locationName
      locationAddress
      doorSalesEnabled
      doorSaleTiers {
        id
        name
        price
      }
      createdAt
    }
  }
`;

export const GET_EVENT_QUERY = gql`
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      name
      description
      startDate
      endDate
      status
      venue {
        id
        name
        address
      }
      locationName
      locationAddress
      doorSalesEnabled
      doorSaleTiers {
        id
        name
        price
      }
      createdBy {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_EVENT_MUTATION = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      name
      status
    }
  }
`;

export const UPDATE_EVENT_MUTATION = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      name
      description
      startDate
      endDate
      status
      venue {
        id
        name
        address
      }
      locationName
      locationAddress
      doorSalesEnabled
    }
  }
`;

export const DELETE_EVENT_MUTATION = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

export const TRANSITION_EVENT_STATUS_MUTATION = gql`
  mutation TransitionEventStatus($id: ID!, $status: EventStatus!) {
    transitionEventStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const ADD_DOOR_SALE_TIER_MUTATION = gql`
  mutation AddDoorSaleTier($eventId: ID!, $input: DoorSaleTierInput!) {
    addDoorSaleTier(eventId: $eventId, input: $input) {
      id
      name
      price
      eventId
    }
  }
`;

export const UPDATE_DOOR_SALE_TIER_MUTATION = gql`
  mutation UpdateDoorSaleTier($id: ID!, $input: UpdateDoorSaleTierInput!) {
    updateDoorSaleTier(id: $id, input: $input) {
      id
      name
      price
    }
  }
`;

export const REMOVE_DOOR_SALE_TIER_MUTATION = gql`
  mutation RemoveDoorSaleTier($id: ID!) {
    removeDoorSaleTier(id: $id)
  }
`;

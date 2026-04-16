import { gql } from 'urql';

export const VENUES_QUERY = gql`
  query Venues {
    venues {
      id
      name
      address
      capacity
    }
  }
`;

export const GET_VENUE_QUERY = gql`
  query GetVenue($id: ID!) {
    venue(id: $id) {
      id
      name
      address
      capacity
    }
  }
`;

export const CREATE_VENUE_MUTATION = gql`
  mutation CreateVenue($input: CreateVenueInput!) {
    createVenue(input: $input) {
      id
      name
      address
      capacity
    }
  }
`;

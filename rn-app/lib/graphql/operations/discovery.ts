import { gql } from 'urql';

/**
 * Public discovery operations.
 *
 * The queries here run unauthenticated. Variable names must match the SDL exactly —
 * see docs/patterns.md § GraphQL Operations.
 */

const PUBLIC_EVENT_FIELDS = `
  id
  slug
  name
  description
  curatorNote
  startDate
  endDate
  status
  source
  venueName
  venueAddress
  priceFrom
  externalTicketUrl
  city { id name state slug }
  genres { id name slug }
  lineup { position isHeadliner artist { id name externalUrl } }
`;

export const CITIES_QUERY = gql`
  query Cities {
    cities { id name state slug }
  }
`;

export const GENRES_QUERY = gql`
  query Genres {
    genres { id name slug }
  }
`;

export const PUBLIC_EVENTS_QUERY = gql`
  query PublicEvents($citySlug: String, $genreSlugs: [String!], $startsBefore: DateTime) {
    publicEvents(citySlug: $citySlug, genreSlugs: $genreSlugs, startsBefore: $startsBefore) {
      ${PUBLIC_EVENT_FIELDS}
    }
  }
`;

export const FEATURED_EVENTS_QUERY = gql`
  query FeaturedEvents($citySlug: String!) {
    featuredEvents(citySlug: $citySlug) {
      ${PUBLIC_EVENT_FIELDS}
    }
  }
`;

export const PUBLIC_EVENT_QUERY = gql`
  query PublicEvent($slug: String!) {
    publicEvent(slug: $slug) {
      ${PUBLIC_EVENT_FIELDS}
    }
  }
`;

export const ARTIST_EVENTS_QUERY = gql`
  query ArtistEvents($id: ID!) {
    artist(id: $id) { id name externalUrl }
    publicEvents(artistId: $id) {
      ${PUBLIC_EVENT_FIELDS}
    }
  }
`;

export const SUBSCRIBE_MUTATION = gql`
  mutation SubscribeToCity($email: String!, $citySlug: String!) {
    subscribeToCity(email: $email, citySlug: $citySlug) {
      email
      cityName
    }
  }
`;

/* ── Authenticated: publishing and curation ───────────────────────── */

export const PUBLISH_EVENT_MUTATION = gql`
  mutation PublishEvent($id: ID!, $cityId: ID) {
    publishEvent(id: $id, cityId: $cityId) { id slug name }
  }
`;

export const UNPUBLISH_EVENT_MUTATION = gql`
  mutation UnpublishEvent($id: ID!) {
    unpublishEvent(id: $id)
  }
`;

export const EXTRACT_EVENT_MUTATION = gql`
  mutation ExtractEventFromUrl($sourceUrl: String!) {
    extractEventFromUrl(sourceUrl: $sourceUrl) {
      sourceUrl
      name
      startDate
      endDate
      venueName
      venueAddress
      priceFrom
      ticketUrl
      missingFields
      lineup { name isHeadliner }
    }
  }
`;

export const CONFIRM_CURATED_EVENT_MUTATION = gql`
  mutation ConfirmCuratedEvent($input: ConfirmCuratedEventInput!) {
    confirmCuratedEvent(input: $input) { id slug name }
  }
`;

export const SET_CURATOR_NOTE_MUTATION = gql`
  mutation SetCuratorNote($eventId: ID!, $note: String!) {
    setCuratorNote(eventId: $eventId, note: $note) { id slug curatorNote }
  }
`;

export const SET_FEATURED_MUTATION = gql`
  mutation SetFeatured($eventId: ID!, $from: DateTime!, $until: DateTime!) {
    setFeatured(eventId: $eventId, from: $from, until: $until) { id slug }
  }
`;

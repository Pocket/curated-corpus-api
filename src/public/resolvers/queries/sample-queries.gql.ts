import { gql } from 'apollo-server';

export const GET_SCHEDULED_SURFACE = gql`
  query scheduledSurface($id: ID!) {
    scheduledSurface(id: $id) {
      id
      name
    }
  }
`;

export const GET_SCHEDULED_SURFACE_WITH_ITEMS = gql`
  query scheduledSurfaceWithItems($id: ID!, $date: Date!) {
    scheduledSurface(id: $id) {
      id
      name
      items(date: $date) {
        id
        surfaceId
        scheduledDate
        corpusItem {
          id
          url
          title
          excerpt
          language
          authors {
            name
            sortOrder
          }
          publisher
          imageUrl
        }
      }
    }
  }
`;

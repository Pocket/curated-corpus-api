import { gql } from 'apollo-server-express';

export const CuratedItemData = gql`
  fragment CuratedItemData on CuratedItem {
    externalId
    title
    language
    url
    imageUrl
    excerpt
    status
    createdBy
    createdAt
    updatedAt
  }
`;

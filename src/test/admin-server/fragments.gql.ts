import { gql } from 'apollo-server-express';

export const CuratedItemData = gql`
  fragment CuratedItemData on ApprovedCuratedCorpusItem {
    externalId
    title
    language
    publisher
    url
    imageUrl
    excerpt
    status
    topic
    isCollection
    isShortLived
    isSyndicated
    createdBy
    createdAt
    updatedBy
    updatedAt
  }
`;

export const RejectedItemData = gql`
  fragment RejectedItemData on RejectedCuratedCorpusItem {
    externalId
    url
    title
    topic
    language
    publisher
    reason
    createdBy
    createdAt
  }
`;

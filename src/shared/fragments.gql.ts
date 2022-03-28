import { gql } from 'apollo-server';

export const CuratedItemData = gql`
  fragment CuratedItemData on ApprovedCorpusItem {
    externalId
    prospectId
    title
    language
    publisher
    url
    imageUrl
    excerpt
    status
    topic
    source
    isCollection
    isTimeSensitive
    isSyndicated
    createdBy
    createdAt
    updatedBy
    updatedAt
  }
`;

export const RejectedItemData = gql`
  fragment RejectedItemData on RejectedCorpusItem {
    externalId
    prospectId
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

export const ScheduledItemData = gql`
  fragment ScheduledItemData on ScheduledCorpusItem {
    externalId
    createdAt
    createdBy
    updatedAt
    updatedBy
    scheduledDate
    approvedItem {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

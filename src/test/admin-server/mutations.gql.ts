import { gql } from 'apollo-server';
import { CuratedItemData } from './fragments.gql';

/**
 * Sample mutations for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */
export const UPDATE_CURATED_ITEM = gql`
  mutation updateCuratedItem(
    $externalId: ID!
    $url: Url!
    $title: String!
    $excerpt: String!
    $status: CuratedStatus!
    $language: String!
    $imageUrl: Url
  ) {
    updateCuratedItem(
      data: {
        externalId: $externalId
        url: $url
        title: $title
        excerpt: $excerpt
        status: $status
        language: $language
        imageUrl: $imageUrl
      }
    ) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const DELETE_NEW_TAB_FEED_SCHEDULE = gql`
  mutation deleteNewTabFeedScheduledItem($externalId: ID!) {
    deleteNewTabFeedScheduledItem(data: { externalId: $externalId }) {
      externalId
      createdAt
      createdBy
      updatedAt
      updatedBy
      scheduledDate
      curatedItem {
        ...CuratedItemData
      }
    }
  }
  ${CuratedItemData}
`;

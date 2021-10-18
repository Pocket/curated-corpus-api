import { gql } from 'apollo-server-express';
import { CuratedItemData } from './fragments.gql';

/**
 * Sample queries for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */
export const GET_CURATED_ITEMS = gql`
  query getCuratedItems(
    $filters: CuratedItemFilter
    $pagination: PaginationInput
  ) {
    getCuratedItems(filters: $filters, pagination: $pagination) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          ...CuratedItemData
        }
      }
    }
  }
  ${CuratedItemData}
`;

export const GET_NEW_TAB_FEED_SCHEDULED_ITEMS = gql`
  query getNewTabFeedScheduledItems(
    $filters: NewTabFeedScheduledItemsFilterInput!
  ) {
    getNewTabFeedScheduledItems(filters: $filters) {
      items {
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
  }
  ${CuratedItemData}
`;

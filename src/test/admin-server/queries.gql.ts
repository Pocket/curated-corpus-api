import { gql } from 'apollo-server-express';
import { CuratedItemData } from './fragments.gql';

/**
 * Sample queries for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */
export const GET_CURATED_ITEMS = gql`
  query getCuratedItems($page: Int, $perPage: Int) {
    getCuratedItems(page: $page, perPage: $perPage) {
      items {
        ...CuratedItemData
      }
      pagination {
        currentPage
        totalPages
        totalResults
        perPage
      }
    }
  }
  ${CuratedItemData}
`;

export const GET_CURATED_ITEMS_WITH_FILTERS = gql`
  query getCuratedItems(
    $page: Int
    $perPage: Int
    $filters: CuratedItemFilterInput
  ) {
    getCuratedItems(page: $page, perPage: $perPage, filters: $filters) {
      items {
        ...CuratedItemData
      }
      pagination {
        currentPage
        totalPages
        totalResults
        perPage
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

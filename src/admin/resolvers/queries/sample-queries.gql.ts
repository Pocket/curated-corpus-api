import { gql } from 'apollo-server';
import {
  CuratedItemData,
  RejectedItemData,
  ScheduledItemData,
} from '../../../shared/fragments.gql';

/**
 * Sample queries for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend and this repository's integration tests.
 */
export const GET_APPROVED_ITEMS = gql`
  query getApprovedItems(
    $filters: ApprovedCuratedCorpusItemFilter
    $pagination: PaginationInput
  ) {
    getApprovedCuratedCorpusItems(filters: $filters, pagination: $pagination) {
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

export const GET_REJECTED_ITEMS = gql`
  query getRejectedItems(
    $filters: RejectedCuratedCorpusItemFilter
    $pagination: PaginationInput
  ) {
    getRejectedCuratedCorpusItems(filters: $filters, pagination: $pagination) {
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
          ...RejectedItemData
        }
      }
    }
  }
  ${RejectedItemData}
`;

export const GET_SCHEDULED_ITEMS = gql`
  query getScheduledItems($filters: ScheduledCuratedCorpusItemsFilterInput!) {
    getScheduledCuratedCorpusItems(filters: $filters) {
      totalCount
      collectionCount
      syndicatedCount
      scheduledDate
      items {
        ...ScheduledItemData
      }
    }
  }
  ${ScheduledItemData}
`;

export const GET_APPROVED_ITEM_BY_URL = gql`
  query getApprovedCuratedCorpusItemByUrl($url: String!) {
    getApprovedCuratedCorpusItemByUrl(url: $url) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const GET_NEW_TABS_FOR_USER = gql`
  query getNewTabsForUser {
    getNewTabsForUser {
      guid
      name
      utcOffset
      prospectTypes
    }
  }
`;
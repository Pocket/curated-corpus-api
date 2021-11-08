import { gql } from 'apollo-server-express';
import {
  ApprovedCuratedCorpusItemData,
  RejectedCuratedCorpusItemData,
} from './fragments.gql';

/**
 * Sample queries for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
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
          ...ApprovedCuratedCorpusItemData
        }
      }
    }
  }
  ${ApprovedCuratedCorpusItemData}
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
          ...RejectedCuratedCorpusItemData
        }
      }
    }
  }
  ${RejectedCuratedCorpusItemData}
`;

export const GET_SCHEDULED_ITEMS = gql`
  query getScheduledItems($filters: ScheduledCuratedCorpusItemsFilterInput!) {
    getScheduledCuratedCorpusItems(filters: $filters) {
      items {
        externalId
        createdAt
        createdBy
        updatedAt
        updatedBy
        scheduledDate
        approvedItem {
          ...ApprovedCuratedCorpusItemData
        }
      }
    }
  }
  ${ApprovedCuratedCorpusItemData}
`;

import { gql } from 'apollo-server-express';
import { CuratedItem } from '@prisma/client';

/**
 * Sample queries for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */
const CuratedItemData = gql`
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

export const GET_CURATED_ITEMS_WITH_ORDER_BY = gql`
  query getCuratedItems(
    $page: Int
    $perPage: Int
    $orderBy: CuratedItemOrderByInput
  ) {
    getCuratedItems(page: $page, perPage: $perPage, orderBy: $orderBy) {
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

export const GET_CURATED_ITEMS_KITCHEN_SINK = gql`
  query getCuratedItems(
    $page: Int
    $perPage: Int
    $orderBy: CuratedItemOrderByInput
    $filters: CuratedItemFilterInput
  ) {
    getCuratedItems(
      page: $page
      perPage: $perPage
      filters: $filters
      orderBy: $orderBy
    ) {
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

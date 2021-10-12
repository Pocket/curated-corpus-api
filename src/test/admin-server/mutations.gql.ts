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
    $imageUrl: Url!
    $topic: String!
    $isCollection: Boolean!
    $isShortLived: Boolean!
    $isSyndicated: Boolean!
    $updatedBy: String!
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
        topic: $topic
        isCollection: $isCollection
        isShortLived: $isShortLived
        isSyndicated: $isSyndicated
        updatedBy: $updatedBy
      }
    ) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const CREATE_NEW_TAB_FEED_SCHEDULE = gql`
  mutation createNewTabFeedScheduledItem(
    $curatedItemExternalId: ID!
    $newTabFeedExternalId: ID!
    $scheduledDate: Date!
    $createdBy: String!
  ) {
    createNewTabFeedScheduledItem(
      data: {
        curatedItemExternalId: $curatedItemExternalId
        newTabFeedExternalId: $newTabFeedExternalId
        scheduledDate: $scheduledDate
        createdBy: $createdBy
      }
    ) {
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

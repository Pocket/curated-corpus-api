import { gql } from 'apollo-server';
import { CuratedItemData } from './fragments.gql';

/**
 * Sample mutations for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */
export const CREATE_CURATED_ITEM = gql`
  mutation createCuratedItem(
    $url: Url!
    $title: String!
    $excerpt: String!
    $status: CuratedStatus!
    $language: String!
    $publisher: String!
    $imageUrl: Url!
    $topic: String!
    $isCollection: Boolean!
    $isShortLived: Boolean!
    $isSyndicated: Boolean!
    $newTabFeedExternalId: ID
    $scheduledDate: Date
  ) {
    createCuratedItem(
      data: {
        url: $url
        title: $title
        excerpt: $excerpt
        status: $status
        language: $language
        publisher: $publisher
        imageUrl: $imageUrl
        topic: $topic
        isCollection: $isCollection
        isShortLived: $isShortLived
        isSyndicated: $isSyndicated
        newTabFeedExternalId: $newTabFeedExternalId
        scheduledDate: $scheduledDate
      }
    ) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const UPDATE_CURATED_ITEM = gql`
  mutation updateCuratedItem(
    $externalId: ID!
    $url: Url!
    $title: String!
    $excerpt: String!
    $status: CuratedStatus!
    $language: String!
    $publisher: String!
    $imageUrl: Url!
    $topic: String!
    $isCollection: Boolean!
    $isShortLived: Boolean!
    $isSyndicated: Boolean!
  ) {
    updateCuratedItem(
      data: {
        externalId: $externalId
        url: $url
        title: $title
        excerpt: $excerpt
        status: $status
        language: $language
        publisher: $publisher
        imageUrl: $imageUrl
        topic: $topic
        isCollection: $isCollection
        isShortLived: $isShortLived
        isSyndicated: $isSyndicated
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
    $newTabGuid: NewTabGuid!
    $scheduledDate: Date!
  ) {
    createNewTabFeedScheduledItem(
      data: {
        curatedItemExternalId: $curatedItemExternalId
        newTabGuid: $newTabGuid
        scheduledDate: $scheduledDate
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

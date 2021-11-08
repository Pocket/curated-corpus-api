import { gql } from 'apollo-server';
import { ApprovedCuratedCorpusItemData } from './fragments.gql';

/**
 * Sample mutations for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */
export const CREATE_APPROVED_ITEM = gql`
  mutation createApprovedItem(
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
    $newTabGuid: ID
    $scheduledDate: Date
  ) {
    createApprovedCuratedCorpusItem(
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
        newTabGuid: $newTabGuid
        scheduledDate: $scheduledDate
      }
    ) {
      ...ApprovedCuratedCorpusItemData
    }
  }
  ${ApprovedCuratedCorpusItemData}
`;

export const UPDATE_APPROVED_ITEM = gql`
  mutation updateApprovedItem(
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
    updateApprovedCuratedCorpusItem(
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
      ...ApprovedCuratedCorpusItemData
    }
  }
  ${ApprovedCuratedCorpusItemData}
`;

export const CREATE_SCHEDULED_ITEM = gql`
  mutation createScheduledItem(
    $approvedItemExternalId: ID!
    $newTabGuid: ID!
    $scheduledDate: Date!
  ) {
    createScheduledCuratedCorpusItem(
      data: {
        approvedItemExternalId: $approvedItemExternalId
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
      approvedItem {
        ...ApprovedCuratedCorpusItemData
      }
    }
  }
  ${ApprovedCuratedCorpusItemData}
`;

export const DELETE_SCHEDULE_ITEM = gql`
  mutation deleteScheduledItem($externalId: ID!) {
    deleteScheduledCuratedCorpusItem(data: { externalId: $externalId }) {
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
  ${ApprovedCuratedCorpusItemData}
`;

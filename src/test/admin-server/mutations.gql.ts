import { gql } from 'apollo-server';
import { CuratedItemData, RejectedItemData } from './fragments.gql';

/**
 * Sample mutations for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */
export const CREATE_APPROVED_ITEM = gql`
  mutation createApprovedItem(
    $prospectId: ID!
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
        prospectId: $prospectId
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
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const UPDATE_APPROVED_ITEM = gql`
  mutation updateApprovedItem(
    $externalId: ID!
    $prospectId: ID!
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
        prospectId: $prospectId
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

export const REJECT_APPROVED_ITEM = gql`
  mutation rejectApprovedItem($data: RejectApprovedCuratedCorpusItemInput!) {
    rejectApprovedCuratedCorpusItem(data: $data) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const CREATE_REJECTED_ITEM = gql`
  mutation createRejectedItem(
    $prospectId: ID!
    $url: Url!
    $title: String
    $topic: String!
    $language: String
    $publisher: String
    $reason: String!
  ) {
    createRejectedCuratedCorpusItem(
      data: {
        prospectId: $prospectId
        url: $url
        title: $title
        topic: $topic
        language: $language
        publisher: $publisher
        reason: $reason
      }
    ) {
      ...RejectedItemData
    }
  }
  ${RejectedItemData}
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
        ...CuratedItemData
      }
    }
  }
  ${CuratedItemData}
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
        ...CuratedItemData
      }
    }
  }
  ${CuratedItemData}
`;

export const UPLOAD_APPROVED_ITEM_IMAGE = gql`
  mutation uploadApprovedCuratedCorpusItemImage($image: Upload!) {
    uploadApprovedCuratedCorpusItemImage(data: $image) {
      url
    }
  }
`;

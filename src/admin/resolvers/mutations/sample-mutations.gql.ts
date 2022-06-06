import { gql } from 'apollo-server';
import {
  CuratedItemData,
  RejectedItemData,
  ScheduledItemData,
} from '../../../shared/fragments.gql';

/**
 * Sample mutations for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend and this repository's integration tests.
 */
export const CREATE_APPROVED_ITEM = gql`
  mutation createApprovedItem($data: CreateApprovedCorpusItemInput!) {
    createApprovedCorpusItem(data: $data) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const UPDATE_APPROVED_ITEM = gql`
  mutation updateApprovedCorpusItem($data: UpdateApprovedCorpusItemInput!) {
    updateApprovedCorpusItem(data: $data) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const UPDATE_APPROVED_ITEM_AUTHORS = gql`
  mutation updateApprovedCorpusItemAuthors(
    $data: UpdateApprovedCorpusItemAuthorsInput!
  ) {
    updateApprovedCorpusItemAuthors(data: $data) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const REJECT_APPROVED_ITEM = gql`
  mutation rejectApprovedItem($data: RejectApprovedCorpusItemInput!) {
    rejectApprovedCorpusItem(data: $data) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const CREATE_REJECTED_ITEM = gql`
  mutation createRejectedItem($data: CreateRejectedCorpusItemInput!) {
    createRejectedCorpusItem(data: $data) {
      ...RejectedItemData
    }
  }
  ${RejectedItemData}
`;

export const CREATE_SCHEDULED_ITEM = gql`
  mutation createScheduledItem($data: CreateScheduledCorpusItemInput!) {
    createScheduledCorpusItem(data: $data) {
      ...ScheduledItemData
    }
  }
  ${ScheduledItemData}
`;

export const DELETE_SCHEDULED_ITEM = gql`
  mutation deleteScheduledItem($data: DeleteScheduledCorpusItemInput!) {
    deleteScheduledCorpusItem(data: $data) {
      ...ScheduledItemData
    }
  }
  ${ScheduledItemData}
`;

export const RESCHEDULE_SCHEDULED_ITEM = gql`
  mutation rescheduleScheduledItem($data: RescheduleScheduledCorpusItemInput!) {
    rescheduleScheduledCorpusItem(data: $data) {
      ...ScheduledItemData
    }
  }
  ${ScheduledItemData}
`;

export const UPLOAD_APPROVED_ITEM_IMAGE = gql`
  mutation uploadApprovedCorpusItemImage($image: Upload!) {
    uploadApprovedCorpusItemImage(data: $image) {
      url
    }
  }
`;

export const IMPORT_APPROVED_ITEM = gql`
  mutation importApprovedItem($data: ImportApprovedCorpusItemInput!) {
    importApprovedCorpusItem(data: $data) {
      approvedItem {
        ...CuratedItemData
      }
      scheduledItem {
        ...ScheduledItemData
        scheduledSurfaceGuid
      }
    }
  }
  ${CuratedItemData}
  ${ScheduledItemData}
`;

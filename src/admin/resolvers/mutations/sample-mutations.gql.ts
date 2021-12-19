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
  mutation createApprovedItem($data: CreateApprovedCuratedCorpusItemInput!) {
    createApprovedCuratedCorpusItem(data: $data) {
      ...CuratedItemData
    }
  }
  ${CuratedItemData}
`;

export const UPDATE_APPROVED_ITEM = gql`
  mutation updateApprovedCuratedCorpusItem(
    $data: UpdateApprovedCuratedCorpusItemInput!
  ) {
    updateApprovedCuratedCorpusItem(data: $data) {
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
  mutation createRejectedItem($data: CreateRejectedCuratedCorpusItemInput!) {
    createRejectedCuratedCorpusItem(data: $data) {
      ...RejectedItemData
    }
  }
  ${RejectedItemData}
`;

export const CREATE_SCHEDULED_ITEM = gql`
  mutation createScheduledItem($data: CreateScheduledCuratedCorpusItemInput!) {
    createScheduledCuratedCorpusItem(data: $data) {
      ...ScheduledItemData
    }
  }
  ${ScheduledItemData}
`;

export const DELETE_SCHEDULED_ITEM = gql`
  mutation deleteScheduledItem($data: DeleteScheduledCuratedCorpusItemInput!) {
    deleteScheduledCuratedCorpusItem(data: $data) {
      ...ScheduledItemData
    }
  }
  ${ScheduledItemData}
`;

export const UPLOAD_APPROVED_ITEM_IMAGE = gql`
  mutation uploadApprovedCuratedCorpusItemImage($image: Upload!) {
    uploadApprovedCuratedCorpusItemImage(data: $image) {
      url
    }
  }
`;

import {
  ApprovedItem,
  CuratedStatus,
  ScheduledItem as ScheduledItemModel,
} from '@prisma/client';

export type PaginationInput = {
  after?: string;
  before?: string;
  first?: number;
  last?: number;
};

export type ApprovedItemFilter = {
  language?: string;
  status?: CuratedStatus;
  title?: string;
  topic?: string;
  url?: string;
};

export type RejectedCuratedCorpusItemFilter = {
  url?: string;
  title?: string;
  topic?: string;
  language?: string;
};

/**
 * These properties are the same for both createApprovedItem and updateApprovedItem
 * mutations.
 */
type ApprovedItemRequiredInput = {
  prospectId: string;
  title: string;
  excerpt: string;
  status: CuratedStatus;
  language: string;
  publisher: string;
  imageUrl: string;
  topic: string;
  isTimeSensitive: boolean;
};

export type CreateApprovedItemInput = ApprovedItemRequiredInput & {
  // These required properties are set once only at creation time
  // and never changed, so they're not part of the shared input type above.
  url: string;
  isCollection: boolean;
  isSyndicated: boolean;
  // These are optional properties for approving AND scheduling the item
  // on New Tab at the same time.
  scheduledDate?: string;
  newTabGuid?: string;
};

export type UpdateApprovedItemInput = {
  externalId: string;
} & ApprovedItemRequiredInput;

export type RejectApprovedItemInput = {
  externalId: string;
  reason: string;
};

export type CreateRejectedItemInput = {
  prospectId: string;
  url: string;
  title?: string;
  topic: string;
  language?: string;
  publisher?: string;
  reason: string;
};

export type ScheduledItem = ScheduledItemModel & {
  approvedItem: ApprovedItem;
};

export type ScheduledItemsResult = {
  scheduledDate: string;
  collectionCount: number;
  syndicatedCount: number;
  totalCount: number;
  items: ScheduledItem[];
};

export type ScheduledItemFilterInput = {
  newTabGuid: string;
  startDate: string;
  endDate: string;
};

export type DeleteScheduledItemInput = {
  externalId: string;
};

export type CreateScheduledItemInput = {
  approvedItemExternalId: string;
  newTabGuid: string;
  scheduledDate: string;
};

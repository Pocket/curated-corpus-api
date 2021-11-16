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
  url: string;
  title: string;
  excerpt: string;
  status: CuratedStatus;
  language: string;
  publisher: string;
  imageUrl: string;
  topic: string;
  isCollection: boolean;
  isShortLived: boolean;
  isSyndicated: boolean;
};

export type CreateApprovedItemInput = ApprovedItemRequiredInput & {
  scheduledDate?: string;
  newTabGuid?: string;
};

export type UpdateApprovedItemInput = {
  externalId: string;
} & ApprovedItemRequiredInput;

export type ScheduledItem = ScheduledItemModel & {
  approvedItem: ApprovedItem;
};

export type ScheduledItemsResult = {
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

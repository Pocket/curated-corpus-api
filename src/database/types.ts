import { CuratedItem, CuratedStatus, NewTabFeedSchedule } from '@prisma/client';

export type Pagination = {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
};

export type CuratedItemsResult = {
  items: CuratedItem[];
  pagination: Pagination;
};

export type CuratedItemFilter = {
  url?: string;
  title?: string;
  topic?: string;
  status?: CuratedStatus;
  language?: string;
};

/**
 * These properties are the same for both createCuratedItem and updateCuratedItem
 * mutations.
 */
type CuratedItemRequiredInput = {
  url: string;
  title: string;
  excerpt: string;
  status: CuratedStatus;
  language: string;
  imageUrl: string;
  topic: string;
  isCollection: boolean;
  isShortLived: boolean;
  isSyndicated: boolean;
};

export type CreateCuratedItemInput = CuratedItemRequiredInput & {
  scheduledDate?: string;
  newTabFeedExternalId?: string;
};

export type UpdateCuratedItemInput = {
  externalId: string;
} & CuratedItemRequiredInput;

export type NewTabFeedScheduledItem = NewTabFeedSchedule & {
  curatedItem: CuratedItem;
};

export type NewTabFeedScheduledItemsResult = {
  items: NewTabFeedSchedule[];
};

export type NewTabFeedScheduleFilterInput = {
  newTabExternalId: string;
  startDate: string;
  endDate: string;
};

export type DeleteNewTabFeedScheduledItemInput = {
  externalId: string;
};

export type CreateNewTabFeedScheduledItemInput = {
  curatedItemExternalId: string;
  newTabFeedExternalId: string;
  scheduledDate: string;
};

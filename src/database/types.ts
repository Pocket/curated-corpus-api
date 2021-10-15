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

export type CuratedItemFilterInput = {
  url?: string;
  title?: string;
  topic?: string;
  status?: CuratedStatus;
  language?: string;
};

export type UpdateCuratedItemInput = {
  externalId: string;
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

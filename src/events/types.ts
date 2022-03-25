import { ApprovedItem, RejectedCuratedCorpusItem } from '@prisma/client';
import { ScheduledItem, CorpusItem } from '../database/types';
import { ScheduledItem as ScheduledItemModel } from '@prisma/client';

export enum ReviewedCorpusItemEventType {
  ADD_ITEM = 'ADD_ITEM',
  UPDATE_ITEM = 'UPDATE_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  REJECT_ITEM = 'REJECT_ITEM',
}

export enum ScheduledCorpusItemEventType {
  ADD_SCHEDULE = 'ADD_SCHEDULE',
  REMOVE_SCHEDULE = 'REMOVE_SCHEDULE',
  RESCHEDULE = 'RESCHEDULE',
}

export type ReviewedCorpusItemEventTypeString =
  keyof typeof ReviewedCorpusItemEventType;
export type ScheduledCorpusItemEventTypeString =
  keyof typeof ScheduledCorpusItemEventType;

// Data common to all events
export type BaseEventData = {
  eventType:
    | ReviewedCorpusItemEventTypeString
    | ScheduledCorpusItemEventTypeString;
  timestamp: number; // epoch time (ms)
  source: string;
  version: string; // semver (e.g. 1.2.33)
};

// Data for the events that are fired on changes to curated items
export type ReviewedCorpusItemPayload = {
  reviewedCorpusItem: ApprovedItem | RejectedCuratedCorpusItem;
};

// Data for the events that are fired on updates to Scheduled Surface schedule
export type ScheduledCorpusItemPayload = {
  scheduledCorpusItem: ScheduledItem;
};

export type ScheduledItemEventBusPayload = Pick<
  ScheduledItemModel,
  'createdBy' | 'scheduledSurfaceGuid'
> &
  Pick<
    ApprovedItem,
    'topic' | 'isSyndicated' | keyof Omit<CorpusItem, 'id'>
  > & {
    scheduledItemId: string; // externalId of ScheduledItem
    approvedItemId: string; // externalId of ApprovedItem
    scheduledDate: string; // UTC Date string YYYY-MM-DD
    eventType: string; // TODO - config.eventBridge.addScheduledEventType
    createdAt: string; // UTC timestamp string
    updatedAt: string; // UTC timestamp string
  };

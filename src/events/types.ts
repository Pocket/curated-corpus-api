import { ApprovedItem, RejectedCuratedCorpusItem } from '@prisma/client';
import { ScheduledItem } from '../database/types';

export enum ReviewedCorpusItemEventType {
  ADD_ITEM = 'ADD_ITEM',
  UPDATE_ITEM = 'UPDATE_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  REJECT_ITEM = 'REJECT_ITEM',
}

export enum ScheduledCorpusItemEventType {
  ADD_SCHEDULE = 'ADD_SCHEDULE',
  REMOVE_SCHEDULE = 'REMOVE_SCHEDULE',
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

// Data for the events that are fired on updates to New Tab schedule
export type ScheduledCorpusItemPayload = {
  scheduledCorpusItem: ScheduledItem;
};

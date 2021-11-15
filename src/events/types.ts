import { CuratedItem, RejectedCuratedCorpusItem } from '@prisma/client';
import { NewTabFeedScheduledItem } from '../database/types';

export enum EventType {
  ADD_ITEM = 'ADD_ITEM',
  UPDATE_ITEM = 'UPDATE_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  REJECT_ITEM = 'REJECT_ITEM',
  ADD_SCHEDULE = 'ADD_SCHEDULE',
  REMOVE_SCHEDULE = 'REMOVE_SCHEDULE',
}

// Data common to all events
export type BasicEventData = {
  timestamp: number; // epoch time (ms)
  source: string;
  version: string; // semver (e.g. 1.2.33)
};

export type EventTypeString = keyof typeof EventType;

export type BasicCuratedCorpusEventPayload = {
  // Always send the reviewed_corpus_item entity
  reviewedCorpusItem: CuratedItem | RejectedCuratedCorpusItem;
  // If a schedule event was triggered, send the scheduled_corpus_item entity, too
  scheduledCorpusItem?: NewTabFeedScheduledItem;
};

export type CuratedCorpusEventPayload = BasicCuratedCorpusEventPayload &
  BasicEventData & { eventType: EventTypeString };

export type SnowplowEventType =
  | 'reviewed_corpus_item_added'
  | 'reviewed_corpus_item_updated'
  | 'reviewed_corpus_item_removed'
  | 'reviewed_corpus_item_rejected'
  | 'scheduled_corpus_item_added'
  | 'scheduled_corpus_item_removed';

export const SnowplowEventMap: Record<EventTypeString, SnowplowEventType> = {
  ADD_ITEM: 'reviewed_corpus_item_added',
  UPDATE_ITEM: 'reviewed_corpus_item_updated',
  REMOVE_ITEM: 'reviewed_corpus_item_removed',
  REJECT_ITEM: 'reviewed_corpus_item_rejected',
  ADD_SCHEDULE: 'scheduled_corpus_item_added',
  REMOVE_SCHEDULE: 'scheduled_corpus_item_removed',
};

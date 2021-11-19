import { client } from '../database/client';
import {
  CuratedItem,
  PrismaClient,
  RejectedCuratedCorpusItem,
} from '@prisma/client';
import { NewTabFeedScheduledItem } from '../database/types';
import { CuratedCorpusEventEmitter } from '../events/curatedCorpusEventEmitter';
import {
  CuratedCorpusItemEventType,
  CuratedCorpusScheduleEventType,
  ReviewedCorpusItemPayload,
  ScheduledCorpusItemPayload,
} from '../events/types';

// Context interface
export interface IContext {
  db: PrismaClient;
  eventEmitter: CuratedCorpusEventEmitter;

  emitReviewedCorpusItemEvent(
    event: CuratedCorpusItemEventType,
    reviewedCorpusItem: CuratedItem | RejectedCuratedCorpusItem
  ): void;

  emitScheduledCorpusItemEvent(
    event: CuratedCorpusScheduleEventType,
    scheduledCorpusItem: NewTabFeedScheduledItem
  ): void;
}

export class ContextManager implements IContext {
  constructor(
    private config: {
      request: any;
      db: PrismaClient;
      eventEmitter: CuratedCorpusEventEmitter;
    }
  ) {}

  get db(): IContext['db'] {
    return this.config.db;
  }

  get eventEmitter(): CuratedCorpusEventEmitter {
    return this.config.eventEmitter;
  }

  emitReviewedCorpusItemEvent(
    event: CuratedCorpusItemEventType,
    reviewedCorpusItem: CuratedItem | RejectedCuratedCorpusItem
  ): void {
    this.eventEmitter.emitEvent<ReviewedCorpusItemPayload>(event, {
      reviewedCorpusItem,
    });
  }

  emitScheduledCorpusItemEvent(
    event: CuratedCorpusScheduleEventType,
    scheduledCorpusItem: NewTabFeedScheduledItem
  ): void {
    this.eventEmitter.emitEvent<ScheduledCorpusItemPayload>(event, {
      scheduledCorpusItem,
    });
  }
}

/**
 * Context factory function. Creates a new context upon
 * every request
 * @param request server request
 * @param emitter a pre-initialized itemsEventEmitter
 * @returns ContextManager
 */
export function getContext(
  request: any,
  emitter: CuratedCorpusEventEmitter
): ContextManager {
  return new ContextManager({
    request: request,
    db: client(),
    eventEmitter: emitter,
  });
}

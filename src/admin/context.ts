import { S3 } from 'aws-sdk';
import { IncomingHttpHeaders } from 'http';
import {
  ApprovedItem,
  PrismaClient,
  RejectedCuratedCorpusItem,
} from '@prisma/client';
import { client } from '../database/client';
import { ScheduledItem } from '../database/types';
import { CuratedCorpusEventEmitter } from '../events/curatedCorpusEventEmitter';
import {
  ReviewedCorpusItemEventType,
  ScheduledCorpusItemEventType,
  ReviewedCorpusItemPayload,
  ScheduledCorpusItemPayload,
} from '../events/types';
import s3 from './aws/s3';

// Custom properties we get from Admin API for the authenticated user
export interface AdminAPIUser {
  name: string;
  groups: string[];
  username: string;
}

// Context interface
export interface IContext {
  db: PrismaClient;
  headers: IncomingHttpHeaders;
  eventEmitter: CuratedCorpusEventEmitter;
  s3: S3;
  authenticatedUser: AdminAPIUser;

  emitReviewedCorpusItemEvent(
    event: ReviewedCorpusItemEventType,
    reviewedCorpusItem: ApprovedItem | RejectedCuratedCorpusItem
  ): void;

  emitScheduledCorpusItemEvent(
    event: ScheduledCorpusItemEventType,
    scheduledCorpusItem: ScheduledItem
  ): void;
}

export class ContextManager implements IContext {
  constructor(
    private config: {
      request: any;
      db: PrismaClient;
      s3: S3;
      eventEmitter: CuratedCorpusEventEmitter;
    }
  ) {}

  get db(): IContext['db'] {
    return this.config.db;
  }

  get headers(): { [key: string]: any } {
    return this.config.request.headers;
  }

  get s3(): IContext['s3'] {
    return this.config.s3;
  }

  get authenticatedUser(): AdminAPIUser {
    const accessGroups = this.config.request.headers.groups.split(',');
    return {
      name: this.config.request.headers.name,
      username: this.config.request.headers.username,
      groups: accessGroups,
    };
  }

  get eventEmitter(): CuratedCorpusEventEmitter {
    return this.config.eventEmitter;
  }

  emitReviewedCorpusItemEvent(
    event: ReviewedCorpusItemEventType,
    reviewedCorpusItem: ApprovedItem | RejectedCuratedCorpusItem
  ): void {
    this.eventEmitter.emitEvent<ReviewedCorpusItemPayload>(event, {
      reviewedCorpusItem,
    });
  }

  emitScheduledCorpusItemEvent(
    event: ScheduledCorpusItemEventType,
    scheduledCorpusItem: ScheduledItem
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
    s3,
    eventEmitter: emitter,
  });
}

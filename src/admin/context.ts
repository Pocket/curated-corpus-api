import { S3 } from 'aws-sdk';
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

// Context interface
export interface IContext {
  db: PrismaClient;
  eventEmitter: CuratedCorpusEventEmitter;
  s3: S3;
  token?: string;

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

  get s3(): IContext['s3'] {
    return this.config.s3;
  }

  get eventEmitter(): CuratedCorpusEventEmitter {
    return this.config.eventEmitter;
  }

  get token(): IContext['token'] {
    const authHeader = this.config.request.headers.authorization ?? undefined;

    return authHeader ? getTokenFromAuthorizationHeader(authHeader) : undefined;
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

export const getTokenFromAuthorizationHeader = (
  authHeader: string
): string | undefined => {
  let token: string | undefined = undefined;

  if (authHeader) {
    // if present, header should be in the form of `Bearer tokenvalueshere`,
    // so we try to split on the first (and ostensibly only) space
    const parts = authHeader.split(' ');

    // if the token has two parts - `Bearer` and `tokenvalue`, return the
    // token value
    if (parts.length === 2) {
      token = parts[1];
    }

    // TODO: should we log something to sentry if `parts` above isn't as
    // expected? or just fail silently for security purposes?
  }

  return token;
};

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

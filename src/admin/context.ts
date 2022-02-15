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
import {
  MozillaAccessGroup,
  ScheduledSurfaceGuidToMozillaAccessGroup,
} from '../shared/types';

// Custom properties we get from Admin API for the authenticated user
export interface AdminAPIUser {
  name: string;
  groups: string[];
  username: string;
  // and extra convenience props to cut down on checking actual Mozilla access
  // groups within resolvers
  hasFullAccess: boolean;
  hasReadOnly: boolean;
  canRead: (scheduledSurfaceGuid: string) => boolean;
  canWrite: (scheduledSurfaceGuid: string) => boolean;
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
    const groups = this.config.request.headers.groups as string;
    const accessGroups = groups ? groups.split(',') : [];

    const hasFullAccess = accessGroups.includes(
      MozillaAccessGroup.SCHEDULED_SURFACE_CURATOR_FULL
    );
    const hasReadOnly = accessGroups.includes(MozillaAccessGroup.READONLY);

    const user: AdminAPIUser = {
      name: this.config.request.headers.name as string,
      username: this.config.request.headers.username as string,
      groups: accessGroups,
      hasFullAccess,
      hasReadOnly,
      // Whether the authenticated user can run queries for a given Scheduled Surface
      canRead: (scheduledSurfaceGuid: string): boolean =>
        hasReadOnly || user.canWrite(scheduledSurfaceGuid),

      // Whether the authenticated user can execute mutations for a given Scheduled Surface
      canWrite: (scheduledSurfaceGuid: string): boolean => {
        if (hasFullAccess) {
          return true;
        }

        const authGroupForScheduledSurface =
          ScheduledSurfaceGuidToMozillaAccessGroup[scheduledSurfaceGuid];

        return accessGroups.includes(authGroupForScheduledSurface);
      },
    };

    return user;
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

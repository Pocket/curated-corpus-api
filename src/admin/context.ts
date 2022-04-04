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
  ReviewedCorpusItemPayload,
  ScheduledCorpusItemEventType,
  ScheduledCorpusItemPayload,
} from '../events/types';
import s3 from './aws/s3';
import { MozillaAccessGroup } from '../shared/types';
import {
  getScheduledSurfaceByGuid,
  scheduledSurfaceAccessGroups,
} from '../shared/utils';

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
  canWriteToCorpus: () => boolean;
  canWriteToSurface: (scheduledSurfaceGuid: string) => boolean;
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
    // If anyone decides to work with/test the subgraph directly,
    // make sure we cater for undefined headers.
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
      // Whether the authenticated user can run queries for a given scheduled surface
      canRead: (scheduledSurfaceGuid: string): boolean =>
        hasReadOnly || user.canWriteToSurface(scheduledSurfaceGuid),

      // Whether the authenticated user can execute mutations for corpus entities
      canWriteToCorpus: (): boolean => {
        // Full access to everything is an automatic "Yes".
        if (hasFullAccess) {
          return true;
        }

        // As long as the user has access to a specific scheduled surface,
        // they can create/edit/delete corpus items, too.
        return (
          accessGroups.filter((element) => {
            return scheduledSurfaceAccessGroups.includes(element);
          }).length > 0
        );
      },
      // Whether the authenticated user can execute mutations for a given
      // scheduled surface
      canWriteToSurface: (scheduledSurfaceGuid: string): boolean => {
        // Full access to everything is an automatic "Yes".
        if (hasFullAccess) {
          return true;
        }

        // Access to one or more scheduled surface means the user can create
        // and modify entities tied to that scheduled surface, such as prospects
        // or scheduled corpus items.
        const authGroupForScheduledSurface =
          getScheduledSurfaceByGuid(scheduledSurfaceGuid)?.accessGroup ||
          'NOT FOUND';

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

import * as Sentry from '@sentry/node';
import { buildSelfDescribingEvent, Tracker } from '@snowplow/node-tracker';
import { CuratedCorpusEventPayload, SnowplowEventMap } from '../types';
import { PayloadBuilder, SelfDescribingJson } from '@snowplow/tracker-core';
import {
  CorpusReviewStatus,
  CuratedCorpusItemUpdate,
  ObjectVersion,
  ReviewedCorpusItem,
  ScheduledCorpusItem,
} from './schema';
import { CuratedCorpusEventEmitter } from '../curatedCorpusEventEmitter';
import config from '../../config';
import { CuratedItem } from '@prisma/client';
import { getUnixTimestamp } from '../../shared/utils';
import { getNewTabByGuid } from '../../shared/types';

type CuratedCorpusItemUpdateEvent = Omit<SelfDescribingJson, 'data'> & {
  data: CuratedCorpusItemUpdate;
};

type ReviewedCorpusItemContext = Omit<SelfDescribingJson, 'data'> & {
  data: ReviewedCorpusItem;
};

type ScheduledCorpusItemContext =
  | (Omit<SelfDescribingJson, 'data'> & {
      data: ScheduledCorpusItem;
    })
  | undefined;

export class SnowplowHandler {
  constructor(
    private emitter: CuratedCorpusEventEmitter,
    private tracker: Tracker,
    events: string[]
  ) {
    // register handler for item events
    events.forEach((event) => emitter.on(event, (data) => this.process(data)));
  }

  /**
   * @param data
   */
  async process(data: CuratedCorpusEventPayload): Promise<void> {
    const event = buildSelfDescribingEvent({
      event: SnowplowHandler.generateCuratedCorpusItemUpdateEvent(data),
    });
    const context = await SnowplowHandler.generateEventContext(data);
    await this.track(event, context);
  }

  /**
   * Track snowplow event
   * @param event
   * @param context
   * @private
   */
  private async track(
    event: PayloadBuilder,
    context: SelfDescribingJson[]
  ): Promise<void> {
    try {
      await this.tracker.track(event, context);
    } catch (ex) {
      const message = `Failed to send event to snowplow.\n event: ${event}\n context: ${context}`;
      console.log(message);
      Sentry.addBreadcrumb({ message });
      Sentry.captureException(ex);
    }
  }

  /**
   * @private
   */
  private static async generateEventContext(
    data: CuratedCorpusEventPayload
  ): Promise<SelfDescribingJson[]> {
    const reviewedItemContext =
      await SnowplowHandler.generateReviewedCorpusItemContext(data);

    const eventContext: SelfDescribingJson[] = [reviewedItemContext];

    const scheduledItemContext =
      await SnowplowHandler.generateScheduledCorpusItemContext(data);

    // Add a scheduled item if one was created or removed
    if (scheduledItemContext) {
      eventContext.push(scheduledItemContext);
    }

    return eventContext;
  }

  /**
   * @private
   */
  private static generateCuratedCorpusItemUpdateEvent(
    data: CuratedCorpusEventPayload
  ): CuratedCorpusItemUpdateEvent {
    return {
      schema: config.snowplow.schemas.objectUpdate,
      data: {
        trigger: SnowplowEventMap[data.eventType],
      },
    };
  }

  /**
   * @private
   */
  private static async generateReviewedCorpusItemContext(
    data: CuratedCorpusEventPayload
  ): Promise<ReviewedCorpusItemContext> {
    const result: CuratedCorpusEventPayload = await data;

    const item = result.reviewedCorpusItem;
    let isApprovedItem = false;

    // Resolve item status, since rejected items don't have status recorded -
    // they're all rejected, it's right in the name!
    let corpusReviewStatus: CorpusReviewStatus;
    if (item['status']) {
      corpusReviewStatus = item['status'];
      isApprovedItem = true;
    } else {
      corpusReviewStatus = CorpusReviewStatus.REJECTED;
    }

    // Set up common properties returned by both approved and rejected corpus items
    const context: ReviewedCorpusItemContext = {
      schema: config.snowplow.schemas.reviewedCorpusItem,
      data: {
        object_version: ObjectVersion.NEW,
        url: item.url,
        corpus_review_status: corpusReviewStatus,
        // TODO: this is not correct. Need to return rejected_corpus_item_external_id prop
        // if reviewed item was rejected
        // Also, rejected items need reasons for rejection returned
        approved_corpus_item_external_id: item.externalId,
        title: item.title,
        language: item.language,
        topic: item.topic,
        created_at: getUnixTimestamp(item.createdAt),
        created_by: item.createdBy,
      },
    };

    // Additionally, send in everything we have for approved curated items
    if (isApprovedItem) {
      const approvedItem = result.reviewedCorpusItem as CuratedItem;
      context.data = {
        ...context.data,
        excerpt: approvedItem.excerpt,
        image_url: approvedItem.imageUrl,
        is_collection: approvedItem.isCollection,
        is_syndicated: approvedItem.isSyndicated,
        is_short_lived: approvedItem.isShortLived,

        updated_at: getUnixTimestamp(approvedItem.updatedAt),
        updated_by: approvedItem.updatedBy ?? undefined,
      };
    }

    return context;
  }

  /**
   * @private
   */
  private static async generateScheduledCorpusItemContext(
    data: CuratedCorpusEventPayload
  ): Promise<ScheduledCorpusItemContext> {
    const result: CuratedCorpusEventPayload = await data;

    const item = result.scheduledCorpusItem;

    // If no scheduled item is created, don't send anything to Snowplow.
    if (!item) return;

    // Set up data to be returned
    const context: ScheduledCorpusItemContext = {
      schema: config.snowplow.schemas.scheduledCorpusItem,
      data: {
        object_version: ObjectVersion.NEW,
        scheduled_corpus_item_external_id: item.externalId,
        scheduled_at: getUnixTimestamp(item.scheduledDate),
        url: item.curatedItem.url,
        approved_corpus_item_external_id: item.curatedItem.externalId,
        new_tab_id: item.newTabGuid,
        created_at: getUnixTimestamp(item.createdAt),
        created_by: item.createdBy,
        updated_at: getUnixTimestamp(item.updatedAt),
        updated_by: item.updatedBy ?? undefined,
      },
    };

    // Get the NewTab info
    const newTab = getNewTabByGuid(item.newTabGuid);

    if (newTab) {
      context.data = {
        ...context.data,
        new_tab_name: newTab.name,
        new_tab_feed_utc_offset: newTab.utcOffset.toString(),
      };
    }

    return context;
  }
}

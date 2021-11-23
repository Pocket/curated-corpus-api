import { CuratedCorpusSnowplowHandler } from './snowplowHandler';
import { BaseEventData, ReviewedCorpusItemPayload } from '../types';
import { buildSelfDescribingEvent } from '@snowplow/node-tracker';
import { SelfDescribingJson } from '@snowplow/tracker-core';
import config from '../../config';
import { ReviewedItemSnowplowEventMap } from './types';
import {
  CorpusReviewStatus,
  CuratedCorpusItemUpdate,
  ObjectVersion,
  ReviewedCorpusItem,
} from './schema';
import { getUnixTimestamp } from '../../shared/utils';
import { ApprovedItem, RejectedCuratedCorpusItem } from '@prisma/client';

type CuratedCorpusItemUpdateEvent = Omit<SelfDescribingJson, 'data'> & {
  data: CuratedCorpusItemUpdate;
};

type ReviewedCorpusItemContext = Omit<SelfDescribingJson, 'data'> & {
  data: ReviewedCorpusItem;
};

export class ReviewedItemSnowplowHandler extends CuratedCorpusSnowplowHandler {
  /**
   * @param data
   */
  async process(
    data: ReviewedCorpusItemPayload & BaseEventData
  ): Promise<void> {
    const event = buildSelfDescribingEvent({
      event: ReviewedItemSnowplowHandler.generateItemUpdateEvent(data),
    });
    const context = await ReviewedItemSnowplowHandler.generateEventContext(
      data
    );
    await super.track(event, context);
  }

  /**
   * @private
   */
  private static async generateEventContext(
    data: ReviewedCorpusItemPayload
  ): Promise<SelfDescribingJson[]> {
    return [await ReviewedItemSnowplowHandler.generateItemContext(data)];
  }

  private static generateItemUpdateEvent(
    data: ReviewedCorpusItemPayload & BaseEventData
  ): CuratedCorpusItemUpdateEvent {
    return {
      schema: config.snowplow.schemas.objectUpdate,
      data: {
        trigger: ReviewedItemSnowplowEventMap[data.eventType],
      },
    };
  }

  /**
   * @private
   */
  private static async generateItemContext(
    data: ReviewedCorpusItemPayload
  ): Promise<ReviewedCorpusItemContext> {
    const result: ReviewedCorpusItemPayload = await data;
    const item = result.reviewedCorpusItem;

    // Resolve item status, since rejected items don't have status recorded -
    // they're all rejected, it's right in the name!
    // Also, figure out if item is approved or rejected.
    let isApprovedItem = false;
    let corpusReviewStatus: CorpusReviewStatus;

    if (item['status']) {
      corpusReviewStatus = item['status'];
      isApprovedItem = true;
    } else {
      corpusReviewStatus = CorpusReviewStatus.REJECTED;
    }

    // Set up common properties returned by both approved and rejected corpus items
    let context: ReviewedCorpusItemContext = {
      schema: config.snowplow.schemas.reviewedCorpusItem,
      data: {
        object_version: ObjectVersion.NEW,
        url: item.url,
        corpus_review_status: corpusReviewStatus,
        title: item.title,
        language: item.language,
        topic: item.topic,
        created_at: getUnixTimestamp(item.createdAt),
        created_by: item.createdBy,
      },
    };

    // Additionally, send in everything we have for approved curated items
    if (isApprovedItem) {
      context = ReviewedItemSnowplowHandler.generateApprovedItemContext(
        item as ApprovedItem,
        context
      );
    } else {
      context = ReviewedItemSnowplowHandler.generateRejectedItemContext(
        item as RejectedCuratedCorpusItem,
        context
      );
    }

    return context;
  }

  private static generateApprovedItemContext(
    item: ApprovedItem,
    context: ReviewedCorpusItemContext
  ): ReviewedCorpusItemContext {
    context.data = {
      ...context.data,
      excerpt: item.excerpt,
      image_url: item.imageUrl,
      is_collection: item.isCollection,
      is_syndicated: item.isSyndicated,
      is_short_lived: item.isShortLived,
      approved_corpus_item_external_id: item.externalId,
      updated_at: getUnixTimestamp(item.updatedAt),
      updated_by: item.updatedBy ?? undefined,
    };

    return context;
  }

  private static generateRejectedItemContext(
    item: RejectedCuratedCorpusItem,
    context: ReviewedCorpusItemContext
  ): ReviewedCorpusItemContext {
    context.data = {
      ...context.data,
      rejected_corpus_item_external_id: item.externalId,
      rejection_reasons: item.reason.split(',').map((reason) => {
        return { reason };
      }),
    };

    return context;
  }
}

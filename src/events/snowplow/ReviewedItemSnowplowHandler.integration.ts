import { expect } from 'chai';
import { CuratedStatus, RejectedCuratedCorpusItem } from '@prisma/client';
import {
  assertValidSnowplowObjectUpdateEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
  resetSnowplowEvents,
} from '../../test/helpers/snowplow';
import config from '../../config';
import {
  ReviewedCorpusItemEventType,
  ReviewedCorpusItemPayload,
} from '../types';
import { CorpusReviewStatus, ObjectVersion } from './schema';
import { ReviewedItemSnowplowHandler } from './ReviewedItemSnowplowHandler';
import { tracker } from './tracker';
import { CuratedCorpusEventEmitter } from '../curatedCorpusEventEmitter';
import { getUnixTimestamp } from '../../shared/utils';
import { CorpusItemSource, Topics } from '../../shared/types';
import { ApprovedItem, ApprovedItemAuthor } from '../../database/types';

/**
 * Use a simple mock item instead of using DB helpers
 * so that these tests can be run in the IDE
 */
const approvedItem: ApprovedItem = {
  id: 123,
  externalId: '123-abc',
  prospectId: '456-dfg',
  url: 'https://test.com/a-story',
  status: CuratedStatus.RECOMMENDATION,
  title: 'Everything you need to know about React',
  excerpt: 'Something here',
  authors: [
    { name: 'Jane Austen', sortOrder: 1 },
    { name: 'Mary Shelley', sortOrder: 2 },
  ],
  publisher: 'Octopus Publishing House',
  imageUrl: 'https://test.com/image.png',
  language: 'EN',
  topic: Topics.EDUCATION,
  source: CorpusItemSource.PROSPECT,
  isCollection: false,
  isSyndicated: false,
  isTimeSensitive: false,
  createdAt: new Date(),
  createdBy: 'Amy',
  updatedAt: new Date(),
  updatedBy: 'Amy',
};

const rejectedItem: RejectedCuratedCorpusItem = {
  id: 123,
  externalId: '123-abc',
  prospectId: '456-dfg',
  url: 'https://test.com/a-story',
  title: 'Everything you need to know about React',
  publisher: 'Octopus Publishing House',
  language: 'EN',
  topic: Topics.EDUCATION,
  reason: 'PAYWALL,OTHER',
  createdAt: new Date(),
  createdBy: 'Amy',
};

const approvedEventData: ReviewedCorpusItemPayload = {
  reviewedCorpusItem: approvedItem,
};

const rejectedEventData: ReviewedCorpusItemPayload = {
  reviewedCorpusItem: rejectedItem,
};

function assertValidSnowplowReviewedItemEvents(data) {
  const eventContext = parseSnowplowData(data);

  if (eventContext.data[0].data.approved_corpus_item_external_id) {
    assertValidSnowplowApprovedItemEvents(eventContext);
  } else {
    assertValidSnowplowRejectedItemEvents(eventContext);
  }
}

function assertValidSnowplowApprovedItemEvents(eventContext) {
  expect(eventContext.data).to.include.deep.members([
    {
      schema: config.snowplow.schemas.reviewedCorpusItem,
      data: {
        object_version: ObjectVersion.NEW,
        approved_corpus_item_external_id: approvedItem.externalId,
        prospect_id: approvedItem.prospectId,
        corpus_review_status: CorpusReviewStatus.RECOMMENDATION,
        url: approvedItem.url,
        title: approvedItem.title,
        excerpt: approvedItem.excerpt,
        publisher: approvedItem.publisher,
        authors:
          approvedItem.authors?.map(
            (author: ApprovedItemAuthor) => author.name
          ) ?? [],
        image_url: approvedItem.imageUrl,
        language: approvedItem.language,
        topic: approvedItem.topic,
        is_collection: approvedItem.isCollection,
        is_time_sensitive: approvedItem.isTimeSensitive,
        is_syndicated: approvedItem.isSyndicated,
        created_at: getUnixTimestamp(approvedItem.createdAt),
        created_by: approvedItem.createdBy,
        updated_at: getUnixTimestamp(approvedItem.updatedAt),
        updated_by: approvedItem.updatedBy,
        loaded_from: CorpusItemSource.PROSPECT,
      },
    },
  ]);
}

function assertValidSnowplowRejectedItemEvents(eventContext) {
  expect(eventContext.data).to.include.deep.members([
    {
      schema: config.snowplow.schemas.reviewedCorpusItem,
      data: {
        object_version: ObjectVersion.NEW,
        rejected_corpus_item_external_id: rejectedItem.externalId,
        prospect_id: rejectedItem.prospectId,
        corpus_review_status: CorpusReviewStatus.REJECTED,
        url: rejectedItem.url,
        title: rejectedItem.title,
        language: rejectedItem.language,
        topic: rejectedItem.topic,
        rejection_reasons: ['PAYWALL', 'OTHER'],
        created_at: getUnixTimestamp(rejectedItem.createdAt),
        created_by: rejectedItem.createdBy,
      },
    },
  ]);
}

describe('ReviewedItemSnowplowHandler', () => {
  beforeEach(async () => {
    await resetSnowplowEvents();
  });

  it('should send good events to Snowplow', async () => {
    const emitter = new CuratedCorpusEventEmitter();
    new ReviewedItemSnowplowHandler(emitter, tracker, [
      ReviewedCorpusItemEventType.ADD_ITEM,
      ReviewedCorpusItemEventType.UPDATE_ITEM,
      ReviewedCorpusItemEventType.REMOVE_ITEM,
      ReviewedCorpusItemEventType.REJECT_ITEM,
    ]);
    // Emit all the events that are relevant for approved curated items
    emitter.emit(ReviewedCorpusItemEventType.ADD_ITEM, {
      ...approvedEventData,
      eventType: ReviewedCorpusItemEventType.ADD_ITEM,
    });
    emitter.emit(ReviewedCorpusItemEventType.UPDATE_ITEM, {
      ...approvedEventData,
      eventType: ReviewedCorpusItemEventType.UPDATE_ITEM,
    });
    emitter.emit(ReviewedCorpusItemEventType.REMOVE_ITEM, {
      ...approvedEventData,
      eventType: ReviewedCorpusItemEventType.REMOVE_ITEM,
    });
    // Emit the rejected item event
    emitter.emit(ReviewedCorpusItemEventType.REJECT_ITEM, {
      ...rejectedEventData,
      eventType: ReviewedCorpusItemEventType.REJECT_ITEM,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).to.equal(4);
    expect(allEvents.good).to.equal(4);
    expect(allEvents.bad).to.equal(0);

    const goodEvents = await getGoodSnowplowEvents();

    goodEvents.forEach((event) => {
      assertValidSnowplowReviewedItemEvents(event.rawEvent.parameters.cx);
    });

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      [
        'reviewed_corpus_item_added',
        'reviewed_corpus_item_updated',
        'reviewed_corpus_item_removed',
        'reviewed_corpus_item_rejected',
      ],
      'reviewed_corpus_item'
    );
  });
});

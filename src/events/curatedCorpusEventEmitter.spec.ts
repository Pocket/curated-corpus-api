import { CuratedCorpusEventEmitter } from './curatedCorpusEventEmitter';
import {
  ReviewedCorpusItemPayload,
  ScheduledCorpusItemPayload,
  ReviewedCorpusItemEventType,
  ScheduledCorpusItemEventType,
} from './types';
import config from '../config';
import sinon from 'sinon';
import { getUnixTimestamp } from '../shared/utils';
import {
  ApprovedItem,
  CuratedStatus,
  RejectedCuratedCorpusItem,
} from '@prisma/client';
import { Topics } from '../shared/types';
import { ScheduledItem } from '../database/types';

describe('CuratedCorpusEventEmitter', () => {
  const emitter = new CuratedCorpusEventEmitter();
  const date = new Date(2022, 9, 4, 15, 30);
  const unixDate = getUnixTimestamp(date);
  let clock;
  const handler = sinon.mock();

  Object.values(ReviewedCorpusItemEventType).forEach((event: string) =>
    emitter.on(event, handler)
  );

  Object.values(ScheduledCorpusItemEventType).forEach((event: string) =>
    emitter.on(event, handler)
  );

  const approvedItem: ApprovedItem = {
    externalId: '123-abc',
    prospectId: 'abc-123',
    url: 'https://test.com',
    status: CuratedStatus.CORPUS,
    id: 123,
    title: 'Test title',
    excerpt: 'An excerpt',
    language: 'en',
    publisher: 'The Times of Narnia',
    imageUrl: 'https://test.com/image.png',
    topic: Topics.EDUCATION,
    isCollection: false,
    isShortLived: false,
    isSyndicated: false,
    createdAt: new Date(),
    createdBy: 'Anyone',
    updatedAt: new Date(),
    updatedBy: null,
  };

  const approvedItemPayload: ReviewedCorpusItemPayload = {
    reviewedCorpusItem: approvedItem,
  };

  // Set up separately to the main payload - only for scheduling events
  // when we need to send this data
  const scheduledItemPayload: ScheduledCorpusItemPayload = {
    scheduledCorpusItem: {
      id: 1234,
      externalId: '1234-abc',
      approvedItemId: 123,
      newTabGuid: 'EN-US',
      createdAt: new Date(),
      createdBy: '',
      updatedAt: new Date(),
      updatedBy: null,
      scheduledDate: new Date(),
      approvedItem: approvedItem,
    },
  };

  afterAll(() => {
    clock.restore();
  });

  beforeAll(() => {
    // Mock Date.now() to get a consistent date for inserting data
    clock = sinon.useFakeTimers({
      now: date,
      shouldAdvanceTime: false,
    });
  });

  afterEach(() => {
    handler.resetHistory();
  });

  it('should emit an ADD_ITEM event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitEvent(
      ReviewedCorpusItemEventType.ADD_ITEM,
      approvedItemPayload
    );
    const expectedData = {
      ...approvedItemPayload,
      eventType: ReviewedCorpusItemEventType.ADD_ITEM,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit an UPDATE_ITEM event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitEvent(
      ReviewedCorpusItemEventType.UPDATE_ITEM,
      approvedItemPayload
    );
    const expectedData = {
      ...approvedItemPayload,
      eventType: ReviewedCorpusItemEventType.UPDATE_ITEM,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit a REMOVE_ITEM event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitEvent(
      ReviewedCorpusItemEventType.REMOVE_ITEM,
      approvedItemPayload
    );
    const expectedData = {
      ...approvedItemPayload,
      eventType: ReviewedCorpusItemEventType.REMOVE_ITEM,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit a REJECT_ITEM event with expected data', () => {
    // This event returns the data stored in RejectedItem entity internally
    const rejectedItem: RejectedCuratedCorpusItem = {
      id: 123,
      externalId: '345-abc',
      prospectId: 'abc-543',
      url: 'https://test.com',
      title: 'Rejected item title',
      topic: Topics.POLITICS,
      language: 'en',
      publisher: 'Any Publisher',
      reason: 'ERROR',
      createdAt: new Date(),
      createdBy: 'Anyone',
    };

    const rejectedPayload: ReviewedCorpusItemPayload = {
      reviewedCorpusItem: rejectedItem,
    };

    emitter.emitEvent(ReviewedCorpusItemEventType.REJECT_ITEM, rejectedPayload);
    const expectedData = {
      ...rejectedPayload,
      eventType: ReviewedCorpusItemEventType.REJECT_ITEM,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit an ADD_SCHEDULE event with expected data', () => {
    emitter.emitEvent(
      ScheduledCorpusItemEventType.ADD_SCHEDULE,
      scheduledItemPayload
    );
    const expectedData = {
      ...scheduledItemPayload,
      eventType: ScheduledCorpusItemEventType.ADD_SCHEDULE,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit a REMOVE_SCHEDULE event with expected data', () => {
    emitter.emitEvent(
      ScheduledCorpusItemEventType.REMOVE_SCHEDULE,
      scheduledItemPayload
    );
    const expectedData = {
      ...scheduledItemPayload,
      eventType: ScheduledCorpusItemEventType.REMOVE_SCHEDULE,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });
});

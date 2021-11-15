import { CuratedCorpusEventEmitter } from './curatedCorpusEventEmitter';
import { BasicCuratedCorpusEventPayload, EventType } from './types';
import config from '../config';
import sinon from 'sinon';
import { getUnixTimestamp } from '../shared/utils';
import {
  CuratedItem,
  CuratedStatus,
  RejectedCuratedCorpusItem,
} from '@prisma/client';
import { Topics } from '../shared/types';
import { NewTabFeedScheduledItem } from '../database/types';

describe('CuratedCorpusEventEmitter', () => {
  const emitter = new CuratedCorpusEventEmitter();
  const date = new Date(2022, 9, 4, 15, 30);
  const unixDate = getUnixTimestamp(date);
  let clock;
  const handler = sinon.mock();
  Object.values(EventType).forEach((event: string) =>
    emitter.on(event, handler)
  );

  const approvedItem: CuratedItem = {
    externalId: '123-abc',
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

  const approvedItemPayload: BasicCuratedCorpusEventPayload = {
    reviewedCorpusItem: approvedItem,
  };

  // Set up separately to the main payload - only for scheduling events
  // when we need to send this data
  const scheduledItem: NewTabFeedScheduledItem = {
    id: 1234,
    externalId: '1234-abc',
    curatedItemId: 123,
    newTabGuid: 'EN-US',
    createdAt: new Date(),
    createdBy: '',
    updatedAt: new Date(),
    updatedBy: null,
    scheduledDate: new Date(),
    curatedItem: approvedItem,
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
    emitter.emitUserEvent(EventType.ADD_ITEM, approvedItemPayload);
    const expectedData = {
      ...approvedItemPayload,
      eventType: EventType.ADD_ITEM,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit an UPDATE_ITEM event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitUserEvent(EventType.UPDATE_ITEM, approvedItemPayload);
    const expectedData = {
      ...approvedItemPayload,
      eventType: EventType.UPDATE_ITEM,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit a REMOVE_ITEM event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitUserEvent(EventType.REMOVE_ITEM, approvedItemPayload);
    const expectedData = {
      ...approvedItemPayload,
      eventType: EventType.REMOVE_ITEM,
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
      url: 'https://test.com',
      title: 'Rejected item title',
      topic: Topics.POLITICS,
      language: 'en',
      publisher: 'Any Publisher',
      reason: 'ERROR',
      createdAt: new Date(),
      createdBy: 'Anyone',
    };

    const rejectedPayload: BasicCuratedCorpusEventPayload = {
      reviewedCorpusItem: rejectedItem,
    };

    emitter.emitUserEvent(EventType.REJECT_ITEM, rejectedPayload);
    const expectedData = {
      ...rejectedPayload,
      eventType: EventType.REJECT_ITEM,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit an ADD_SCHEDULE event with expected data', () => {
    // This event returns both the curated item and a scheduled entry
    approvedItemPayload.scheduledCorpusItem = scheduledItem;

    emitter.emitUserEvent(EventType.ADD_SCHEDULE, approvedItemPayload);
    const expectedData = {
      ...approvedItemPayload,
      eventType: EventType.ADD_SCHEDULE,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit a REMOVE_SCHEDULE event with expected data', () => {
    // This event returns both the curated item and a scheduled entry
    approvedItemPayload.scheduledCorpusItem = scheduledItem;

    emitter.emitUserEvent(EventType.REMOVE_SCHEDULE, approvedItemPayload);
    const expectedData = {
      ...approvedItemPayload,
      eventType: EventType.REMOVE_SCHEDULE,
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });
});

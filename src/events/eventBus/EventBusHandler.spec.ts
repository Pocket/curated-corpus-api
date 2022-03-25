import { CuratedStatus } from '@prisma/client';
import { EventBusHandler } from './EventBusHandler';
import { CuratedCorpusEventEmitter } from '../curatedCorpusEventEmitter';
import { CorpusItemSource, Topics } from '../../shared/types';
import { ScheduledItem } from '../../database/types';
import sinon from 'sinon';
import * as Sentry from '@sentry/node';
import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsCommandInput,
} from '@aws-sdk/client-eventbridge';
import {
  ScheduledCorpusItemEventType,
  ScheduledCorpusItemPayload,
  ScheduledItemEventBusPayload,
} from '../types';
import config from '../../config';
import { setTimeout } from 'timers/promises';

/**
 * Mock event payload
 */
const scheduledCorpusItem: ScheduledItem = {
  id: 789,
  externalId: '789-xyz',
  approvedItemId: 123,
  scheduledSurfaceGuid: 'NEW_TAB_EN_US',
  scheduledDate: new Date('2030-01-01'),
  createdAt: new Date(1648225373000),
  createdBy: 'Amy',
  updatedAt: new Date(1648225373000),
  updatedBy: 'Amy',

  approvedItem: {
    id: 123,
    externalId: '123-abc',
    prospectId: '456-dfg',
    url: 'https://test.com/a-story',
    status: CuratedStatus.RECOMMENDATION,
    title: 'Everything you need to know about React',
    excerpt: 'Something here',
    publisher: 'Octopus Publishing House',
    imageUrl: 'https://test.com/image.png',
    language: 'EN',
    topic: Topics.EDUCATION,
    source: CorpusItemSource.PROSPECT,
    isCollection: false,
    isSyndicated: false,
    isTimeSensitive: false,
    createdAt: new Date(1648225373000),
    createdBy: 'Amy',
    updatedAt: new Date(164822537300),
    updatedBy: 'Amy',
  },
};

describe('EventBusHandler', () => {
  const sandbox = sinon.createSandbox();
  const clientStub = sandbox
    .stub(EventBridgeClient.prototype, 'send')
    .resolves({ FailedEntryCount: 0 });
  const sentryStub = sandbox.stub(Sentry, 'captureException').resolves();
  const consoleSpy = sandbox.spy(console, 'log');
  const emitter = new CuratedCorpusEventEmitter();
  new EventBusHandler(emitter);
  const scheduledEventData: ScheduledCorpusItemPayload = {
    scheduledCorpusItem,
  };

  afterEach(() => sandbox.resetHistory());
  afterAll(() => sandbox.restore());
  it('scheduled-item-add: should send event to event bus with proper event data', async () => {
    const expectedEvent: ScheduledItemEventBusPayload = {
      scheduledItemId: '789-xyz',
      approvedItemId: '123-abc',
      url: 'https://test.com/a-story',
      title: 'Everything you need to know about React',
      excerpt: 'Something here',
      publisher: 'Octopus Publishing House',
      imageUrl: 'https://test.com/image.png',
      language: 'EN',
      topic: 'EDUCATION',
      isSyndicated: false,
      createdAt: new Date(1648225373000).toUTCString(),
      createdBy: 'Amy',
      updatedAt: new Date(1648225373000).toUTCString(),
      scheduledSurfaceGuid: 'NEW_TAB_EN_US',
      scheduledDate: '2030-01-01',
      eventType: config.eventBridge.addScheduledItemEventType,
    };
    emitter.emit(ScheduledCorpusItemEventType.ADD_SCHEDULE, {
      ...scheduledEventData,
      eventType: ScheduledCorpusItemEventType.ADD_SCHEDULE,
    });
    await setTimeout(500);
    expect(sentryStub.callCount).toBe(0);
    expect(consoleSpy.callCount).toBe(0);
    // Listener was registered on event
    expect(
      emitter.listeners(ScheduledCorpusItemEventType.ADD_SCHEDULE).length
    ).toBe(1);
    // Event was sent to Event Bus
    expect(clientStub.callCount).toBe(1);
    // Check that the payload is correct; since it's JSON, we need to decode the data
    // otherwise it also does ordering check
    const sendCommand = clientStub.getCall(0).args[0].input as any;
    expect(sendCommand).toHaveProperty('Entries');
    expect(sendCommand.Entries[0]).toMatchObject({
      Source: config.eventBridge.addScheduledItemEventType,
      EventBusName: config.aws.eventBus.name,
    });
    expect(JSON.parse(sendCommand.Entries[0]['Detail'])).toEqual(expectedEvent);
  });

  it('should log error if any events fail to send', async () => {
    clientStub.restore();
    sandbox
      .stub(EventBridgeClient.prototype, 'send')
      .resolves({ FailedEntryCount: 1 });
    emitter.emit(ScheduledCorpusItemEventType.ADD_SCHEDULE, {
      ...scheduledEventData,
      eventType: ScheduledCorpusItemEventType.ADD_SCHEDULE,
    });
    await setTimeout(500);
    expect(sentryStub.callCount).toBe(1);
    expect(sentryStub.getCall(0).firstArg.message).toContain(
      `Failed to send event 'add-scheduled-item' to event bus`
    );
    expect(consoleSpy.callCount).toBe(1);
    expect(consoleSpy.getCall(0).firstArg.message).toContain(
      `Failed to send event 'add-scheduled-item' to event bus`
    );
  });
});

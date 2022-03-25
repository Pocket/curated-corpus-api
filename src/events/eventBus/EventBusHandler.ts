import {
  ScheduledCorpusItemEventType,
  ScheduledCorpusItemPayload,
  ScheduledItemEventBusPayload,
} from '../types';
import { CuratedCorpusEventEmitter } from '../curatedCorpusEventEmitter';
import config from '../../config';
import { toUtcDateString } from '../../shared/utils';
import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsCommandOutput,
} from '@aws-sdk/client-eventbridge';
import * as Sentry from '@sentry/node';

export class EventBusHandler {
  // Update this whenever new listener methods are added
  static handledEvents = [ScheduledCorpusItemEventType.ADD_SCHEDULE];

  // Mapping of internal application events to listeners in this class
  private eventHandlerCallbackMap;

  private client: EventBridgeClient;

  constructor(protected emitter: CuratedCorpusEventEmitter) {
    this.client = new EventBridgeClient({
      region: config.aws.region,
    });
    this.eventHandlerCallbackMap = {
      [ScheduledCorpusItemEventType.ADD_SCHEDULE]: (data) =>
        this.scheduledItemEvent(data),
    };
    // register handler for item events
    EventBusHandler.handledEvents.forEach((event) => {
      emitter.on(event, (data) => this.eventHandlerCallbackMap[event](data));
    });
  }

  /**
   * Send event to event bus when an approved item is scheduled to go on New Tab
   * @param data ScheduledCorpusItemPayload
   */
  async scheduledItemEvent(data: ScheduledCorpusItemPayload) {
    const eventType = config.eventBridge.addScheduledItemEventType;
    const eventBusPayload: ScheduledItemEventBusPayload = {
      scheduledItemId: data.scheduledCorpusItem.externalId,
      approvedItemId: data.scheduledCorpusItem.approvedItem.externalId,
      url: data.scheduledCorpusItem.approvedItem.url,
      title: data.scheduledCorpusItem.approvedItem.title,
      excerpt: data.scheduledCorpusItem.approvedItem.excerpt,
      eventType,
      language: data.scheduledCorpusItem.approvedItem.language,
      publisher: data.scheduledCorpusItem.approvedItem.publisher,
      imageUrl: data.scheduledCorpusItem.approvedItem.imageUrl,
      topic: data.scheduledCorpusItem.approvedItem.topic,
      isSyndicated: data.scheduledCorpusItem.approvedItem.isSyndicated,
      createdAt: data.scheduledCorpusItem.createdAt.toUTCString(),
      createdBy: data.scheduledCorpusItem.createdBy,
      updatedAt: data.scheduledCorpusItem.updatedAt.toUTCString(),
      scheduledSurfaceGuid: data.scheduledCorpusItem.scheduledSurfaceGuid,
      scheduledDate: toUtcDateString(data.scheduledCorpusItem.scheduledDate),
    };
    await this.sendEvent(eventBusPayload, eventType);
  }

  /**
   * Send event to Event Bus
   * @param eventPayload the payload to send to event bus
   * @param eventType the type of event sent
   */
  async sendEvent(eventPayload: any, eventType: string) {
    const putEventCommand = new PutEventsCommand({
      Entries: [
        {
          EventBusName: config.aws.eventBus.name,
          Detail: JSON.stringify(eventPayload),
          Source: eventType, // TODO: is the right?
        },
      ],
    });
    const output: PutEventsCommandOutput = await this.client.send(
      putEventCommand
    );
    if (output.FailedEntryCount) {
      const failedEventError = new Error(
        `Failed to send event '${eventType}' to event bus. Event Body:\n ${JSON.stringify(
          eventPayload
        )}`
      );
      // Don't halt program, but capture the failure in Sentry and Cloudwatch
      Sentry.captureException(failedEventError);
      console.log(failedEventError);
    }
  }
}

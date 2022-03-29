import {
  ScheduledCorpusItemEventType,
  ScheduledCorpusItemPayload,
  ScheduledItemEventBusPayload,
} from '../types';
import { EventHandlerCallbackMap } from './types';
import config from '../../config';
import { toUtcDateString } from '../../shared/utils';

// Mapping of event name to payload builder function.
// Used to configure the default EventBusHandler class,
// if a mapping is not passed to the constructor.
export const eventBusConfig: EventHandlerCallbackMap = {
  [ScheduledCorpusItemEventType.ADD_SCHEDULE]: (data: any) => {
    return payloadBuilders.scheduledItemEvent(
      config.eventBridge.addScheduledItemEventType,
      data
    );
  },
  [ScheduledCorpusItemEventType.REMOVE_SCHEDULE]: (data: any) => {
    return payloadBuilders.scheduledItemEvent(
      config.eventBridge.removeScheduledItemEventType,
      data
    );
  },
};

// To add a new event handler, create a function that generates the
// payload to send to the event bus, and add it to eventBusConfig map
// (set the key to the event name it should listen to)
const payloadBuilders = {
  /**
   * Generate event payload to send to event bus when an approved item
   * is scheduled to go on New Tab
   * @param eventType
   * @param data ScheduledCorpusItemPayload
   * @returns ScheduledItemEventBusPayload
   */
  scheduledItemEvent(
    eventType: string,
    data: ScheduledCorpusItemPayload
  ): ScheduledItemEventBusPayload {
    return {
      eventType: eventType,
      scheduledItemId: data.scheduledCorpusItem.externalId,
      approvedItemId: data.scheduledCorpusItem.approvedItem.externalId,
      url: data.scheduledCorpusItem.approvedItem.url,
      title: data.scheduledCorpusItem.approvedItem.title,
      excerpt: data.scheduledCorpusItem.approvedItem.excerpt,
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
  },
};

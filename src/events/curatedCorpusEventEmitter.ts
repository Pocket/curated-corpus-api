import EventEmitter from 'events';
import config from '../config';
import {
  BasicCuratedCorpusEventPayload,
  EventType,
  CuratedCorpusEventPayload,
} from './types';
import { getUnixTimestamp } from '../shared/utils';

export class CuratedCorpusEventEmitter extends EventEmitter {
  private static buildEvent(
    eventData: BasicCuratedCorpusEventPayload,
    eventType: EventType
  ): CuratedCorpusEventPayload {
    return {
      ...eventData,
      eventType: eventType,
      source: config.events.source,
      version: config.events.version,
      timestamp: getUnixTimestamp(new Date()),
    };
  }

  emitUserEvent(event: EventType, data: BasicCuratedCorpusEventPayload): void {
    this.emit(event, CuratedCorpusEventEmitter.buildEvent(data, event));
  }
}

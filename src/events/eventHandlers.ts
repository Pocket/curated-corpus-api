import { CuratedCorpusEventEmitter } from './curatedCorpusEventEmitter';
import { CuratedCorpusSnowplowHandler } from './snowplow/snowplowHandler';
import { tracker } from './snowplow/tracker';
import config from '../config';

export type CuratedCorpusEventHandlerFn = (
  emitter: CuratedCorpusEventEmitter
) => void;

/**
 * @param emitter
 */
export function corpusItemSnowplowEventHandler(
  emitter: CuratedCorpusEventEmitter
): void {
  const snowplowEventsToListen = Object.values(
    config.snowplow.corpusItemEvents
  ) as string[];
  new CuratedCorpusSnowplowHandler(emitter, tracker, snowplowEventsToListen);
}

/**
 * @param emitter
 */
export function corpusScheduleSnowplowEventHandler(
  emitter: CuratedCorpusEventEmitter
): void {
  // const snowplowEventsToListen = Object.values(
  //   config.snowplow.corpusScheduleEvents
  // ) as string[];
  // new CuratedCorpusSnowplowHandler(emitter, tracker, snowplowEventsToListen);
}

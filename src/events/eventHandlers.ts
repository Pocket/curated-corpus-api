import { CuratedCorpusEventEmitter } from './curatedCorpusEventEmitter';
import { SnowplowHandler } from './snowplow/snowplowHandler';
import { tracker } from './snowplow/tracker';
import config from '../config';

export type CuratedCorpusEventHandlerFn = (
  emitter: CuratedCorpusEventEmitter
) => void;

/**
 * @param emitter
 */
export function snowplowEventHandler(emitter: CuratedCorpusEventEmitter): void {
  const snowplowEventsToListen = Object.values(
    config.snowplow.events
  ) as string[];
  new SnowplowHandler(emitter, tracker, snowplowEventsToListen);
}

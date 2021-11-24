import { CuratedCorpusSnowplowHandler } from './CuratedCorpusSnowplowHandler';
import { BaseEventData, ScheduledCorpusItemPayload } from '../types';
import { buildSelfDescribingEvent, Tracker } from '@snowplow/node-tracker';
import { SelfDescribingJson } from '@snowplow/tracker-core';
import config from '../../config';
import { ScheduledItemSnowplowEventMap } from './types';
import {
  CuratedCorpusItemUpdate,
  ObjectVersion,
  ScheduledCorpusItem,
} from './schema';
import { getUnixTimestamp } from '../../shared/utils';
import { getNewTabByGuid } from '../../shared/types';
import { CuratedCorpusEventEmitter } from '../curatedCorpusEventEmitter';

type CuratedCorpusItemUpdateEvent = Omit<SelfDescribingJson, 'data'> & {
  data: CuratedCorpusItemUpdate;
};

type ScheduledCorpusItemContext = Omit<SelfDescribingJson, 'data'> & {
  data: ScheduledCorpusItem;
};

export class ScheduledItemSnowplowHandler extends CuratedCorpusSnowplowHandler {
  constructor(
    protected emitter: CuratedCorpusEventEmitter,
    protected tracker: Tracker,
    events: string[]
  ) {
    super(emitter, tracker, events);
  }

  /**
   * @param data
   */
  async process(
    data: ScheduledCorpusItemPayload & BaseEventData
  ): Promise<void> {
    const event = buildSelfDescribingEvent({
      event: ScheduledItemSnowplowHandler.generateItemUpdateEvent(data),
    });
    const context = await ScheduledItemSnowplowHandler.generateEventContext(
      data
    );
    await super.track(event, context);
  }

  /**
   * @private
   */
  private static async generateEventContext(
    data: ScheduledCorpusItemPayload
  ): Promise<SelfDescribingJson[]> {
    return [await ScheduledItemSnowplowHandler.generateItemContext(data)];
  }

  private static generateItemUpdateEvent(
    data: ScheduledCorpusItemPayload & BaseEventData
  ): CuratedCorpusItemUpdateEvent {
    return {
      schema: config.snowplow.schemas.objectUpdate,
      data: {
        trigger: ScheduledItemSnowplowEventMap[data.eventType],
        object: 'scheduled_corpus_item',
      },
    };
  }

  /**
   * @private
   */
  private static async generateItemContext(
    data: ScheduledCorpusItemPayload
  ): Promise<ScheduledCorpusItemContext> {
    const result: ScheduledCorpusItemPayload = await data;

    const item = result.scheduledCorpusItem;

    // Set up data to be returned
    const context: ScheduledCorpusItemContext = {
      schema: config.snowplow.schemas.scheduledCorpusItem,
      data: {
        object_version: ObjectVersion.NEW,
        scheduled_corpus_item_external_id: item.externalId,
        scheduled_at: getUnixTimestamp(item.scheduledDate),
        url: item.approvedItem.url,
        approved_corpus_item_external_id: item.approvedItem.externalId,
        new_tab_id: item.newTabGuid,
        created_at: getUnixTimestamp(item.createdAt),
        created_by: item.createdBy,
        updated_at: getUnixTimestamp(item.updatedAt),
        updated_by: item.updatedBy ?? undefined,
      },
    };

    // Get the NewTab info
    const newTab = getNewTabByGuid(item.newTabGuid);

    if (newTab) {
      context.data = {
        ...context.data,
        new_tab_name: newTab.name,
        new_tab_feed_utc_offset: newTab.utcOffset.toString(),
      };
    }

    return context;
  }
}

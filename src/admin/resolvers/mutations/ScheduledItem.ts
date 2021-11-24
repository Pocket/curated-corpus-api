import {
  deleteScheduledItem as dbDeleteScheduledItem,
  createScheduledItem as dbCreateScheduledItem,
} from '../../../database/mutations';
import { ScheduledItem } from '../../../database/types';
import { newTabAllowedValues } from '../../../shared/types';
import { ScheduledCorpusItemEventType } from '../../../events/types';

/**
 * Deletes an item from the New Tab schedule.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function deleteScheduledItem(
  parent,
  { data },
  context
): Promise<ScheduledItem> {
  const scheduledItem = await dbDeleteScheduledItem(context.db, data);

  context.emitScheduledCorpusItemEvent(
    ScheduledCorpusItemEventType.REMOVE_SCHEDULE,
    scheduledItem
  );

  return scheduledItem;
}

export async function createScheduledItem(
  parent,
  { data },
  context
): Promise<ScheduledItem> {
  if (!newTabAllowedValues.includes(data.newTabGuid)) {
    throw new Error(
      `Cannot create a scheduled entry with New Tab GUID of "${data.newTabGuid}".`
    );
  }
  const scheduledItem = await dbCreateScheduledItem(context.db, data);

  context.emitScheduledCorpusItemEvent(
    ScheduledCorpusItemEventType.ADD_SCHEDULE,
    scheduledItem
  );

  return scheduledItem;
}

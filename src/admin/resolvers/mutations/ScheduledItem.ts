import {
  deleteScheduledItem as dbDeleteScheduledItem,
  createScheduledItem as dbCreateScheduledItem,
} from '../../../database/mutations';
import { ScheduledItem } from '../../../database/types';
import { newTabAllowedValues } from '../../../shared/types';

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
  { db }
): Promise<ScheduledItem> {
  return await dbDeleteScheduledItem(db, data);
}

export async function createScheduledItem(
  parent,
  { data },
  { db }
): Promise<ScheduledItem> {
  if (!newTabAllowedValues.includes(data.newTabGuid)) {
    throw new Error(
      `Cannot create a scheduled entry with New Tab GUID of "${data.newTabGuid}".`
    );
  }

  return await dbCreateScheduledItem(db, data);
}

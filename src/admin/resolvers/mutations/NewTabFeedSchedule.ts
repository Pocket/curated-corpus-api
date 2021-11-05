import {
  deleteNewTabFeedScheduledItem as dbDeleteNewTabFeedScheduledItem,
  createNewTabFeedScheduledItem as dbCreateNewTabFeedScheduledItem,
} from '../../../database/mutations';
import { NewTabFeedScheduledItem } from '../../../database/types';
import { newTabAllowedValues } from '../../../shared/types';

/**
 * Deletes an item from the New Tab schedule.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function deleteNewTabFeedScheduledItem(
  parent,
  { data },
  { db }
): Promise<NewTabFeedScheduledItem> {
  return await dbDeleteNewTabFeedScheduledItem(db, data);
}

export async function createNewTabFeedScheduledItem(
  parent,
  { data },
  { db }
): Promise<NewTabFeedScheduledItem> {
  if (!newTabAllowedValues.includes(data.newTabGuid)) {
    throw new Error(
      `Cannot create a scheduled entry with New Tab GUID of "${data.newTabGuid}".`
    );
  }

  return await dbCreateNewTabFeedScheduledItem(db, data);
}

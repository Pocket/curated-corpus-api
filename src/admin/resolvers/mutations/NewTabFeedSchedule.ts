import { deleteNewTabFeedScheduledItem as dbDeleteNewTabFeedScheduledItem } from '../../../database/mutations';
import { NewTabFeedScheduledItem } from '../../../database/types';

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

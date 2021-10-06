import { deleteNewTabFeedSchedule as dbDeleteNewTabFeedSchedule } from '../../../database/mutations';
import { NewTabFeedScheduleComplete } from '../../../database/types';

/**
 * Deletes an item from the New Tab schedule.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function deleteNewTabFeedSchedule(
  parent,
  { data },
  { db }
): Promise<NewTabFeedScheduleComplete> {
  return await dbDeleteNewTabFeedSchedule(db, data);
}

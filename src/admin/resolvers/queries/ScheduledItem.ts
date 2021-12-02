import { getScheduledItems as dbGetScheduledItems } from '../../../database/queries';
import { ScheduledItemsResult } from '../../../database/types';

/**
 * Retrieves a list of Approved Items that are scheduled to appear on New Tab
 *
 */
export async function getScheduledItems(
  parent,
  { filters },
  { db }
): Promise<ScheduledItemsResult[]> {
  return await dbGetScheduledItems(db, filters);
}

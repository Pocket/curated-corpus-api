import { getNewTabFeedScheduledItems as dbGetNewTabFeedScheduledItems } from '../../../database/queries';
import { NewTabFeedScheduledItemsResult } from '../../../database/types';

/**
 * Retrieves a list of Curated Items that are scheduled to appear on New Tab
 *
 */
export async function getNewTabFeedScheduledItems(
  parent,
  { filters },
  { db }
): Promise<NewTabFeedScheduledItemsResult> {
  const items = await dbGetNewTabFeedScheduledItems(db, filters);
  return { items };
}

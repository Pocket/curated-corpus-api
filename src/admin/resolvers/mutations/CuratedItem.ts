import { CuratedItem } from '@prisma/client';
import {
  createCuratedItem as dbCreateCuratedItem,
  updateCuratedItem as dbUpdateCuratedItem,
  createNewTabFeedScheduledItem,
} from '../../../database/mutations';

/**
 * Creates a curated item with data supplied. Optionally, schedules the freshly
 * created item to go onto New Tab for the date provided.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function createCuratedItem(
  parent,
  { data },
  { db }
): Promise<CuratedItem> {
  const curatedItem = await dbCreateCuratedItem(db, data);

  if (data.scheduledDate && data.newTabFeedExternalId) {
    // Note that we create a scheduled item but don't return it
    // in the mutation response. Need to evaluate if we do need to return it
    // alongside the curated item.
    await createNewTabFeedScheduledItem(db, {
      curatedItemExternalId: curatedItem.externalId,
      newTabFeedExternalId: data.newTabFeedExternalId,
      scheduledDate: data.scheduledDate,
    });
  }

  return curatedItem;
}

/**
 * Updates a curated item with data supplied.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function updateCuratedItem(
  parent,
  { data },
  { db }
): Promise<CuratedItem> {
  return await dbUpdateCuratedItem(db, data);
}

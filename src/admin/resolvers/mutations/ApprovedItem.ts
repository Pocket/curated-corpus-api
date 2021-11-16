import { ApprovedItem } from '@prisma/client';
import {
  createApprovedItem as dbCreateApprovedItem,
  updateApprovedItem as dbUpdateApprovedItem,
  createScheduledItem,
} from '../../../database/mutations';
import { newTabAllowedValues } from '../../../shared/types';

/**
 * Creates an approved curated item with data supplied. Optionally, schedules the freshly
 * created item to go onto New Tab for the date provided.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function createApprovedItem(
  parent,
  { data },
  { db }
): Promise<ApprovedItem> {
  const { scheduledDate, newTabGuid, ...approvedItemData } = data;

  if (
    scheduledDate &&
    newTabGuid &&
    !newTabAllowedValues.includes(newTabGuid)
  ) {
    throw new Error(
      `Cannot create a scheduled entry with New Tab GUID of "${data.newTabGuid}".`
    );
  }

  const approvedItem = await dbCreateApprovedItem(db, approvedItemData);

  if (scheduledDate && newTabGuid) {
    // Note that we create a scheduled item but don't return it
    // in the mutation response. Need to evaluate if we do need to return it
    // alongside the approved item.

    await createScheduledItem(db, {
      approvedItemExternalId: approvedItem.externalId,
      newTabGuid,
      scheduledDate,
    });
  }

  return approvedItem;
}

/**
 * Updates an approved curated item with data supplied.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function updateApprovedItem(
  parent,
  { data },
  { db }
): Promise<ApprovedItem> {
  return await dbUpdateApprovedItem(db, data);
}

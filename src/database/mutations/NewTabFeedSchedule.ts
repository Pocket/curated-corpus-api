import { PrismaClient } from '@prisma/client';
import {
  CreateNewTabFeedScheduledItemInput,
  DeleteNewTabFeedScheduledItemInput,
  NewTabFeedScheduledItem,
} from '../types';

/**
 * This mutation adds a scheduled entry for a New Tab.
 *
 * @param db
 * @param data
 */
export async function createNewTabFeedScheduledItem(
  db: PrismaClient,
  data: CreateNewTabFeedScheduledItemInput
): Promise<NewTabFeedScheduledItem> {
  let scheduledItem: NewTabFeedScheduledItem;

  const {
    curatedItemExternalId,
    newTabFeedExternalId,
    scheduledDate,
    createdBy,
  } = data;

  const curatedItem = await db.curatedItem.findUnique({
    where: { externalId: curatedItemExternalId },
  });

  const newTabFeed = await db.newTabFeed.findUnique({
    where: { externalId: newTabFeedExternalId },
  });

  if (curatedItem && newTabFeed) {
    scheduledItem = await db.newTabFeedSchedule.create({
      data: {
        curatedItemId: curatedItem.id,
        newTabFeedId: newTabFeed.id,
        scheduledDate: new Date(scheduledDate).toISOString(),
        createdBy,
      },
      include: {
        curatedItem: true,
      },
    });
  } else {
    throw new Error(`Cannot create a scheduled entry with data supplied.`);
  }

  return scheduledItem;
}

/**
 * This mutation deletes a scheduled entry for a New Tab.
 *
 * @param db
 * @param data
 */
export async function deleteNewTabFeedScheduledItem(
  db: PrismaClient,
  data: DeleteNewTabFeedScheduledItemInput
): Promise<NewTabFeedScheduledItem> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  // Get the item to return with the mutation
  const scheduledItem = await db.newTabFeedSchedule.findUnique({
    where: { externalId: data.externalId },
    include: {
      curatedItem: true,
    },
  });

  // Delete it if it exists in the database
  if (scheduledItem) {
    await db.newTabFeedSchedule.delete({
      where: {
        id: scheduledItem.id,
      },
    });
  } else {
    throw new Error(`Item with ID of '${data.externalId}' could not be found.`);
  }

  return scheduledItem;
}

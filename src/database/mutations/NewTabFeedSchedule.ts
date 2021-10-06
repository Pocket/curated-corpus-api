import { PrismaClient } from '@prisma/client';
import {
  DeleteNewTabFeedScheduleInput,
  NewTabFeedScheduleComplete,
} from '../types';

/**
 * This mutation updates a curated item.
 *
 * @param db
 * @param data
 */
export async function deleteNewTabFeedSchedule(
  db: PrismaClient,
  data: DeleteNewTabFeedScheduleInput
): Promise<NewTabFeedScheduleComplete> {
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

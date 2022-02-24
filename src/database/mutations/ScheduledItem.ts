import { PrismaClient } from '@prisma/client';
import {
  CreateScheduledItemInput,
  DeleteScheduledItemInput,
  ScheduledItem,
} from '../types';
import { NotFoundError } from '@pocket-tools/apollo-utils';

/**
 * This mutation adds a scheduled entry for a Scheduled Surface.
 *
 * @param db
 * @param data
 * @param username
 */
export async function createScheduledItem(
  db: PrismaClient,
  data: CreateScheduledItemInput,
  username: string
): Promise<ScheduledItem> {
  const { approvedItemExternalId, scheduledSurfaceGuid, scheduledDate } = data;

  const approvedItem = await db.approvedItem.findUnique({
    where: { externalId: approvedItemExternalId },
  });

  if (!approvedItem) {
    throw new NotFoundError(
      `Cannot create a scheduled entry: Approved Item with id "${approvedItemExternalId}" does not exist.`
    );
  }

  return await db.scheduledItem.create({
    data: {
      approvedItemId: approvedItem.id,
      scheduledSurfaceGuid,
      scheduledDate,
      createdBy: username,
    },
    include: {
      approvedItem: true,
    },
  });
}

/**
 * This mutation deletes a scheduled entry for a Scheduled Surface.
 *
 * @param db
 * @param data
 */
export async function deleteScheduledItem(
  db: PrismaClient,
  data: DeleteScheduledItemInput
): Promise<ScheduledItem> {
  // Get the item to return with the mutation
  const scheduledItem = await db.scheduledItem.findUnique({
    where: { externalId: data.externalId },
    include: {
      approvedItem: true,
    },
  });

  // Delete if it exists in the database
  if (scheduledItem) {
    await db.scheduledItem.delete({
      where: {
        id: scheduledItem.id,
      },
    });
  } else {
    throw new NotFoundError(
      `Item with ID of '${data.externalId}' could not be found.`
    );
  }

  return scheduledItem;
}

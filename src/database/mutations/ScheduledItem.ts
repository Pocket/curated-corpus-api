import { PrismaClient } from '@prisma/client';
import {
  CreateScheduledItemInput,
  DeleteScheduledItemInput,
  ScheduledItem,
} from '../types';
import { NotFoundError } from '@pocket-tools/apollo-utils';
import { UserInputError } from 'apollo-server';

/**
 * This mutation adds a scheduled entry for a New Tab.
 *
 * @param db
 * @param data
 */
export async function createScheduledItem(
  db: PrismaClient,
  data: CreateScheduledItemInput
): Promise<ScheduledItem> {
  const { approvedItemExternalId, newTabGuid, scheduledDate } = data;

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
      newTabGuid,
      scheduledDate,
      // TODO: pass an actual user ID that comes from auth/JWT
      createdBy: 'sso-user',
    },
    include: {
      approvedItem: true,
    },
  });
}

/**
 * This mutation deletes a scheduled entry for a New Tab.
 *
 * @param db
 * @param data
 */
export async function deleteScheduledItem(
  db: PrismaClient,
  data: DeleteScheduledItemInput
): Promise<ScheduledItem> {
  if (!data.externalId) {
    throw new UserInputError('externalId must be provided.');
  }

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

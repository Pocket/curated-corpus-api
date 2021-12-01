import { PrismaClient, ApprovedItem } from '@prisma/client';
import { CreateApprovedItemInput, UpdateApprovedItemInput } from '../types';
import { UserInputError } from 'apollo-server-express';

/**
 * This mutation creates an approved curated item.
 *
 * @param db
 * @param data
 */
export async function createApprovedItem(
  db: PrismaClient,
  data: CreateApprovedItemInput
): Promise<ApprovedItem> {
  // Check if the URL is unique.
  const urlExists = await db.approvedItem.count({
    where: { url: data.url },
  });

  if (urlExists) {
    throw new Error(
      `An approved item with the URL "${data.url}" already exists`
    );
  }

  return db.approvedItem.create({
    data: {
      ...data,
      // TODO: pass an actual user ID that comes from auth/JWT
      createdBy: 'sso-user',
    },
  });
}

/**
 * This mutation updates an approved curated item.
 *
 * @param db
 * @param data
 */
export async function updateApprovedItem(
  db: PrismaClient,
  data: UpdateApprovedItemInput
): Promise<ApprovedItem> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  // Check if the URL is unique.
  const urlExists = await db.approvedItem.count({
    where: { url: data.url, externalId: { not: data.externalId } },
  });

  if (urlExists) {
    throw new Error(
      `An approved item with the URL "${data.url}" already exists`
    );
  }

  return db.approvedItem.update({
    where: { externalId: data.externalId },
    data: {
      ...data,
      // TODO: pass an actual user ID that comes from auth/JWT
      createdBy: 'sso-user',
    },
  });
}

export async function deleteApprovedItem(
  db: PrismaClient,
  externalId: string
): Promise<ApprovedItem> {
  // Retrieve the Approved Item first as it needs to be
  // returned to the resolver as the result of the mutation.
  const approvedItem = await db.approvedItem.findUnique({
    where: { externalId },
  });

  // Fail early if item wasn't found.
  if (!approvedItem) {
    throw new UserInputError(
      `Could not find an approved item with external id of ${externalId}.`
    );
  }

  // Check for scheduled entries for this approved item
  const scheduledItems = await db.scheduledItem.findMany({
    where: { approvedItemId: approvedItem.id },
  });
  if (scheduledItems.length > 0) {
    throw new Error(
      `Cannot remove item from approved corpus - scheduled entries exist.`
    );
  }

  // Hard delete the Approved Item if we got past this point.
  await db.approvedItem.delete({
    where: { externalId },
  });

  return approvedItem;
}

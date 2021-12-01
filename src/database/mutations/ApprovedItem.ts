import { PrismaClient, ApprovedItem } from '@prisma/client';
import { CreateApprovedItemInput, UpdateApprovedItemInput } from '../types';
import { UserInputError } from 'apollo-server';

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
    throw new UserInputError(
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
 * This mutation updates an approve curated item.
 *
 * @param db
 * @param data
 */
export async function updateApprovedItem(
  db: PrismaClient,
  data: UpdateApprovedItemInput
): Promise<ApprovedItem> {
  if (!data.externalId) {
    throw new UserInputError('externalId must be provided.');
  }

  // Check if the URL is unique.
  const urlExists = await db.approvedItem.count({
    where: { url: data.url, externalId: { not: data.externalId } },
  });

  if (urlExists) {
    throw new UserInputError(
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

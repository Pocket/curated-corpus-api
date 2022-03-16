import { ApprovedItem, PrismaClient } from '@prisma/client';
import {
  CreateApprovedItemInput,
  ImportApprovedItemInput,
  UpdateApprovedItemInput,
} from '../types';
import { ApolloError, UserInputError } from 'apollo-server';
import { checkCorpusUrl } from '../helpers/checkCorpusUrl';

/**
 * This mutation creates an approved curated item.
 *
 * @param db
 * @param data
 * @param username
 */
export async function createApprovedItem(
  db: PrismaClient,
  data: CreateApprovedItemInput,
  username: string
): Promise<ApprovedItem> {
  // Check if an item with this URL has already been created in the Curated Corpus.
  await checkCorpusUrl(db, data.url);

  return db.approvedItem.create({
    data: {
      ...data,
      // Use the SSO username here.
      createdBy: username,
    },
  });
}

/**
 * This mutation imports/creates an approved curated item.
 * Due to the nature of the import, we do not throw an
 * error when an approved item already exists
 *
 * @param db
 * @param data
 */
export async function importApprovedItem(
  db: PrismaClient,
  data: ImportApprovedItemInput
): Promise<ApprovedItem> {
  return db.approvedItem.create({ data });
}

/**
 * This mutation updates an approved curated item.
 *
 * @param db
 * @param data
 * @param username
 */
export async function updateApprovedItem(
  db: PrismaClient,
  data: UpdateApprovedItemInput,
  username: string
): Promise<ApprovedItem> {
  if (!data.externalId) {
    throw new UserInputError('externalId must be provided.');
  }
  return db.approvedItem.update({
    where: { externalId: data.externalId },
    data: {
      ...data,
      // Use the SSO username here.
      updatedBy: username,
    },
  });
}

/**
 * This mutation deletes an approved item.
 *
 * @param db
 * @param externalId
 */
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
      `Could not find an approved item with external id of "${externalId}".`
    );
  }

  // Check for scheduled entries for this approved item
  const scheduledItems = await db.scheduledItem.findMany({
    where: { approvedItemId: approvedItem.id },
  });
  if (scheduledItems.length > 0) {
    throw new ApolloError(
      `Cannot remove item from approved corpus - scheduled entries exist.`
    );
  }

  // Hard delete the Approved Item if we got past this point.
  await db.approvedItem.delete({
    where: { externalId },
  });

  return approvedItem;
}

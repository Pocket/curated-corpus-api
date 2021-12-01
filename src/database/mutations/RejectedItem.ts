import { PrismaClient, RejectedCuratedCorpusItem } from '@prisma/client';
import { CreateRejectedItemInput } from '../types';
import { UserInputError } from 'apollo-server';

/**
 * This mutation creates a rejected item with the data provided.
 *
 * @param db
 * @param data
 */
export async function createRejectedItem(
  db: PrismaClient,
  data: CreateRejectedItemInput
): Promise<RejectedCuratedCorpusItem> {
  // Check if the URL is unique.
  const urlExists = await db.rejectedCuratedCorpusItem.count({
    where: { url: data.url },
  });

  if (urlExists) {
    throw new UserInputError(
      `A rejected item with the URL "${data.url}" already exists`
    );
  }

  return db.rejectedCuratedCorpusItem.create({
    data: {
      ...data,
      // TODO: pass an actual user ID that comes from auth/JWT
      createdBy: 'sso-user',
    },
  });
}

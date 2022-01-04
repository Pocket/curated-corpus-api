import { UserInputError } from 'apollo-server';
import { PrismaClient } from '@prisma/client';

/**
 * Checks if an item with the given URL already exists in the Curated Corpus database.
 *
 * @param db
 * @param url
 * @param externalId
 */
export const checkCorpusUrl = async (
  db: PrismaClient,
  url: string,
  externalId?: string
): Promise<void> => {
  // Build the WHERE clause. Look up if there are any records with the given URL.
  const whereClause: any = { url };

  // If an external ID of the item was provided, exclude it from the lookup.
  if (externalId) {
    whereClause.externalId = { not: externalId };
  }

  // Check if the URL is unique in the Approved Corpus.
  const approvedUrlExists = await db.approvedItem.count({
    where: whereClause,
  });

  if (approvedUrlExists) {
    throw new UserInputError(
      `An approved item with the URL "${url}" already exists.`
    );
  }

  // Do another check to make sure it hasn't already been added by another user
  // to the Rejected Corpus - an edge case the frontend should never allow but
  // that we should cater for nevertheless.
  const rejectedUrlExists = await db.rejectedCuratedCorpusItem.count({
    where: whereClause,
  });

  if (rejectedUrlExists) {
    throw new UserInputError(
      `A rejected item with the URL "${url}" already exists.`
    );
  }
};

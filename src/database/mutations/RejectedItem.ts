import { PrismaClient, RejectedCuratedCorpusItem } from '@prisma/client';
import { CreateRejectedItemInput } from '../types';
import { checkCorpusUrl } from '../helpers/checkCorpusUrl';

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
  // Check if an item with this URL has already been created in the Curated Corpus.
  await checkCorpusUrl(db, data.url);

  return db.rejectedCuratedCorpusItem.create({
    data: {
      ...data,
      // TODO: pass an actual user ID that comes from auth/JWT
      createdBy: 'sso-user',
    },
  });
}

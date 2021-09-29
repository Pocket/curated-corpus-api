import { PrismaClient, CuratedItem } from '@prisma/client';
import { UpdateCuratedItemInput } from '../types';

/**
 * This mutation updates a curated item.
 *
 * @param db
 * @param data
 */
export async function updateCuratedItem(
  db: PrismaClient,
  data: UpdateCuratedItemInput
): Promise<CuratedItem> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  // Check if the URL is unique.
  const urlExists = await db.curatedItem.count({
    where: { url: data.url, externalId: { not: data.externalId } },
  });

  if (urlExists) {
    throw new Error(`A curated item with the URL "${data.url}" already exists`);
  }

  return db.curatedItem.update({
    where: { externalId: data.externalId },
    data: { ...data },
  });
}

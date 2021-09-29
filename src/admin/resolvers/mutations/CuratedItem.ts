import { CuratedItem } from '@prisma/client';
import { updateCuratedItem as dbUpdateCuratedItem } from '../../../database/mutations';

/**
 * Updates a curated item with data supplied.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function updateCuratedItem(
  parent,
  { data },
  { db }
): Promise<CuratedItem> {
  return await dbUpdateCuratedItem(db, data);
}

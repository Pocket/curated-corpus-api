import { RejectedCuratedCorpusItem } from '@prisma/client';
import { createRejectedItem as dbCreateRejectedItem } from '../../../database/mutations';
import { ReviewedCorpusItemEventType } from '../../../events/types';

/**
 * Creates a rejected curated item with data supplied.
 *
 * @param parent
 * @param data
 * @param context
 * @param db
 */
export async function createRejectedItem(
  parent,
  { data },
  context
): Promise<RejectedCuratedCorpusItem> {
  const rejectedItem = await dbCreateRejectedItem(context.db, data);

  context.emitReviewedCorpusItemEvent(
    ReviewedCorpusItemEventType.REJECT_ITEM,
    rejectedItem
  );

  return rejectedItem;
}

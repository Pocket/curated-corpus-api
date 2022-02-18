import { RejectedCuratedCorpusItem } from '@prisma/client';
import { createRejectedItem as dbCreateRejectedItem } from '../../../database/mutations';
import { ReviewedCorpusItemEventType } from '../../../events/types';
import { IContext } from '../../context';

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
  context: IContext
): Promise<RejectedCuratedCorpusItem> {
  const rejectedItem = await dbCreateRejectedItem(
    context.db,
    data,
    context.authenticatedUser.username
  );

  context.emitReviewedCorpusItemEvent(
    ReviewedCorpusItemEventType.REJECT_ITEM,
    rejectedItem
  );

  return rejectedItem;
}

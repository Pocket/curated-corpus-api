import { RejectedCuratedCorpusItem } from '@prisma/client';
import { AuthenticationError } from 'apollo-server-core';
import { createRejectedItem as dbCreateRejectedItem } from '../../../database/mutations';
import { ReviewedCorpusItemEventType } from '../../../events/types';
import { ACCESS_DENIED_ERROR } from '../../../shared/types';
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
  // check if user is not authorized to reject an item
  if (!context.authenticatedUser.canWriteToCorpus()) {
    throw new AuthenticationError(ACCESS_DENIED_ERROR);
  }

  const rejectedItem = await dbCreateRejectedItem(context.db, data);

  context.emitReviewedCorpusItemEvent(
    ReviewedCorpusItemEventType.REJECT_ITEM,
    rejectedItem
  );

  return rejectedItem;
}

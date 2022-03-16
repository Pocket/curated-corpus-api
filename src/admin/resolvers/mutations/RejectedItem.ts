import { UserInputError } from 'apollo-server';
import { RejectedCuratedCorpusItem } from '@prisma/client';
import { AuthenticationError } from 'apollo-server-core';
import { createRejectedItem as dbCreateRejectedItem } from '../../../database/mutations';
import { ReviewedCorpusItemEventType } from '../../../events/types';
import { RejectionReason, ACCESS_DENIED_ERROR } from '../../../shared/types';
import { IContext } from '../../context';
import { checkLanguage } from '../../../database/helpers/checkLanguage';

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

  // validate reason enum
  // rejection reason comes in as a comma separated string
  data.reason.split(',').map((reason) => {
    // remove whitespace in the check below!
    if (!Object.values(RejectionReason).includes(reason.trim())) {
      throw new UserInputError(`"${reason}" is not a valid rejection reason.`);
    }
  });

  // Validate language code
  checkLanguage(data.language);

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

import { AuthenticationError } from 'apollo-server-core';
import { getScheduledItems as dbGetScheduledItems } from '../../../database/queries';
import { ScheduledItemsResult } from '../../../database/types';
import { ACCESS_DENIED_ERROR } from '../../../shared/types';
import { IContext } from '../../context';

/**
 * Retrieves a list of Approved Items that are scheduled to appear on a Scheduled Surface
 *
 */
export async function getScheduledItems(
  parent,
  { filters },
  context: IContext
): Promise<ScheduledItemsResult[]> {
  //check if the user does not have the permissions to access this query
  if (
    !context.authenticatedUser.hasReadOnly &&
    !context.authenticatedUser.canWriteToCorpus()
  ) {
    throw new AuthenticationError(ACCESS_DENIED_ERROR);
  }

  return await dbGetScheduledItems(context.db, filters);
}

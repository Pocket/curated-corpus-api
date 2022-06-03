import { CorpusItem } from '../../../database/types';
import { getApprovedItemByExternalId } from '../../../database/queries/ApprovedItem';
import { getCorpusItemFromApprovedItem } from '../../../shared/utils';
import { UserInputError } from 'apollo-server-errors';

/**
 * Pulls in scheduled items for a given date and surface (e.g., NEW_TAB_EN_US).
 *
 * @param item
 * @param db
 */
export async function getCorpusItem(item, { db }): Promise<CorpusItem> {
  const { id } = item;

  const approvedItem = await getApprovedItemByExternalId(db, id);
  if (!approvedItem) {
    throw new UserInputError(`Could not find Corpus Item with id of "${id}".`);
  }

  return getCorpusItemFromApprovedItem(approvedItem);
}

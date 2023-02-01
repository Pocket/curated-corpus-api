import { CorpusItem } from '../../../database/types';
import { getApprovedItemByExternalId, getApprovedItemByUrl } from '../../../database/queries/ApprovedItem';
import { getCorpusItemFromApprovedItem } from '../../../shared/utils';
import { UserInputError } from 'apollo-server-errors';

/**
 * Pulls in approved corpus items for a given id.
 *
 * @param item
 * @param db
 */
export async function getCorpusItem(item, { db }): Promise<CorpusItem> {
  const { id, givenUrl } = item;

  const approvedItem = id ? await getApprovedItemByExternalId(db, id) : await getApprovedItemByUrl(db, givenUrl)
  if (!approvedItem) {
    if(givenUrl) throw new UserInputError(`Could not find Corpus Item with Url of "${givenUrl}"`)
    throw new UserInputError(`Could not find Corpus Item with ID of "${id}".`);
  }

  return getCorpusItemFromApprovedItem(approvedItem);
}

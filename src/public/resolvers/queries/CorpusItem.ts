import { CorpusItem } from '../../../database/types';
import {
  getApprovedItemByExternalId,
  getApprovedItemByUrl,
} from '../../../database/queries/ApprovedItem';
import { getCorpusItemFromApprovedItem } from '../../../shared/utils';
import { UserInputError } from 'apollo-server-errors';

/**
 * Pulls in approved corpus items for a given id.
 *
 * @param item
 * @param db
 */
export async function getCorpusItem(item, { db }): Promise<CorpusItem> {
  const { id, url } = item;

  const approvedItem = id
    ? await getApprovedItemByExternalId(db, id)
    : await getApprovedItemByUrl(db, url);
  if (!approvedItem) {
    if (url)
      throw new UserInputError(
        `Could not find Corpus Item with Url of "${url}"`
      );
    throw new UserInputError(`Could not find Corpus Item with ID of "${id}".`);
  }

  return getCorpusItemFromApprovedItem(approvedItem);
}

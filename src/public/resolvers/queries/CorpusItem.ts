import { CorpusItem } from '../../../database/types';
import {
  getApprovedItemByExternalId,
  getApprovedItemByUrl,
} from '../../../database/queries/ApprovedItem';
import { getCorpusItemFromApprovedItem } from '../../../shared/utils';
import { UserInputError } from '@pocket-tools/apollo-utils';

/**
 * Pulls in approved corpus items for a given id.
 *
 * @param item
 * @param db
 */
export async function getCorpusItem(item, { db }): Promise<CorpusItem> {
  const { id } = item;

  const approvedItem = await getApprovedItemByExternalId(db, id);
  if (!approvedItem) {
    throw new UserInputError(`Could not find Corpus Item with ID of "${id}".`);
  }

  return getCorpusItemFromApprovedItem(approvedItem);
}

export async function getSavedCorpusItem(
  item,
  args,
  { db }
): Promise<CorpusItem> {
  const { url } = item;

  const approvedItem = await getApprovedItemByUrl(db, url);
  if (!approvedItem) {
    return null;
  }

  return getCorpusItemFromApprovedItem(approvedItem);
}

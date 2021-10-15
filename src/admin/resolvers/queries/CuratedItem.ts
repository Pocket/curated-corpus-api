import config from '../../../config';
import { CuratedItemsResult } from '../../../database/types';
import {
  getCuratedItems as dbGetCuratedItems,
  countCuratedItems,
} from '../../../database/queries';
import { getPagination } from '../../../database/utils/getPagination';

/**
 * This query retrieves curated items from the database.
 *
 * There is a limited set of sorting options (createdAt, updatedAt)
 * and filters (url, title, language, curation status)
 *
 * @param parent
 * @param args
 * @param db
 */
export async function getCuratedItems(
  parent,
  args,
  { db }
): Promise<CuratedItemsResult> {
  const {
    page = 1,
    perPage = config.app.pagination.curatedItemsPerPage,
    filters,
  } = args;

  const totalResults = await countCuratedItems(db, filters);

  const items = await dbGetCuratedItems(db, page, perPage, filters);

  return { items, pagination: getPagination(totalResults, page, perPage) };
}

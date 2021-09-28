import config from '../../../config';
import { CuratedItemsResult } from '../../../database/types';
import {
  getCuratedItems as dbGetCuratedItems,
  countCuratedItems,
} from '../../../database/queries';
import { getPagination } from '../../../database/utils/getPagination';

export async function getCuratedItems(
  parent,
  args,
  { db }
): Promise<CuratedItemsResult> {
  const {
    page = 1,
    perPage = config.app.pagination.curatedItemsPerPage,
    orderBy,
    filters,
  } = args;

  const totalResults = await countCuratedItems(db, filters);

  const items = await dbGetCuratedItems(db, page, perPage, orderBy, filters);

  return { items, pagination: getPagination(totalResults, page, perPage) };
}

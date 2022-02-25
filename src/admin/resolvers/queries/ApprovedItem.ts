import { Connection } from '@devoxa/prisma-relay-cursor-connection';
import { ApprovedItem } from '@prisma/client';
import { AuthenticationError } from 'apollo-server-core';
import config from '../../../config';
import {
  getApprovedItems as dbGetApprovedItems,
  getApprovedItemByUrl as dbGetApprovedItemByUrl,
} from '../../../database/queries';
import { ACCESS_DENIED_ERROR } from '../../../shared/types';
import { IContext } from '../../context';

/**
 * This query retrieves approved items from the database.
 *
 * @param parent
 * @param args
 * @param db
 */
export async function getApprovedItems(
  parent,
  args,
  context: IContext
): Promise<Connection<ApprovedItem>> {
  //check if the user does not have the permissions to access this query
  if (
    !context.authenticatedUser.hasReadOnly &&
    !context.authenticatedUser.canWriteToCorpus()
  ) {
    throw new AuthenticationError(ACCESS_DENIED_ERROR);
  }

  let { pagination } = args;

  // Set the defaults for pagination if nothing's been provided
  if (
    !pagination ||
    (pagination.first === undefined && pagination.last === undefined)
  ) {
    pagination = { first: config.app.pagination.approvedItemsPerPage };
  } else {
    // Add some limits to how many items can be retrieved at any one time.
    // These limits are higher than the defaults applied above.
    const maxAllowedResults = config.app.pagination.maxAllowedResults;
    if (pagination.first && pagination.first > maxAllowedResults) {
      pagination.first = maxAllowedResults;
    }
    if (pagination.last && pagination.last > maxAllowedResults) {
      pagination.last = maxAllowedResults;
    }
  }

  return await dbGetApprovedItems(context.db, pagination, args.filters);
}

/**
 * This query returns an approved item with a given URL if it finds one
 * in the Curated Corpus (among approved items only), or
 * return null if the url is not found
 *
 * @param parent
 * @param args
 * @param db
 */
export async function getApprovedItemByUrl(
  parent,
  args,
  { db }
): Promise<ApprovedItem | null> {
  return await dbGetApprovedItemByUrl(db, args.url);
}

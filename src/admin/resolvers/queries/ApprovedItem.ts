import { Connection } from '@devoxa/prisma-relay-cursor-connection';
import { ApprovedItem, ScheduledItem } from '@prisma/client';
import { AuthenticationError, UserInputError } from 'apollo-server-errors';
import config from '../../../config';
import {
  getApprovedItems as dbGetApprovedItems,
  getApprovedItemByUrl as dbGetApprovedItemByUrl,
  getScheduledSurfaceHistory as dbGetScheduledSurfaceHistory,
} from '../../../database/queries';
import { ACCESS_DENIED_ERROR, ScheduledSurfaces } from '../../../shared/types';
import { IContext } from '../../context';

/**
 * This query retrieves approved items from the database.
 *
 * @param parent
 * @param args
 * @param context
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
 * @param context
 */
export async function getApprovedItemByUrl(
  parent,
  args,
  context: IContext
): Promise<ApprovedItem | null> {
  //check if the user does not have the permissions to access this query
  if (
    !context.authenticatedUser.hasReadOnly &&
    !context.authenticatedUser.canWriteToCorpus()
  ) {
    throw new AuthenticationError(ACCESS_DENIED_ERROR);
  }

  return await dbGetApprovedItemByUrl(context.db, args.url);
}

/**
 * Retrieves a history of when and on what scheduled surface a corpus item
 * was scheduled.
 */
export async function getScheduledSurfaceHistory(
  parent,
  args,
  { db }
): Promise<ScheduledItem[]> {
  // Get the external ID of the Approved Item itself
  const { externalId } = parent;

  // Get the optional filters. Not specifying any means we will retrieve
  // the entire list of all the occasions this approved item was scheduled
  // on all surfaces, in descending order (most recently scheduled first).
  //
  // Limiting it to a single surface means we'll only retrieve data for
  // one scheduled surface (useful for when you only need the one to filter out
  // prospects on the Prospecting page).
  //
  // Limiting the number of results to one means only the most recent result
  // will be returned.
  const { scheduledSurfaceGuid, limit } = args;

  // Check if the scheduled surface supplied is valid
  const surface = ScheduledSurfaces.find((surface) => {
    return surface.guid === scheduledSurfaceGuid;
  });
  if (!surface) {
    throw new UserInputError(
      `Could not find Scheduled Surface with id of "${scheduledSurfaceGuid}".`
    );
  }

  // Check if the limit specified passes basic sanity checks
  if (limit.isNaN() || limit < 1) {
    throw new UserInputError(
      `Please specify the number of results to be returned (one or more).`
    );
  }

  // call the db function that returns scheduled items
  return dbGetScheduledSurfaceHistory(
    db,
    externalId,
    scheduledSurfaceGuid,
    limit
  );
}

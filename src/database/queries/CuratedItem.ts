import { CuratedItem, PrismaClient } from '@prisma/client';
// need this to be able to use Prisma-native types for orderBy and filter clauses
import * as prisma from '@prisma/client';
import {
  findManyCursorConnection,
  Connection,
} from '@devoxa/prisma-relay-cursor-connection';
import { CuratedItemFilter, PaginationInput } from '../types';

/**
 * A dedicated type for the unique cursor value used in the getCuratedItems query.
 * Essential to get findManyCursorConnection to work as expected.
 */
type CuratedItemCursor = {
  externalId: string;
};

/**
 * Return a Relay-style paginated, optionally filtered list of curated items.
 *
 * @param db
 * @param pagination
 * @param filters
 */
export async function getCuratedItems(
  db: PrismaClient,
  pagination: PaginationInput,
  filters: CuratedItemFilter
): Promise<Connection<CuratedItem>> {
  // Set up the SQL clauses with our defaults (orderBy) and any filters supplied
  // by the client.
  const baseArgs: prisma.Prisma.CuratedItemFindManyArgs = {
    orderBy: { createdAt: 'desc' },
    where: constructWhereClauseFromFilters(filters),
  };

  // Unleash the full potential of the below function that extends Prisma's own `findMany`.
  //
  // This helper function returns a list of CuratedItem edges alongside a `totalCount` value
  // and a `pageInfo` object (see type above in the promise returned: `Connection<CuratedItem>`
  // that matches what the GraphQL server expects to provide to the client perfectly.
  //
  // Step 1: Provide at least two types - CuratedItem as the record/entity we're using, and
  // CuratedItemCursor defined at the top of this file to specify a custom field for the cursor.
  return findManyCursorConnection<CuratedItem, CuratedItemCursor>(
    // Step 2: the function will generate cursor/take/skip arguments for us in `args`,
    // need to add our own to that.
    (args) => db.curatedItem.findMany({ ...args, ...baseArgs }),
    () => db.curatedItem.count({ where: baseArgs.where }),
    // Step 3: Pass the PaginationInput here exactly as it arrives all the way from
    // the query - the types are 100% compatible.
    pagination,
    // Step 4: Provide additional options.
    {
      // Option 1: The default cursor is the `id` field of the record.
      // We don't expose the numeric ID of each Curated Item. Use `externalId`
      // instead, which is also a unique field.
      getCursor: (record) => ({
        externalId: record.externalId,
      }),
      // Option 2: Callback function that encodes the cursor before returning
      // the response object to the resolver function and then on to the client.
      encodeCursor: (cursor) =>
        Buffer.from(JSON.stringify(cursor)).toString('base64'),
      // Option 3: Callback function that decodes the cursor that may be passed in
      // as part of `pagination` variables (either `before` or `after`) before
      // sending it along as the now-decoded `externalId` value to Prisma.
      decodeCursor: (cursor) =>
        JSON.parse(Buffer.from(cursor, 'base64').toString('ascii')),
    }
  );
}

/**
 * Convert the GraphQL filter for curated items into a 'where' clause
 * that Prisma expects to receive.
 *
 * @param filters
 */
const constructWhereClauseFromFilters = (
  filters: CuratedItemFilter
): prisma.Prisma.CuratedItemWhereInput => {
  // Get out quickly if no filters have been provided.
  if (!filters) return {};

  return {
    // Exact filters for language, curation status and topic
    language: filters.language ? { equals: filters.language } : undefined,
    status: filters.status ? { equals: filters.status } : undefined,
    topic: filters.topic ? { equals: filters.topic } : undefined,

    // Substring match for title and URL
    title: filters.title ? { contains: filters.title } : undefined,
    url: filters.url ? { contains: filters.url } : undefined,
  };
};

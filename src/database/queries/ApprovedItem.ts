import { ApprovedItem, PrismaClient } from '@prisma/client';
// need this to be able to use Prisma-native types for orderBy and filter clauses
import * as prisma from '@prisma/client';
import {
  findManyCursorConnection,
  Connection,
} from '@devoxa/prisma-relay-cursor-connection';
import { ApprovedItemFilter, PaginationInput } from '../types';

/**
 * A dedicated type for the unique cursor value used in the getCuratedItems query.
 * Essential to get findManyCursorConnection to work as expected.
 */
type ApprovedItemCursor = {
  externalId: string;
};

/**
 * Return a Relay-style paginated, optionally filtered list of approved items.
 *
 * @param db
 * @param pagination
 * @param filters
 */
export async function getApprovedItems(
  db: PrismaClient,
  pagination: PaginationInput,
  filters: ApprovedItemFilter
): Promise<Connection<ApprovedItem>> {
  // Set up the SQL clauses with our defaults (orderBy) and any filters supplied
  // by the client.
  const baseArgs: prisma.Prisma.ApprovedItemFindManyArgs = {
    orderBy: { createdAt: 'desc' },
    where: constructWhereClauseFromFilters(filters),
    include: {
      authors: {
        orderBy: [{ sortOrder: 'asc' }],
      },
    },
  };

  // Unleash the full potential of the below function that extends Prisma's own `findMany`.
  //
  // This helper function returns a list of ApprovedItem edges alongside a `totalCount` value
  // and a `pageInfo` object (see type above in the promise returned: `Connection<ApprovedItem>`
  // that matches what the GraphQL server expects to provide to the client perfectly.
  //
  // Step 1: Provide at least two types - ApprovedItem as the record/entity we're using, and
  // ApprovedItemCursor defined at the top of this file to specify a custom field for the cursor.
  return findManyCursorConnection<ApprovedItem, ApprovedItemCursor>(
    // Step 2: the function will generate cursor/take/skip arguments for us in `args`,
    // need to add our own to that.
    (args) => db.approvedItem.findMany({ ...args, ...baseArgs }),
    () => db.approvedItem.count({ where: baseArgs.where }),
    // Step 3: Pass the PaginationInput here exactly as it arrives all the way from
    // the query - the types are 100% compatible.
    pagination,
    // Step 4: Provide additional options.
    {
      // Option 1: The default cursor is the `id` field of the record.
      // We don't expose the numeric ID of each Approved Item. Use `externalId`
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
 * Return an approved item with the given URL if found in the Curated Corpus or
 * return null if the url is not found
 *
 * @param db
 * @param url
 */
export async function getApprovedItemByUrl(
  db: PrismaClient,
  url: string
): Promise<ApprovedItem | null> {
  return db.approvedItem.findUnique({ where: { url } });
}

/**
 * Convert the GraphQL filter for approved items into a 'where' clause
 * that Prisma expects to receive.
 *
 * @param filters
 */
const constructWhereClauseFromFilters = (
  filters: ApprovedItemFilter
): prisma.Prisma.ApprovedItemWhereInput => {
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

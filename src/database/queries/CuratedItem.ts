import { CuratedItem, PrismaClient } from '@prisma/client';
// need this to be able to use Prisma-native types for orderBy and filter clauses
import * as prisma from '@prisma/client';
import {
  findManyCursorConnection,
  Connection,
} from '@devoxa/prisma-relay-cursor-connection';
import { CuratedItemFilter, PaginationInput } from '../types';

/**
 * A unique cursor value for curated items.
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
  const baseArgs: prisma.Prisma.CuratedItemFindManyArgs = {
    orderBy: { createdAt: 'desc' },
    where: constructWhereClauseFromFilters(filters),
  };

  return findManyCursorConnection<CuratedItem, CuratedItemCursor>(
    (args) => db.curatedItem.findMany({ ...args, ...baseArgs }),
    () => db.curatedItem.count({ where: baseArgs.where }),
    pagination,
    {
      getCursor: (record) => ({
        externalId: record.externalId,
      }),
      encodeCursor: (cursor) =>
        Buffer.from(JSON.stringify(cursor)).toString('base64'),
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
    // Exact filters for language & curation status
    language: filters.language ? { equals: filters.language } : undefined,
    status: filters.status ? { equals: filters.status } : undefined,

    // Substring match for title, topic, and URL
    title: filters.title ? { contains: filters.title } : undefined,
    topic: filters.topic ? { contains: filters.topic } : undefined,
    url: filters.url ? { contains: filters.url } : undefined,
  };
};

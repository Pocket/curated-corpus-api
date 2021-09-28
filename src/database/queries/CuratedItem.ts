import { CuratedItem, PrismaClient } from '@prisma/client';
// need this to be able to use Prisma-native types for orderBy and filter clauses
import * as prisma from '@prisma/client';
import { CuratedItemFilterInput, CuratedItemOrderByInput } from '../types';

/**
 * @param db
 * @param page
 * @param perPage
 * @param orderBy
 * @param filters
 */
export async function getCuratedItems(
  db: PrismaClient,
  page: number,
  perPage: number,
  orderBy: CuratedItemOrderByInput,
  filters: CuratedItemFilterInput
): Promise<CuratedItem[]> {
  // transform the orderBy arguments we get from the query into
  // an object Prisma expects
  const prismaOrderBy: prisma.Prisma.Enumerable<prisma.Prisma.CuratedItemOrderByWithRelationInput> =
    [];
  for (const name in orderBy) {
    prismaOrderBy.push({ [name]: orderBy[name].toLowerCase() });
  }

  // if there is no orderBy variable in the query, order by last added first
  if (prismaOrderBy.length < 1) {
    prismaOrderBy.push({ createdAt: 'desc' });
  }

  return db.curatedItem.findMany({
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
    orderBy: prismaOrderBy,
    where: constructWhereClauseFromFilters(filters),
  });
}

/**
 * @param db
 * @param filters
 */
export async function countCuratedItems(
  db: PrismaClient,
  filters: CuratedItemFilterInput
): Promise<number> {
  return db.curatedItem.count({
    where: constructWhereClauseFromFilters(filters),
  });
}

const constructWhereClauseFromFilters = (
  filters: CuratedItemFilterInput
): prisma.Prisma.CuratedItemWhereInput => {
  // construct filters, if any
  if (!filters) return {};

  return {
    language: filters.language ? { equals: filters.language } : undefined,
    status: filters.status ? { equals: filters.status } : undefined,

    // substring match for title, url
    title: filters.title ? { contains: filters.title } : undefined,
    url: filters.url ? { contains: filters.url } : undefined,
  };
};

import { CuratedItem, PrismaClient } from '@prisma/client';
// need this to be able to use Prisma-native types for orderBy and filter clauses
import * as prisma from '@prisma/client';
import { CuratedItemFilter } from '../types';

/**
 * @param db
 * @param page
 * @param perPage
 * @param filters
 */
export async function getCuratedItems(
  db: PrismaClient,
  page: number,
  perPage: number,
  filters: CuratedItemFilter
): Promise<CuratedItem[]> {
  return db.curatedItem.findMany({
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
    orderBy: { createdAt: 'desc' },
    where: constructWhereClauseFromFilters(filters),
  });
}

/**
 * @param db
 * @param filters
 */
export async function countCuratedItems(
  db: PrismaClient,
  filters: CuratedItemFilter
): Promise<number> {
  return db.curatedItem.count({
    where: constructWhereClauseFromFilters(filters),
  });
}

const constructWhereClauseFromFilters = (
  filters: CuratedItemFilter
): prisma.Prisma.CuratedItemWhereInput => {
  // construct filters, if any
  if (!filters) return {};

  return {
    language: filters.language ? { equals: filters.language } : undefined,
    status: filters.status ? { equals: filters.status } : undefined,

    // substring match for title, url, topic
    title: filters.title ? { contains: filters.title } : undefined,
    topic: filters.topic ? { contains: filters.topic } : undefined,
    url: filters.url ? { contains: filters.url } : undefined,
  };
};

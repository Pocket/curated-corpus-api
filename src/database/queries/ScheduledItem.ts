import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import {
  ScheduledItemsResult,
  ScheduledItemFilterInput,
  ScheduledItem,
} from '../types';
import { groupBy } from '../../shared/utils';

/**
 * @param db
 * @param filters
 */
export async function getScheduledItems(
  db: PrismaClient,
  filters: ScheduledItemFilterInput
): Promise<ScheduledItemsResult[]> {
  const { newTabGuid, startDate, endDate } = filters;

  // Get a flat array of scheduled items from Prisma
  const items = await db.scheduledItem.findMany({
    orderBy: { scheduledDate: 'asc' },
    where: {
      newTabGuid: { equals: newTabGuid },
      scheduledDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      approvedItem: true,
    },
  });

  // Group scheduled items into an array of arrays.
  const groupByScheduledDate = groupBy('scheduledDate');
  const groupedItems = groupByScheduledDate(items);

  // Transform the grouped scheduled items into the return result
  // of the right shape.
  const results: ScheduledItemsResult[] = groupedItems.map(
    (items: ScheduledItem[]) => {
      // Format the scheduled date to YYYY-MM-DD format
      // the resolver expects to return.
      const scheduledDate = DateTime.fromJSDate(
        items[0].scheduledDate
      ).toFormat('yyyy-MM-dd');

      return {
        scheduledDate,
        totalCount: items.length,
        syndicatedCount: items.filter(
          (item) => item.approvedItem.isSyndicated === true
        ).length,
        items: items,
      };
    }
  );

  return results;
}

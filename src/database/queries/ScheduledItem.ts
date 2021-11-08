import { PrismaClient } from '@prisma/client';
import { ScheduledItem, ScheduledItemFilterInput } from '../types';

/**
 * @param db
 * @param filters
 */
export async function getScheduledItems(
  db: PrismaClient,
  filters: ScheduledItemFilterInput
): Promise<ScheduledItem[]> {
  const { newTabGuid, startDate, endDate } = filters;

  return await db.scheduledItem.findMany({
    // for now, assume that we only ever want to retrieve these
    // ordered by last added first
    orderBy: { createdAt: 'desc' },
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
}

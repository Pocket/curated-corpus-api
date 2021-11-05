import { PrismaClient } from '@prisma/client';
import {
  NewTabFeedScheduledItem,
  NewTabFeedScheduleFilterInput,
} from '../types';

/**
 * @param db
 * @param filters
 */
export async function getNewTabFeedScheduledItems(
  db: PrismaClient,
  filters: NewTabFeedScheduleFilterInput
): Promise<NewTabFeedScheduledItem[]> {
  const { newTabGuid, startDate, endDate } = filters;

  return await db.newTabFeedSchedule.findMany({
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
      curatedItem: true,
    },
  });
}

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
  const { newTabExternalId, startDate, endDate } = filters;

  const newTab = await db.newTabFeed.findUnique({
    where: { externalId: newTabExternalId },
  });

  if (newTab) {
    return await db.newTabFeedSchedule.findMany({
      // for now, assume that we only ever want to retrieve these
      // ordered by last added first
      orderBy: { createdAt: 'desc' },
      where: {
        newTabFeedId: { equals: newTab?.id },
        scheduledDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        curatedItem: true,
      },
    });
  } else {
    throw new Error(
      `Record with ID of '${newTabExternalId}' could not be found.`
    );
  }
}

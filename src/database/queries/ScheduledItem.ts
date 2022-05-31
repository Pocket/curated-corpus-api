import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import {
  ScheduledItem,
  ScheduledItemFilterInput,
  ScheduledItemsResult,
  ScheduledSurfaceItem,
} from '../types';
import { scheduledSurfaceAllowedValues } from '../../shared/utils';
import { groupBy } from '../../shared/utils';
import { UserInputError } from 'apollo-server-errors';

/**
 * @param db
 * @param filters
 */
export async function getScheduledItems(
  db: PrismaClient,
  filters: ScheduledItemFilterInput
): Promise<ScheduledItemsResult[]> {
  const { scheduledSurfaceGuid, startDate, endDate } = filters;

  // validate scheduledSurfaceGuid
  if (!scheduledSurfaceAllowedValues.includes(scheduledSurfaceGuid)) {
    throw new UserInputError(
      `${scheduledSurfaceGuid} is not a valid Scheduled Surface GUID`
    );
  }

  // Get a flat array of scheduled items from Prisma
  const items = await db.scheduledItem.findMany({
    // we need to order by scheduleDate first, as we perform a programmatic
    // groupBy below on that field
    orderBy: [{ scheduledDate: 'asc' }, { updatedAt: 'asc' }],
    where: {
      scheduledSurfaceGuid: { equals: scheduledSurfaceGuid },
      scheduledDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      approvedItem: {
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
      },
    },
  });

  // Group scheduled items into an array of arrays.
  const groupedItems = groupBy(items, 'scheduledDate');

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
        collectionCount: items.filter(
          (item) => item.approvedItem.isCollection === true
        ).length,
        syndicatedCount: items.filter(
          (item) => item.approvedItem.isSyndicated === true
        ).length,
        totalCount: items.length,
        items: items,
      };
    }
  );

  return results;
}

/**
 * Gets a list of scheduled items for a combination of a given scheduled surface
 * (e.g., New Tab) and a date in YYYY-MM-DD format.
 *
 * @param db
 * @param id
 * @param date
 */
export async function getItemsForScheduledSurface(
  db: PrismaClient,
  id: string,
  date: string
): Promise<ScheduledSurfaceItem[]> {
  // Get a flat array of scheduled items from Prisma
  const items = await db.scheduledItem.findMany({
    orderBy: { updatedAt: 'asc' },
    where: {
      scheduledSurfaceGuid: { equals: id },
      scheduledDate: date,
    },
    include: {
      approvedItem: {
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
      },
    },
  });

  // Convert these items into the expected query result:
  // ScheduledSurfaceItem & CorpusItem
  return items.map((scheduledItem) => {
    const item: ScheduledSurfaceItem = {
      id: scheduledItem.externalId,
      surfaceId: scheduledItem.scheduledSurfaceGuid,
      scheduledDate: DateTime.fromJSDate(scheduledItem.scheduledDate).toFormat(
        'yyyy-MM-dd'
      ),
      corpusItem: {
        id: scheduledItem.approvedItem.externalId,
        url: scheduledItem.approvedItem.url,
        title: scheduledItem.approvedItem.title,
        excerpt: scheduledItem.approvedItem.excerpt,
        authors: scheduledItem.approvedItem.authors,
        language: scheduledItem.approvedItem.language,
        publisher: scheduledItem.approvedItem.publisher,
        imageUrl: scheduledItem.approvedItem.imageUrl,
        // so the type definition in /src/database/types has topic as optional,
        // which typescript resolves as `string | undefined`. however, if the
        // topic is missing in the db, prisma returns `null` - hence the
        // nullish coalescing operator below.
        //
        // i wonder why typescript won't accept both. is there some deep dark
        // JS reason? or is it just better practice?
        topic: scheduledItem.approvedItem.topic ?? undefined,
      },
    };
    return item;
  });
}

/**
 * Get scheduled item with attributes that define it as unique
 * @param db
 * @param data
 */
export async function getScheduledItemByUniqueAttributes(
  db: PrismaClient,
  data
): Promise<ScheduledItem | null> {
  return db.scheduledItem.findUnique({
    where: {
      ItemScheduledSurfaceDate: {
        approvedItemId: data.approvedItemId,
        scheduledSurfaceGuid: data.scheduledSurfaceGuid,
        scheduledDate: data.scheduledDate,
      },
    },
    include: {
      approvedItem: {
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
      },
    },
  });
}

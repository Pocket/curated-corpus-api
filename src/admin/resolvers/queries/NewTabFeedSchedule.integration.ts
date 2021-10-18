import {
  clearDb,
  createCuratedItemHelper,
  createNewTabFeedHelper,
  createNewTabScheduleHelper,
} from '../../../test/helpers';
import { db, server } from '../../../test/admin-server';
import { GET_NEW_TAB_FEED_SCHEDULED_ITEMS } from '../../../test/admin-server/queries.gql';
import { NewTabFeed } from '@prisma/client';

describe('queries: NewTabFeedSchedule', () => {
  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('getNewTabScheduledItems query', () => {
    let newTabFeed: NewTabFeed;

    beforeAll(async () => {
      // Create a dummy New Tab
      newTabFeed = await createNewTabFeedHelper(db, {
        shortName: 'en-UK',
      });

      // Create some curated items
      const storyTitles = [
        "Here's A Quick Way To Solve A Problem with Node",
        'Proof That Node Really Works',
        'How To Quit Node In 5 Days',
        'Node: The Samurai Way',
        '10 Unforgivable Sins Of Node',
      ];

      // And schedule them for the near future
      for (const title of storyTitles) {
        const curatedItem = await createCuratedItemHelper(db, { title });
        await createNewTabScheduleHelper(db, {
          newTabFeed,
          curatedItem,
        });
      }
    });

    it('should get all requested items', async () => {
      const { data } = await server.executeOperation({
        query: GET_NEW_TAB_FEED_SCHEDULED_ITEMS,
        variables: {
          filters: {
            newTabExternalId: newTabFeed.externalId,
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      expect(data?.getNewTabFeedScheduledItems.items).toHaveLength(5);

      // Check default sorting - createdAt.DESC
      const firstItem = data?.getNewTabFeedScheduledItems.items[0];
      const secondItem = data?.getNewTabFeedScheduledItems.items[1];
      expect(firstItem.createdAt > secondItem.createdAt).toBeTruthy();
    });

    it('should return all expected properties', async () => {
      const { data } = await server.executeOperation({
        query: GET_NEW_TAB_FEED_SCHEDULED_ITEMS,
        variables: {
          filters: {
            newTabExternalId: newTabFeed.externalId,
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      const firstItem = data?.getNewTabFeedScheduledItems.items[0];

      // Scalar properties
      expect(firstItem.externalId).toBeTruthy();
      expect(firstItem.createdAt).toBeTruthy();
      expect(firstItem.createdBy).toBeTruthy();
      expect(firstItem.updatedAt).toBeTruthy();
      expect(firstItem.updatedBy).toBeNull();
      expect(firstItem.scheduledDate).toBeTruthy();

      // The underlying Curated Item
      expect(firstItem.curatedItem.externalId).toBeTruthy();
      expect(firstItem.curatedItem.title).toBeTruthy();
      expect(firstItem.curatedItem.url).toBeTruthy();
      expect(firstItem.curatedItem.excerpt).toBeTruthy();
      expect(firstItem.curatedItem.imageUrl).toBeTruthy();
      expect(firstItem.curatedItem.createdBy).toBeTruthy();
    });

    it('should fail on non-existent New Tab ID', async () => {
      const invalidId = 'not-a-valid-id-by-any-means';

      const result = await server.executeOperation({
        query: GET_NEW_TAB_FEED_SCHEDULED_ITEMS,
        variables: {
          filters: {
            newTabExternalId: invalidId,
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      expect(result.data).toBeNull();

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).toMatch(
          `Record with ID of '${invalidId}' could not be found.`
        );
      }
    });
  });
});

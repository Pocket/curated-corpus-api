import {
  clearDb,
  createApprovedItemHelper,
  createScheduledItemHelper,
} from '../../../test/helpers';
import { db, server } from '../../../test/admin-server';
import { GET_SCHEDULED_ITEMS } from '../../../test/admin-server/queries.gql';

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
    beforeAll(async () => {
      // Create some approved items
      const storyTitles = [
        "Here's A Quick Way To Solve A Problem with Node",
        'Proof That Node Really Works',
        'How To Quit Node In 5 Days',
        'Node: The Samurai Way',
        '10 Unforgivable Sins Of Node',
      ];

      // And schedule them for the near future
      for (const title of storyTitles) {
        const approvedItem = await createApprovedItemHelper(db, { title });
        await createScheduledItemHelper(db, {
          newTabGuid: 'EN_US',
          approvedItem,
        });
      }
    });

    it('should get all requested items', async () => {
      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_ITEMS,
        variables: {
          filters: {
            newTabGuid: 'EN_US',
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      expect(data?.getScheduledCuratedCorpusItems.items).toHaveLength(5);

      // Check default sorting - createdAt.DESC
      const firstItem = data?.getScheduledCuratedCorpusItems.items[0];
      const secondItem = data?.getScheduledCuratedCorpusItems.items[1];
      expect(firstItem.createdAt > secondItem.createdAt).toBeTruthy();
    });

    it('should return all expected properties', async () => {
      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_ITEMS,
        variables: {
          filters: {
            newTabGuid: 'EN_US',
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      const firstItem = data?.getScheduledCuratedCorpusItems.items[0];

      // Scalar properties
      expect(firstItem.externalId).toBeTruthy();
      expect(firstItem.createdAt).toBeTruthy();
      expect(firstItem.createdBy).toBeTruthy();
      expect(firstItem.updatedAt).toBeTruthy();
      expect(firstItem.updatedBy).toBeNull();
      expect(firstItem.scheduledDate).toBeTruthy();

      // The underlying Approved Item
      expect(firstItem.approvedItem.externalId).toBeTruthy();
      expect(firstItem.approvedItem.title).toBeTruthy();
      expect(firstItem.approvedItem.url).toBeTruthy();
      expect(firstItem.approvedItem.excerpt).toBeTruthy();
      expect(firstItem.approvedItem.imageUrl).toBeTruthy();
      expect(firstItem.approvedItem.createdBy).toBeTruthy();
    });

    it('should fail on non-existent New Tab ID', async () => {
      const invalidId = 'not-a-valid-id-by-any-means';

      const result = await server.executeOperation({
        query: GET_SCHEDULED_ITEMS,
        variables: {
          filters: {
            newTabGuid: invalidId,
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      // Expect to see no data returned, and no errors either
      expect(result.data?.getScheduledCuratedCorpusItems.items).toHaveLength(0);
      expect(result.errors).toBeUndefined();
    });
  });
});

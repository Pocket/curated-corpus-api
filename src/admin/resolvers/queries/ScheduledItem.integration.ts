import { expect } from 'chai';
import {
  clearDb,
  createApprovedItemHelper,
  createScheduledItemHelper,
} from '../../../test/helpers';
import { db, getServer } from '../../../test/admin-server';
import { GET_SCHEDULED_ITEMS } from './sample-queries.gql';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';

describe('queries: ScheduledCuratedCorpusItem', () => {
  const server = getServer(new CuratedCorpusEventEmitter());

  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('getScheduledCuratedCorpusItems query', () => {
    beforeAll(async () => {
      // Create some approved items and schedule them for a date in the future
      for (let i = 0; i < 5; i++) {
        const approvedItem = await createApprovedItemHelper(db, {
          title: `Batch 1, Story #${i + 1}`,
        });
        await createScheduledItemHelper(db, {
          scheduledSurfaceGuid: 'NEW_TAB_EN_US',
          approvedItem,
          scheduledDate: new Date('2050-01-01').toISOString(),
        });
      }

      // Create more approved items for a different scheduled date
      for (let i = 0; i < 10; i++) {
        const approvedItem = await createApprovedItemHelper(db, {
          title: `Batch 2, Story #${i + 1}`,
        });
        await createScheduledItemHelper(db, {
          scheduledSurfaceGuid: 'NEW_TAB_EN_US',
          approvedItem,
          scheduledDate: new Date('2025-05-05').toISOString(),
        });
      }
    });

    it('should return all requested items', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_ITEMS,
        variables: {
          filters: {
            scheduledSurfaceGuid: 'NEW_TAB_EN_US',
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      // Good to check this here before we get into actual return values
      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      const resultArray = result.data?.getScheduledCuratedCorpusItems;
      expect(resultArray).to.have.lengthOf(2);
      expect(resultArray[0].totalCount).to.equal(10);
      expect(resultArray[0].items).to.have.lengthOf(10);
    });

    it('should return all expected properties', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_ITEMS,
        variables: {
          filters: {
            scheduledSurfaceGuid: 'NEW_TAB_EN_US',
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      const resultArray = result.data?.getScheduledCuratedCorpusItems;

      // Check the first group of scheduled items
      expect(resultArray[0].collectionCount).not.to.be.null;
      expect(resultArray[0].syndicatedCount).not.to.be.null;
      expect(resultArray[0].totalCount).not.to.be.null;
      expect(resultArray[0].scheduledDate).not.to.be.null;

      // Check the first item in the first group
      const firstItem = resultArray[0].items[0];

      // Scalar properties
      expect(firstItem.externalId).not.to.be.null;
      expect(firstItem.createdAt).not.to.be.null;
      expect(firstItem.createdBy).not.to.be.null;
      expect(firstItem.updatedAt).not.to.be.null;
      expect(firstItem.updatedBy).to.be.null;
      expect(firstItem.scheduledDate).not.to.be.null;

      // The underlying Approved Item
      expect(firstItem.approvedItem.externalId).not.to.be.null;
      expect(firstItem.approvedItem.title).not.to.be.null;
      expect(firstItem.approvedItem.url).not.to.be.null;
      expect(firstItem.approvedItem.excerpt).not.to.be.null;
      expect(firstItem.approvedItem.imageUrl).not.to.be.null;
      expect(firstItem.approvedItem.createdBy).not.to.be.null;
    });

    it('should group scheduled items by date', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_ITEMS,
        variables: {
          filters: {
            scheduledSurfaceGuid: 'NEW_TAB_EN_US',
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      const resultArray = result.data?.getScheduledCuratedCorpusItems;

      expect(resultArray[0].totalCount).to.equal(10);
      expect(resultArray[0].items).to.have.lengthOf(10);
      expect(resultArray[0].scheduledDate).to.equal('2025-05-05');

      expect(resultArray[1].totalCount).to.equal(5);
      expect(resultArray[1].items).to.have.lengthOf(5);
      expect(resultArray[1].scheduledDate).to.equal('2050-01-01');
    });

    it('should fail on invalid Scheduled Surface GUID', async () => {
      const invalidId = 'not-a-valid-id-by-any-means';

      const result = await server.executeOperation({
        query: GET_SCHEDULED_ITEMS,
        variables: {
          filters: {
            scheduledSurfaceGuid: invalidId,
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      expect(result.errors).not.to.be.null;

      // typescript needs this check bc result.errors _could_ be empty
      // (we check above to ensure it is not)
      if (result.errors) {
        expect(result.errors.length).to.equal(1);
        expect(result.errors[0].message).to.equal(
          'not-a-valid-id-by-any-means is not a valid Scheduled Surface GUID'
        );
      }
    });

    it('should fail on non-existent Scheduled Surface GUID', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_ITEMS,
        variables: {
          filters: {
            // can't believe graphql lets you pass an empty string for a required parameter
            scheduledSurfaceGuid: '',
            startDate: '2000-01-01',
            endDate: '2050-12-31',
          },
        },
      });

      expect(result.errors).not.to.be.null;

      // typescript needs this check bc result.errors _could_ be empty
      // (we check above to ensure it is not)
      if (result.errors) {
        expect(result.errors.length).to.equal(1);
        expect(result.errors[0].message).to.equal(
          ' is not a valid Scheduled Surface GUID'
        );
      }
    });
  });
});

import { expect } from 'chai';
import {
  clearDb,
  createApprovedItemHelper,
  createScheduledItemHelper,
} from '../../../test/helpers';
import { db, getServer } from '../../../test/public-server';
import { GET_SCHEDULED_SURFACE_WITH_ITEMS } from './sample-queries.gql';
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

  describe('ScheduledSurface->items subquery', () => {
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

      // Create another batch of approved items for a different scheduled surface GUID
      // but the same date as the first batch
      for (let i = 0; i < 7; i++) {
        const approvedItem = await createApprovedItemHelper(db, {
          title: `Batch 3, Story #${i + 1}`,
        });
        await createScheduledItemHelper(db, {
          scheduledSurfaceGuid: 'POCKET_HITS_EN_US',
          approvedItem,
          scheduledDate: new Date('2050-01-01').toISOString(),
        });
      }
    });

    it('should return all requested items', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_SURFACE_WITH_ITEMS,
        variables: {
          id: 'NEW_TAB_EN_US',
          date: '2050-01-01',
        },
      });

      // Good to check this here before we get into actual return values
      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      expect(result.data?.scheduledSurface.items).to.have.lengthOf(5);
    });

    it('should return items for requested scheduled surface only', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_SURFACE_WITH_ITEMS,
        variables: {
          id: 'POCKET_HITS_EN_US',
          date: '2050-01-01',
        },
      });

      // Good to check this here before we get into actual return values
      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      expect(result.data?.scheduledSurface.items).to.have.lengthOf(7);
    });

    it('should return all expected properties', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_SURFACE_WITH_ITEMS,
        variables: {
          id: 'NEW_TAB_EN_US',
          date: '2025-05-05',
        },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Let's check the props for the first ScheduledSurfaceItem returned.
      const item = result.data?.scheduledSurface.items[0];

      // Scalar properties of the first item
      expect(item.id).not.to.be.null;
      expect(item.surfaceId).to.equal('NEW_TAB_EN_US');
      expect(item.scheduledDate).to.equal('2025-05-05');

      // The underlying Corpus Item
      expect(item.corpusItem.id).not.to.be.null;
      expect(item.corpusItem.url).not.to.be.null;
      expect(item.corpusItem.title).not.to.be.null;
      expect(item.corpusItem.excerpt).not.to.be.null;
      expect(item.corpusItem.language).not.to.be.null;
      expect(item.corpusItem.imageUrl).not.to.be.null;
      expect(item.corpusItem.publisher).not.to.be.null;
    });

    it('should sort the items by updatedAt asc', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_SURFACE_WITH_ITEMS,
        variables: {
          id: 'NEW_TAB_EN_US',
          date: '2025-05-05',
        },
      });

      const items = result.data?.scheduledSurface.items;

      const updatedAtDates = items.map((item) => {
        return item.updatedAt;
      });

      const sortedUpdatedAtDates = updatedAtDates.sort();

      expect(updatedAtDates).to.deep.equal(sortedUpdatedAtDates);
    });

    it('should return an empty result set if nothing is available', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_SURFACE_WITH_ITEMS,
        variables: {
          id: 'NEW_TAB_EN_US',
          date: '2100-02-02',
        },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      expect(result.data?.scheduledSurface.items).to.have.lengthOf(0);
    });
  });
});

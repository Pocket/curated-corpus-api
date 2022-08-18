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

      // Create a few records without topics (to model backfilled data)
      for (let i = 0; i < 7; i++) {
        const approvedItem = await createApprovedItemHelper(db, {
          title: `Batch 4, Story #${i + 1}`,
          topic: undefined,
        });
        await createScheduledItemHelper(db, {
          scheduledSurfaceGuid: 'NEW_TAB_DE_DE',
          approvedItem,
          scheduledDate: new Date('3030-01-01').toISOString(),
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
      expect(result.errors).not.to.exist;
      expect(result.data).to.exist;

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
      expect(result.errors).not.to.exist;
      expect(result.data).to.exist;

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

      expect(result.errors).not.to.exist;
      expect(result.data).to.exist;

      // Let's check the props for the first ScheduledSurfaceItem returned.
      const item = result.data?.scheduledSurface.items[0];

      // Scalar properties of the first item
      expect(item.id).to.exist;
      expect(item.surfaceId).to.equal('NEW_TAB_EN_US');
      expect(item.scheduledDate).to.equal('2025-05-05');

      // The underlying Corpus Items
      result.data?.scheduledSurface.items.forEach((item) => {
        expect(item.corpusItem.id).to.exist;
        expect(item.corpusItem.url).to.exist;
        expect(item.corpusItem.title).to.exist;
        expect(item.corpusItem.excerpt).to.exist;
        expect(item.corpusItem.authors).to.exist;
        expect(item.corpusItem.language).to.exist;
        expect(item.corpusItem.imageUrl).to.exist;
        expect(item.corpusItem.image).to.exist;
        expect(item.corpusItem.image.url).to.exist;
        expect(item.corpusItem.imageUrl).to.equal(item.corpusItem.image.url);
        expect(item.corpusItem.publisher).to.exist;
        expect(item.corpusItem.topic).to.exist;
      });
    });

    it('should return an empty topic when the approved item has no topic', async () => {
      const result = await server.executeOperation({
        query: GET_SCHEDULED_SURFACE_WITH_ITEMS,
        variables: {
          id: 'NEW_TAB_DE_DE',
          date: '3030-01-01',
        },
      });

      result.data?.scheduledSurface.items.forEach((item) => {
        expect(item.corpusItem.topic).not.to.exist;
      });
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

      expect(result.errors).not.to.exist;
      expect(result.data).to.exist;

      expect(result.data?.scheduledSurface.items).to.have.lengthOf(0);
    });
  });
});

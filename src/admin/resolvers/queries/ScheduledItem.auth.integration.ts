import { expect } from 'chai';
import {
  clearDb,
  createApprovedItemHelper,
  createScheduledItemHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { db } from '../../../test/admin-server';
import { GET_SCHEDULED_ITEMS } from './sample-queries.gql';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { ACCESS_DENIED_ERROR, MozillaAccessGroup } from '../../../shared/types';

describe('queries: ScheduledCuratedCorpusItem - authentication', () => {
  beforeAll(async () => {
    await clearDb(db);

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

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getScheduledCuratedCorpusItems query', () => {
    it('should get all items when the user has read-only access', async () => {
      // adding headers with groups with read-only access
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(
        headers,
        new CuratedCorpusEventEmitter()
      );

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
      expect(resultArray).to.have.lengthOf(2);
      expect(resultArray[0].totalCount).to.equal(10);
      expect(resultArray[0].items).to.have.lengthOf(10);
    });

    it('should get all items when user the has only one scheduled surface access', async () => {
      // adding headers with groups with DE_DE surface access only
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_DEDE}`,
      };

      const server = getServerWithMockedHeaders(
        headers,
        new CuratedCorpusEventEmitter()
      );

      // even though user has access for DE_DE only, a request for EN_US should work
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
      expect(resultArray).to.have.lengthOf(2);
      expect(resultArray[0].totalCount).to.equal(10);
      expect(resultArray[0].items).to.have.lengthOf(10);
    });

    it('should throw an error when user does not have the required access', async () => {
      // Set up auth headers with no valid access group
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

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

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.undefined;

      // check if the error we get is access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');

      await server.stop();
    });

    it('should throw an error when request header groups are undefined', async () => {
      // Set up auth headers with no valid access group
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: undefined,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

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

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.undefined;

      // check if the error we get is access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');

      await server.stop();
    });
  });
});

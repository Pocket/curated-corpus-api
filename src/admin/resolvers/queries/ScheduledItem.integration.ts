import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import {
  clearDb,
  createApprovedItemHelper,
  createScheduledItemHelper,
} from '../../../test/helpers';
import { GET_SCHEDULED_ITEMS } from './sample-queries.gql';
import { MozillaAccessGroup } from '../../../shared/types';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('queries: ScheduledCorpusItem', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, adminServer: server, adminUrl: graphQLUrl } = await startServer(0));
    db = client();
    await clearDb(db);
  });

  afterAll(async () => {
    await server.stop();
    await db.$disconnect();
  });

  // adding headers with groups that grant full access
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${MozillaAccessGroup.SCHEDULED_SURFACE_CURATOR_FULL}`,
  };

  describe('getScheduledCorpusItems query', () => {
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
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_SCHEDULED_ITEMS),
          variables: {
            filters: {
              scheduledSurfaceGuid: 'NEW_TAB_EN_US',
              startDate: '2000-01-01',
              endDate: '2050-12-31',
            },
          },
        });

      // Good to check this here before we get into actual return values
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.not.be.null;

      const resultArray = result.body.data?.getScheduledCorpusItems;
      expect(resultArray).to.have.lengthOf(2);
      expect(resultArray[0].totalCount).to.equal(10);
      expect(resultArray[0].items).to.have.lengthOf(10);
    });

    it('should return all expected properties', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_SCHEDULED_ITEMS),
          variables: {
            filters: {
              scheduledSurfaceGuid: 'NEW_TAB_EN_US',
              startDate: '2000-01-01',
              endDate: '2050-12-31',
            },
          },
        });

      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.not.be.null;

      const resultArray = result.body.data?.getScheduledCorpusItems;

      // Check the first group of scheduled items
      expect(resultArray[0].collectionCount).to.exist;
      expect(resultArray[0].syndicatedCount).to.exist;
      expect(resultArray[0].totalCount).to.exist;
      expect(resultArray[0].scheduledDate).to.exist;

      // Check the first item in the first group
      const firstItem = resultArray[0].items[0];

      // Scalar properties
      expect(firstItem.externalId).to.exist;
      expect(firstItem.createdAt).to.exist;
      expect(firstItem.createdBy).to.exist;
      expect(firstItem.updatedAt).to.exist;
      expect(firstItem.updatedBy).to.not.exist;
      expect(firstItem.scheduledDate).to.exist;

      // The underlying Approved Item
      expect(firstItem.approvedItem.externalId).to.exist;
      expect(firstItem.approvedItem.title).to.exist;
      expect(firstItem.approvedItem.url).to.exist;
      expect(firstItem.approvedItem.excerpt).to.exist;
      expect(firstItem.approvedItem.imageUrl).to.exist;
      expect(firstItem.approvedItem.createdBy).to.exist;
    });

    it('should group scheduled items by date', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_SCHEDULED_ITEMS),
          variables: {
            filters: {
              scheduledSurfaceGuid: 'NEW_TAB_EN_US',
              startDate: '2000-01-01',
              endDate: '2050-12-31',
            },
          },
        });

      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.not.be.null;

      const resultArray = result.body.data?.getScheduledCorpusItems;

      expect(resultArray[0].totalCount).to.equal(10);
      expect(resultArray[0].items).to.have.lengthOf(10);
      expect(resultArray[0].scheduledDate).to.equal('2025-05-05');

      expect(resultArray[1].totalCount).to.equal(5);
      expect(resultArray[1].items).to.have.lengthOf(5);
      expect(resultArray[1].scheduledDate).to.equal('2050-01-01');
    });

    it('should sort items by scheduleDate asc and updatedAt asc', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_SCHEDULED_ITEMS),
          variables: {
            filters: {
              scheduledSurfaceGuid: 'NEW_TAB_EN_US',
              startDate: '2050-01-01',
              endDate: '2050-01-01',
            },
          },
        });

      const resultArray = result.body.data?.getScheduledCorpusItems;

      // get an array of the createdAt values in the order they were returned
      const updatedAtDates = resultArray[0].items.map((item) => {
        return item.updatedAt;
      });

      // sort those createdAt values
      const sortedUpdatedAtDates = updatedAtDates.sort();

      // the returned order should match the sorted order
      expect(updatedAtDates).to.deep.equal(sortedUpdatedAtDates);
    });

    it('should fail on invalid Scheduled Surface GUID', async () => {
      const invalidId = 'not-a-valid-id-by-any-means';

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_SCHEDULED_ITEMS),
          variables: {
            filters: {
              scheduledSurfaceGuid: invalidId,
              startDate: '2000-01-01',
              endDate: '2050-12-31',
            },
          },
        });

      expect(result.body.errors).to.not.be.undefined;

      expect(result.body.errors?.length).to.equal(1);
      expect(result.body.errors?.[0].message).to.equal(
        'not-a-valid-id-by-any-means is not a valid Scheduled Surface GUID'
      );
    });

    it('should fail on non-existent Scheduled Surface GUID', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_SCHEDULED_ITEMS),
          variables: {
            filters: {
              // can't believe graphql lets you pass an empty string for a required parameter
              scheduledSurfaceGuid: '',
              startDate: '2000-01-01',
              endDate: '2050-12-31',
            },
          },
        });

      expect(result.body.errors).to.not.be.undefined;

      expect(result.body.errors?.length).to.equal(1);
      expect(result.body.errors?.[0].message).to.equal(
        ' is not a valid Scheduled Surface GUID'
      );
    });
  });
});

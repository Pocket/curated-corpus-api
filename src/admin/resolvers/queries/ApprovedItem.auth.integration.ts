import { expect } from 'chai';
import { CuratedStatus } from '@prisma/client';
import { ACCESS_DENIED_ERROR, MozillaAccessGroup } from '../../../shared/types';
import { db } from '../../../test/admin-server';
import {
  clearDb,
  createApprovedItemHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import {
  GET_APPROVED_ITEMS,
  GET_APPROVED_ITEM_BY_URL,
} from './sample-queries.gql';

describe('queries: ApprovedCorpusItem - authentication', () => {
  beforeAll(async () => {
    // clear out db to start fresh
    await clearDb(db);

    // Create some items
    const stories = [
      {
        title: 'How To Win Friends And Influence People with GraphQL',
        language: 'EN',
        status: CuratedStatus.RECOMMENDATION,
        topic: 'FOOD',
      },
      {
        title: 'What Zombies Can Teach You About GraphQL',
        language: 'EN',
        status: CuratedStatus.RECOMMENDATION,
        url: 'https://www.sample-domain/what-zombies-can-teach-you-graphql',
        topic: 'TECHNOLOGY',
      },
      {
        title: 'How To Make Your Product Stand Out With GraphQL',
        language: 'EN',
        status: CuratedStatus.RECOMMENDATION,
        topic: 'TECHNOLOGY',
      },
    ];

    // insert test stories into the db
    for (const story of stories) {
      await createApprovedItemHelper(db, story);
    }
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getApprovedCorpusItems query', () => {
    it('should get all items when user has read-only access', async () => {
      // Set up auth headers with read-only access
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // should return all 3 items
      expect(result.data?.getApprovedCorpusItems.edges).to.have.length(3);

      await server.stop();
    });

    it('should get all items when user has only one scheduled surface access', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // should return all 3 items
      expect(result.data?.getApprovedCorpusItems.edges).to.have.length(3);

      await server.stop();
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
        query: GET_APPROVED_ITEMS,
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
        query: GET_APPROVED_ITEMS,
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.undefined;

      // check if the error we get is access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');

      await server.stop();
    });
  });

  describe('getApprovedCorpusItemByUrl query', () => {
    it('should get item when user has read-only access', async () => {
      // Set up auth headers with read-only access
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: 'https://www.test.com/story-two',
        },
      });

      expect(result.data).not.to.be.null;
      expect(result.errors).to.be.undefined;

      await server.stop();
    });

    it('should get item when user has only one scheduled surface access', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: 'https://www.test.com/story-two',
        },
      });

      expect(result.data).not.to.be.null;
      expect(result.errors).to.be.undefined;

      await server.stop();
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
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: 'https://www.test.com/story-two',
        },
      });

      expect(result.data?.getApprovedCorpusItemByUrl).to.be.null;

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
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: 'https://www.test.com/story-two',
        },
      });

      expect(result.data?.getApprovedCorpusItemByUrl).to.be.null;

      expect(result.errors).not.to.be.undefined;
      // check if the error we get is access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');

      await server.stop();
    });
  });
});

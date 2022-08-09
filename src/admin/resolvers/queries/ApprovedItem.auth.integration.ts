import { expect } from 'chai';
import { ApprovedItem, CuratedStatus } from '@prisma/client';
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
  GET_APPROVED_ITEM_BY_EXTERNAL_ID,
} from './sample-queries.gql';

describe('queries: approvedCorpusItem - authentication', () => {
  // Save the sample items in a variable so that we can access their
  // auto-generated props such as `externalId` in tests
  const items: ApprovedItem[] = [];

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
      const item = await createApprovedItemHelper(db, story);
      items.push(item);
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

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // should return all 3 items
      expect(result.data?.getApprovedCorpusItems.edges).to.have.length(3);
    });

    it('should get all items when user has only one scheduled surface access', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // should return all 3 items
      expect(result.data?.getApprovedCorpusItems.edges).to.have.length(3);
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

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.undefined;

      // check if the error we get is access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');
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

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: 'https://www.test.com/story-two',
        },
      });

      expect(result.data).not.to.be.null;
      expect(result.errors).to.be.undefined;
    });

    it('should get item when user has only one scheduled surface access', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: 'https://www.test.com/story-two',
        },
      });

      expect(result.data).not.to.be.null;
      expect(result.errors).to.be.undefined;
    });

    it('should throw an error when user does not have the required access', async () => {
      // Set up auth headers with no valid access group
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

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
    });

    it('should throw an error when request header groups are undefined', async () => {
      // Set up auth headers with no valid access group
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: undefined,
      };

      const server = getServerWithMockedHeaders(headers);

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
    });
  });

  describe('approvedCorpusItem query', () => {
    it('should get item when user has read-only access', async () => {
      // Set up auth headers with read-only access
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_EXTERNAL_ID,
        variables: {
          externalId: items[0].externalId,
        },
      });

      expect(result.data).not.to.be.null;
      expect(result.errors).to.be.undefined;
    });

    it('should get item when user has only one scheduled surface access', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_EXTERNAL_ID,
        variables: {
          externalId: items[1].externalId,
        },
      });

      expect(result.data).not.to.be.null;
      expect(result.errors).to.be.undefined;
    });

    it('should throw an error when user does not have the required access', async () => {
      // Set up auth headers with no valid access group
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_EXTERNAL_ID,
        variables: {
          externalId: items[2].externalId,
        },
      });

      expect(result.data?.approvedCorpusItem).to.be.null;
      expect(result.errors).not.to.be.undefined;

      // check if the error we get is access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');
    });

    it('should throw an error when request header groups are undefined', async () => {
      // Set up auth headers with no valid access group
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: undefined,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_EXTERNAL_ID,
        variables: {
          externalId: items[0].externalId,
        },
      });

      expect(result.data?.approvedCorpusItem).to.be.null;
      expect(result.errors).not.to.be.undefined;

      // check if the error we get is access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');
    });
  });
});

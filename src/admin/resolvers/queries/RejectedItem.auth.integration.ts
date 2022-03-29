import { db } from '../../../test/admin-server';
import {
  clearDb,
  createRejectedCuratedCorpusItemHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { ACCESS_DENIED_ERROR, MozillaAccessGroup } from '../../../shared/types';
import { GET_REJECTED_ITEMS } from './sample-queries.gql';
import { expect } from 'chai';

describe('queries: RejectedCorpusItem (authentication)', () => {
  // A few sample Rejected Corpus items - we don't need a lot of these
  // for auth checks
  const rejectedCorpusItems = [
    {
      title: '10 Unforgivable Sins Of PHP',
    },
    {
      title: 'Take The Stress Out Of PHP',
    },
    {
      title: 'The Untold Secret To Mastering PHP In Just 3 Days',
    },
    {
      title: 'You Can Thank Us Later - 3 Reasons To Stop Thinking About PHP',
    },
  ];

  let headers: {
    name: string | undefined;
    username: string | undefined;
    groups: string | undefined;
  } = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: undefined,
  };

  beforeAll(async () => {
    await clearDb(db);

    for (const item of rejectedCorpusItems) {
      await createRejectedCuratedCorpusItemHelper(db, item);
    }
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getRejectedCorpusItem query', () => {
    it('should get all items when user has read-only access', async () => {
      // Set up auth headers with read-only access
      headers = {
        ...headers,
        groups: `this,that,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const result = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // should return all four items - the entire corpus should be accessible
      expect(result.data?.getRejectedCorpusItems.edges).to.have.length(4);

      await server.stop();
    });

    it('should get all items when user has only one scheduled surface access', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      headers = {
        ...headers,
        groups: `this,that,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const result = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // should return all four items - the entire corpus should be accessible
      expect(result.data?.getRejectedCorpusItems.edges).to.have.length(4);

      await server.stop();
    });

    it('should throw an error when user does not have the required access', async () => {
      // Set up auth headers with no valid access group
      headers = {
        ...headers,
        groups: `this,that`,
      };
      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const result = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.undefined;

      // check if the error we get is the access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');

      await server.stop();
    });

    it('should throw an error when request access groups are undefined', async () => {
      // Set up auth headers with no access groups whatsoever (the default
      // on top of the `describe()` block for Rejected Item queries).
      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const result = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.undefined;

      // check if the error we get is the access denied error
      expect(result.errors?.[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors?.[0].extensions?.code).to.equal('UNAUTHENTICATED');

      await server.stop();
    });
  });
});

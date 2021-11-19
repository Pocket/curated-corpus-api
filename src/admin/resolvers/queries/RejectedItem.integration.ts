import { expect } from 'chai';
import { RejectedCuratedCorpusItem as dbRejectedCuratedCorpusItem } from '@prisma/client';
import { db, server } from '../../../test/admin-server';
import {
  clearDb,
  createRejectedCuratedCorpusItemHelper,
} from '../../../test/helpers';
import { GET_REJECTED_ITEMS } from '../../../test/admin-server/queries.gql';

describe('queries: RejectedCuratedCorpusItem', () => {
  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('getRejectedCuratedCorpusItem query', () => {
    // Fake sample Rejected Curated Corpus items
    const rejectedCuratedCorpusItems = [
      {
        title: '10 Unforgivable Sins Of PHP',
        language: 'en',
        reason: 'fake reason',
      },
      {
        title: 'Take The Stress Out Of PHP',
        language: 'en',
        url: 'https://www.sample-domain/take-the-stress-out-of-php',
        topic: 'Technology',
      },
      {
        title: 'The Untold Secret To Mastering PHP In Just 3 Days',
        language: 'en',
        topic: 'Technology',
      },
      {
        title: 'You Can Thank Us Later - 3 Reasons To Stop Thinking About PHP',
        language: 'en',
      },
      {
        title: 'Why Ignoring PHP Will Cost You Time and Sales',
        language: 'en',
      },
      {
        title: 'PHP: This Is What Professionals Do',
        language: 'en',
      },
      {
        title: 'All About Cake PHP',
        language: 'en',
      },
      {
        title: "Are You Embarrassed By Your PHP Skills? Here's What To Do",
        language: 'de',
      },
      {
        title: 'Proof That PHP Is Exactly What You Are Looking For',
        language: 'de',
      },
      {
        title: 'Learn Laravel in 10 days',
        language: 'de',
      },
    ];

    beforeAll(async () => {
      for (const item of rejectedCuratedCorpusItems) {
        await createRejectedCuratedCorpusItemHelper(db, item);
      }
    });

    it('should get all items when number of requested items is greater than total items', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { first: 20 },
        },
      });

      expect(data?.getRejectedCuratedCorpusItems.edges).to.have.length(
        rejectedCuratedCorpusItems.length
      );
      expect(data?.getRejectedCuratedCorpusItems.totalCount).to.equal(
        rejectedCuratedCorpusItems.length
      );
    });

    it('should correctly sort items by createdAt when using default sort', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
      });

      const firstItem = data?.getRejectedCuratedCorpusItems.edges[0].node;
      const secondItem = data?.getRejectedCuratedCorpusItems.edges[1].node;

      expect(firstItem.createdAt).to.be.greaterThan(secondItem.createdAt);
    });

    it('should return all available properties of an rejected curated corpus item', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { first: 1 },
        },
      });

      const firstItem: dbRejectedCuratedCorpusItem =
        data?.getRejectedCuratedCorpusItems.edges[0].node;
      // The important thing to test here is that the query returns all of these
      // properties without falling over, and not that they hold any specific value.
      expect(firstItem.externalId).to.be.not.undefined;
      expect(firstItem.prospectId).to.be.not.undefined;
      expect(firstItem.title).to.be.not.undefined;
      expect(firstItem.language).to.be.not.undefined;
      expect(firstItem.publisher).to.be.not.undefined;
      expect(firstItem.url).to.be.not.undefined;
      expect(firstItem.topic).to.be.not.undefined;
      expect(firstItem.reason).to.be.not.undefined;
      expect(firstItem.createdAt).to.be.not.undefined;
      expect(firstItem.createdBy).to.be.not.undefined;
    });

    it('should return correct paginated results', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { first: 2 },
        },
      });

      // We expect to get two results back
      expect(data?.getRejectedCuratedCorpusItems.edges).to.have.length(2);
    });

    it('should return a PageInfo object', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { first: 5 },
        },
      });

      const pageInfo = data?.getRejectedCuratedCorpusItems.pageInfo;
      expect(pageInfo.hasNextPage).to.equal(true);
      expect(pageInfo.hasPreviousPage).to.equal(false);
      expect(pageInfo.startCursor).to.be.a('string');
      expect(pageInfo.endCursor).to.be.a('string');
    });
    it('should return after cursor without overfetching', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { first: 4 },
        },
      });

      const cursor = data?.getRejectedCuratedCorpusItems.edges[3].cursor;

      const { data: nextPageData } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { first: 4, after: cursor },
        },
      });

      expect(nextPageData?.getRejectedCuratedCorpusItems.edges)
        .to.be.an('array')
        .that.does.not.contain({ cursor });
    });

    it('should return before cursor without overfetching', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { last: 4 },
        },
      });

      const cursor = data?.getRejectedCuratedCorpusItems.edges[0].cursor;

      const { data: prevPageData } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { last: 4, before: cursor },
        },
      });

      expect(prevPageData?.getRejectedCuratedCorpusItems.edges)
        .to.be.an('array')
        .that.does.not.contain({ cursor });
    });

    it('should filter by language', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: { language: 'de' },
        },
      });

      const germanItems = rejectedCuratedCorpusItems.filter(
        (item) => item.language === 'de'
      );
      // we only have three stories in German set up before each test
      expect(data?.getRejectedCuratedCorpusItems.edges).to.have.length(
        germanItems.length
      );
      // make sure the total count is not _all_ results, i.e. 10, but only three
      expect(data?.getRejectedCuratedCorpusItems.totalCount).to.equal(
        germanItems.length
      );
    });

    it('should filter by story title', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: { title: 'laravel' },
        },
      });

      // we only have one story with "laravel" in the title
      expect(data?.getRejectedCuratedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getRejectedCuratedCorpusItems.totalCount).to.equal(1);
    });

    it('should filter by topic', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: { topic: 'Technology' },
        },
      });

      // we only have two stories categorized as "Technology"
      expect(data?.getRejectedCuratedCorpusItems.edges).to.have.length(2);

      // make sure total results value is correct
      expect(data?.getRejectedCuratedCorpusItems.totalCount).to.equal(2);
    });

    it('should filter by story URL', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: { url: 'sample-domain' },
        },
      });

      // expect to see just the one story with the above domain
      expect(data?.getRejectedCuratedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getRejectedCuratedCorpusItems.totalCount).to.equal(1);
    });

    it('should filter url, title, topic and language', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: {
            url: 'sample-domain',
            title: 'PHP',
            topic: 'Technology',
            language: 'en',
          },
        },
      });

      // expect to see just the one story
      expect(data?.getRejectedCuratedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getRejectedCuratedCorpusItems.totalCount).to.equal(1);
    });
  });
});

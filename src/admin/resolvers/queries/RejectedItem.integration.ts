import { expect } from 'chai';
import { RejectedCuratedCorpusItem as dbRejectedCuratedCorpusItem } from '@prisma/client';
import { db } from '../../../test/admin-server';
import {
  clearDb,
  createRejectedCuratedCorpusItemHelper,
} from '../../../test/helpers';
import {
  GET_REJECTED_ITEMS,
  REJECTED_ITEM_REFERENCE_RESOLVER,
} from './sample-queries.gql';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { MozillaAccessGroup } from '../../../shared/types';
import { getServerWithMockedHeaders } from '../../../test/helpers/getServerWithMockedHeaders';

describe('queries: RejectedCorpusItem', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
  };

  const server = getServerWithMockedHeaders(
    headers,
    new CuratedCorpusEventEmitter()
  );

  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('getRejectedCorpusItem query', () => {
    // Fake sample Rejected Curated Corpus items
    const rejectedCuratedCorpusItems = [
      {
        title: '10 Unforgivable Sins Of PHP',
        language: 'EN',
        reason: 'fake reason',
      },
      {
        title: 'Take The Stress Out Of PHP',
        language: 'EN',
        url: 'https://www.sample-domain/take-the-stress-out-of-php',
        topic: 'Technology',
      },
      {
        title: 'The Untold Secret To Mastering PHP In Just 3 Days',
        language: 'EN',
        topic: 'Technology',
      },
      {
        title: 'You Can Thank Us Later - 3 Reasons To Stop Thinking About PHP',
        language: 'EN',
      },
      {
        title: 'Why Ignoring PHP Will Cost You Time and Sales',
        language: 'EN',
      },
      {
        title: 'PHP: This Is What Professionals Do',
        language: 'EN',
      },
      {
        title: 'All About Cake PHP',
        language: 'EN',
      },
      {
        title: "Are You Embarrassed By Your PHP Skills? Here's What To Do",
        language: 'DE',
      },
      {
        title: 'Proof That PHP Is Exactly What You Are Looking For',
        language: 'DE',
      },
      {
        title: 'Learn Laravel in 10 days',
        language: 'DE',
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

      expect(data?.getRejectedCorpusItems.edges).to.have.length(
        rejectedCuratedCorpusItems.length
      );
      expect(data?.getRejectedCorpusItems.totalCount).to.equal(
        rejectedCuratedCorpusItems.length
      );
    });

    it('should correctly sort items by createdAt when using default sort', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
      });

      const firstItem = data?.getRejectedCorpusItems.edges[0].node;
      const secondItem = data?.getRejectedCorpusItems.edges[1].node;

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
        data?.getRejectedCorpusItems.edges[0].node;
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
      expect(data?.getRejectedCorpusItems.edges).to.have.length(2);
    });

    it('should return a PageInfo object', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { first: 5 },
        },
      });

      const pageInfo = data?.getRejectedCorpusItems.pageInfo;
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

      const cursor = data?.getRejectedCorpusItems.edges[3].cursor;

      const { data: nextPageData } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { first: 4, after: cursor },
        },
      });

      expect(nextPageData?.getRejectedCorpusItems.edges)
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

      const cursor = data?.getRejectedCorpusItems.edges[0].cursor;

      const { data: prevPageData } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          pagination: { last: 4, before: cursor },
        },
      });

      expect(prevPageData?.getRejectedCorpusItems.edges)
        .to.be.an('array')
        .that.does.not.contain({ cursor });
    });

    it('should filter by language', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: { language: 'DE' },
        },
      });

      const germanItems = rejectedCuratedCorpusItems.filter(
        (item) => item.language === 'DE'
      );
      // we only have three stories in German set up before each test
      expect(data?.getRejectedCorpusItems.edges).to.have.length(
        germanItems.length
      );
      // make sure the total count is not _all_ results, i.e. 10, but only three
      expect(data?.getRejectedCorpusItems.totalCount).to.equal(
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
      expect(data?.getRejectedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getRejectedCorpusItems.totalCount).to.equal(1);
    });

    it('should filter by topic', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: { topic: 'Technology' },
        },
      });

      // we only have two stories categorized as "Technology"
      expect(data?.getRejectedCorpusItems.edges).to.have.length(2);

      // make sure total results value is correct
      expect(data?.getRejectedCorpusItems.totalCount).to.equal(2);
    });

    it('should filter by story URL', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: { url: 'sample-domain' },
        },
      });

      // expect to see just the one story with the above domain
      expect(data?.getRejectedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getRejectedCorpusItems.totalCount).to.equal(1);
    });

    it('should filter url, title, topic and language', async () => {
      const { data } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
        variables: {
          filters: {
            url: 'sample-domain',
            title: 'PHP',
            topic: 'Technology',
            language: 'EN',
          },
        },
      });

      // expect to see just the one story
      expect(data?.getRejectedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getRejectedCorpusItems.totalCount).to.equal(1);
    });
  });

  describe('RejectedItem reference resolver', () => {
    beforeAll(async () => {
      // Create a few items with known URLs.
      const storyInput = [
        {
          title: 'Story one',
          url: 'https://www.sample-domain.com/what-zombies-can-teach-you-graphql',
          language: 'EN',
          reason: 'fake reason',
        },
        {
          title: 'Story two',
          url: 'https://www.test2.com/story-two',
          language: 'EN',
          reason: 'fake reason',
        },
        {
          title: 'Story three',
          url: 'https://www.test2.com/story-three',
          language: 'EN',
          reason: 'fake reason',
        },
        {
          title: 'Story four',
          url: 'https://www.test2.com/story-four',
          language: 'EN',
          reason: 'fake reason',
        },
        {
          title: 'Story five',
          url: 'https://www.test2.com/story-five',
          language: 'EN',
          reason: 'fake reason',
        },
        {
          title: 'Story six',
          url: 'https://www.test2.com/story-six',
          language: 'EN',
          reason: 'fake reason',
        },
        {
          title: 'Story seven',
          url: 'https://www.test2.com/story-seven',
          language: 'EN',
          reason: 'fake reason',
        },
      ];

      for (const input of storyInput) {
        await createRejectedCuratedCorpusItemHelper(db, input);
      }
    });

    it('returns the rejected item if it exists', async () => {
      const result = await server.executeOperation({
        query: REJECTED_ITEM_REFERENCE_RESOLVER,
        variables: {
          representations: [
            {
              __typename: 'RejectedCorpusItem',
              url: 'https://www.test2.com/story-three',
            },
          ],
        },
      });

      expect(result.errors).to.be.undefined;

      expect(result.data).to.not.be.null;
      expect(result.data?._entities).to.have.lengthOf(1);
    });

    it('returns multiple items in the correct order', async () => {
      const result = await server.executeOperation({
        query: REJECTED_ITEM_REFERENCE_RESOLVER,
        variables: {
          representations: [
            {
              __typename: 'RejectedCorpusItem',
              url: 'https://www.test2.com/story-seven',
            },
            {
              __typename: 'RejectedCorpusItem',
              url: 'https://www.test2.com/story-three',
            },
            {
              __typename: 'RejectedCorpusItem',
              url: 'https://www.sample-domain.com/what-zombies-can-teach-you-graphql',
            },
            {
              __typename: 'RejectedCorpusItem',
              url: 'https://www.test2.com/story-two',
            },
          ],
        },
      });

      expect(result.errors).to.be.undefined;

      expect(result.data).to.not.be.null;
      expect(result.data?._entities).to.have.lengthOf(4);
      expect(result.data?._entities[0].url).to.equal(
        'https://www.test2.com/story-seven'
      );
      expect(result.data?._entities[1].url).to.equal(
        'https://www.test2.com/story-three'
      );
      expect(result.data?._entities[2].url).to.equal(
        'https://www.sample-domain.com/what-zombies-can-teach-you-graphql'
      );
      expect(result.data?._entities[3].url).to.equal(
        'https://www.test2.com/story-two'
      );
    });
  });
});

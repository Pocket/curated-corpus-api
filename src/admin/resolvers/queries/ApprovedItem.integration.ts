import { expect } from 'chai';
import { CuratedStatus } from '@prisma/client';
import { db, getServer } from '../../../test/admin-server';
import { clearDb, createApprovedItemHelper } from '../../../test/helpers';
import {
  GET_APPROVED_ITEM_BY_URL,
  GET_APPROVED_ITEMS,
} from './sample-queries.gql';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';

describe('queries: ApprovedCuratedCorpusItem', () => {
  const server = getServer(new CuratedCorpusEventEmitter());

  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('getApprovedCuratedCorpusItems query', () => {
    beforeAll(async () => {
      // Create some items
      const stories = [
        {
          title: 'How To Win Friends And Influence People with GraphQL',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
          topic: 'FOOD',
        },
        {
          title: 'What Zombies Can Teach You About GraphQL',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
          url: 'https://www.sample-domain/what-zombies-can-teach-you-graphql',
          topic: 'TECHNOLOGY',
        },
        {
          title: 'How To Make Your Product Stand Out With GraphQL',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
          topic: 'TECHNOLOGY',
        },
        {
          title: 'How To Get Fabulous GraphQL On A Tight Budget',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
          topic: 'FOOD',
        },
        {
          title: 'Death, GraphQL And Taxes',
          language: 'en',
          status: CuratedStatus.CORPUS,
          topic: 'ENTERTAINMENT',
        },
        {
          title: '22 Tips To Start Building A GraphQL You Always Wanted',
          language: 'en',
          status: CuratedStatus.CORPUS,
          topic: 'POLITICS',
        },
        {
          title: '5 Ways You Can Get More GraphQL While Spending Less',
          language: 'en',
          status: CuratedStatus.CORPUS,
          topic: 'POLITICS',
        },
        {
          title:
            "Are You Embarrassed By Your GraphQL Skills? Here's What To Do",
          language: 'de',
          status: CuratedStatus.CORPUS,
          topic: 'FOOD',
        },
        {
          title: 'Proof That GraphQL Is Exactly What You Are Looking For',
          language: 'de',
          status: CuratedStatus.CORPUS,
          topic: 'TRAVEL',
        },
        {
          title: 'If You Do Not Do GraphQL Now, You Will Hate Yourself Later',
          language: 'de',
          status: CuratedStatus.CORPUS,
          topic: 'TRAVEL',
        },
      ];

      for (const story of stories) {
        await createApprovedItemHelper(db, story);
      }
    });

    it('should get all requested items', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 20 },
        },
      });

      expect(data?.getApprovedCuratedCorpusItems.edges).to.have.length(10);
      expect(data?.getApprovedCuratedCorpusItems.totalCount).to.equal(10);

      // Check default sorting - createdAt.DESC
      const firstItem = data?.getApprovedCuratedCorpusItems.edges[0].node;
      const secondItem = data?.getApprovedCuratedCorpusItems.edges[1].node;
      expect(firstItem.createdAt > secondItem.createdAt).to.be.true;
    });

    it('should get all available properties of curated items', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 1 },
        },
      });

      const firstItem = data?.getApprovedCuratedCorpusItems.edges[0].node;
      // The important thing to test here is that the query returns all of these
      // properties without falling over, and not that they hold any specific value.
      expect(firstItem.externalId).to.be.not.undefined;
      expect(firstItem.prospectId).to.be.not.undefined;
      expect(firstItem.title).to.be.not.undefined;
      expect(firstItem.language).to.be.not.undefined;
      expect(firstItem.publisher).to.be.not.undefined;
      expect(firstItem.url).to.be.not.undefined;
      expect(firstItem.imageUrl).to.be.not.undefined;
      expect(firstItem.excerpt).to.be.not.undefined;
      expect(firstItem.status).to.be.not.undefined;
      expect(firstItem.topic).to.be.not.undefined;
      expect(firstItem.isCollection).to.be.a('boolean');
      expect(firstItem.isShortLived).to.be.a('boolean');
      expect(firstItem.isSyndicated).to.be.a('boolean');
    });

    it('should respect pagination', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 2 },
        },
      });

      // We expect to get two results back
      expect(data?.getApprovedCuratedCorpusItems.edges).to.have.length(2);
    });

    it('should return a PageInfo object', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 5 },
        },
      });

      const pageInfo = data?.getApprovedCuratedCorpusItems.pageInfo;
      expect(pageInfo.hasNextPage).to.equal(true);
      expect(pageInfo.hasPreviousPage).to.equal(false);
      expect(pageInfo.startCursor).to.be.a('string');
      expect(pageInfo.endCursor).to.be.a('string');
    });

    it('should return after cursor without overfetching', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 4 },
        },
      });

      const cursor = data?.getApprovedCuratedCorpusItems.edges[3].cursor;

      const { data: nextPageData } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 4, after: cursor },
        },
      });

      expect(nextPageData?.getApprovedCuratedCorpusItems.edges)
        .to.be.an('array')
        .that.does.not.contain({ cursor });
    });

    it('should return before cursor without overfetching', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { last: 4 },
        },
      });

      const cursor = data?.getApprovedCuratedCorpusItems.edges[0].cursor;

      const { data: prevPageData } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { last: 4, before: cursor },
        },
      });

      expect(prevPageData?.getApprovedCuratedCorpusItems.edges)
        .to.be.an('array')
        .that.does.not.contain({ cursor });
    });

    it('should filter by language', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { language: 'de' },
        },
      });

      // we only have three stories in German set up before each test
      expect(data?.getApprovedCuratedCorpusItems.edges).to.have.length(3);
      // make sure the total count is not _all_ results, i.e. 10, but only three
      expect(data?.getApprovedCuratedCorpusItems.totalCount).to.equal(3);
    });

    it('should filter by story title', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { title: 'ZoMbIeS' },
        },
      });

      // we only have one story with "Zombies" in the title
      expect(data?.getApprovedCuratedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getApprovedCuratedCorpusItems.totalCount).to.equal(1);
    });

    it('should filter by topic', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { topic: 'TeChNoLoGy' },
        },
      });

      // we only have two stories categorised as "Technology"
      expect(data?.getApprovedCuratedCorpusItems.edges).to.have.length(2);

      // make sure total results value is correct
      expect(data?.getApprovedCuratedCorpusItems.totalCount).to.equal(2);
    });

    it('should filter by curated status', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { status: CuratedStatus.CORPUS },
        },
      });

      // expect to see six stories added to the corpus as second-tier recommendations
      expect(data?.getApprovedCuratedCorpusItems.edges).to.have.length(6);
      // make sure total results value is correct
      expect(data?.getApprovedCuratedCorpusItems.totalCount).to.equal(6);
    });

    it('should filter by story URL', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { url: 'sample-domain' },
        },
      });

      // expect to see just the one story with the above domain
      expect(data?.getApprovedCuratedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getApprovedCuratedCorpusItems.totalCount).to.equal(1);
    });

    it('should filter by several parameters', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: {
            url: 'sample-domain',
            title: 'zombies',
            topic: 'TECHNOLOGY',
            language: 'en',
            status: CuratedStatus.RECOMMENDATION,
          },
        },
      });

      // expect to see just the one story
      expect(data?.getApprovedCuratedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getApprovedCuratedCorpusItems.totalCount).to.equal(1);
    });
  });

  describe('getApprovedCuratedCorpusItems query', () => {
    beforeAll(async () => {
      // Create a few items with known URLs.
      const storyInput = [
        {
          title: 'Story one',
          url: 'https://www.sample-domain.com/what-zombies-can-teach-you-graphql',
        },
        {
          title: 'Story two',
          url: 'https://www.test.com/story-two',
        },
        {
          title: 'Story three',
          url: 'https://www.test1.com/story-three',
        },
      ];

      for (const input of storyInput) {
        await createApprovedItemHelper(db, input);
      }
    });

    it('should get an existing approved item by URL', async () => {
      const inputUrl = 'https://www.test.com/story-two';

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: inputUrl,
        },
      });

      const item = result.data?.getApprovedCuratedCorpusItemByUrl;

      // Is this really the item we wanted to retrieve?
      expect(item.url).to.equal(inputUrl);

      // Does the query return all the properties of an Approved Item?
      expect(item.externalId).to.be.not.undefined;
      expect(item.externalId).to.be.not.undefined;
      expect(item.prospectId).to.be.not.undefined;
      expect(item.title).to.be.not.undefined;
      expect(item.language).to.be.not.undefined;
      expect(item.publisher).to.be.not.undefined;
      expect(item.imageUrl).to.be.not.undefined;
      expect(item.excerpt).to.be.not.undefined;
      expect(item.status).to.be.not.undefined;
      expect(item.topic).to.be.not.undefined;
      expect(item.isCollection).to.be.a('boolean');
      expect(item.isShortLived).to.be.a('boolean');
      expect(item.isSyndicated).to.be.a('boolean');
    });

    it('should return a user-friendly error if no item is found', async () => {
      const inputUrl = 'https://www.test.com/story-five';

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: inputUrl,
        },
      });

      // There should be no data returned
      expect(result.data).to.be.null;

      // There should be errors
      expect(result.errors).not.to.be.null;

      // And the error thrown should be the one set in the resolver
      if (result.errors) {
        expect(result.errors[0].message).to.contain(
          `Could not find a curated item with the following URL: "${inputUrl}".`
        );
        expect(result.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
      }
    });
  });
});

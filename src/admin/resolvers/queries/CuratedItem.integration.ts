import { expect } from 'chai';
import { CuratedStatus } from '@prisma/client';
import { db, server } from '../../../test/admin-server';
import { clearDb, createCuratedItemHelper } from '../../../test/helpers';
import { GET_CURATED_ITEMS } from '../../../test/admin-server/queries.gql';

describe('queries: CuratedItem', () => {
  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('getCuratedItems query', () => {
    beforeAll(async () => {
      // Create some items
      const stories = [
        {
          title: 'How To Win Friends And Influence People with GraphQL',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
        },
        {
          title: 'What Zombies Can Teach You About GraphQL',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
          url: 'https://www.sample-domain/what-zombies-can-teach-you-graphql',
          topic: 'Technology',
        },
        {
          title: 'How To Make Your Product Stand Out With GraphQL',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
          topic: 'Technology',
        },
        {
          title: 'How To Get Fabulous GraphQL On A Tight Budget',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
        },
        {
          title: 'Death, GraphQL And Taxes',
          language: 'en',
          status: CuratedStatus.CORPUS,
        },
        {
          title: '22 Tips To Start Building A GraphQL You Always Wanted',
          language: 'en',
          status: CuratedStatus.CORPUS,
        },
        {
          title: '5 Ways You Can Get More GraphQL While Spending Less',
          language: 'en',
          status: CuratedStatus.CORPUS,
        },
        {
          title:
            "Are You Embarrassed By Your GraphQL Skills? Here's What To Do",
          language: 'de',
          status: CuratedStatus.CORPUS,
        },
        {
          title: 'Proof That GraphQL Is Exactly What You Are Looking For',
          language: 'de',
          status: CuratedStatus.CORPUS,
        },
        {
          title: 'If You Do Not Do GraphQL Now, You Will Hate Yourself Later',
          language: 'de',
          status: CuratedStatus.CORPUS,
        },
      ];

      for (const story of stories) {
        await createCuratedItemHelper(db, story);
      }
    });

    it('should get all requested items', async () => {
      const { data } = await server.executeOperation({
        query: GET_CURATED_ITEMS,
        variables: {
          pagination: { first: 20 },
        },
      });

      expect(data?.getCuratedItems.edges).to.have.length(10);
      expect(data?.getCuratedItems.totalCount).to.equal(10);

      // Check default sorting - createdAt.DESC
      const firstItem = data?.getCuratedItems.edges[0].node;
      const secondItem = data?.getCuratedItems.edges[1].node;
      expect(firstItem.createdAt > secondItem.createdAt).to.be.true;
    });

    it('should get all available properties of curated items', async () => {
      const { data } = await server.executeOperation({
        query: GET_CURATED_ITEMS,
        variables: {
          pagination: { first: 1 },
        },
      });

      const firstItem = data?.getCuratedItems.edges[0].node;
      // The important thing to test here is that the query returns all of these
      // properties without falling over, and not that they hold any specific value.
      expect(firstItem.externalId).to.be.not.undefined;
      expect(firstItem.title).to.be.not.undefined;
      expect(firstItem.language).to.be.not.undefined;
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
        query: GET_CURATED_ITEMS,
        variables: {
          pagination: { first: 2 },
        },
      });

      // We expect to get two results back
      expect(data?.getCuratedItems.edges).to.have.length(2);
    });

    it('should return a PageInfo object', async () => {
      const { data } = await server.executeOperation({
        query: GET_CURATED_ITEMS,
        variables: {
          pagination: { first: 5 },
        },
      });

      const pageInfo = data?.getCuratedItems.pageInfo;
      expect(pageInfo.hasNextPage).to.equal(true);
      expect(pageInfo.hasPreviousPage).to.equal(false);
      expect(pageInfo.startCursor).to.be.a('string');
      expect(pageInfo.endCursor).to.be.a('string');
    });
  });

  it('should return after cursor without overfetching', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        pagination: { first: 4 },
      },
    });

    const cursor = data?.getCuratedItems.edges[3].cursor;

    const { data: nextPageData } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        pagination: { first: 4, after: cursor },
      },
    });

    expect(nextPageData?.getCuratedItems.edges)
      .to.be.an('array')
      .that.does.not.contain({ cursor });
  });

  it('should return before cursor without overfetching', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        pagination: { last: 4 },
      },
    });

    const cursor = data?.getCuratedItems.edges[0].cursor;

    const { data: prevPageData } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        pagination: { last: 4, before: cursor },
      },
    });

    expect(prevPageData?.getCuratedItems.edges)
      .to.be.an('array')
      .that.does.not.contain({ cursor });
  });

  it('should filter by language', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        filters: { language: 'de' },
      },
    });

    // we only have three stories in German set up before each test
    expect(data?.getCuratedItems.edges).to.have.length(3);
    // make sure the total count is not _all_ results, i.e. 10, but only three
    expect(data?.getCuratedItems.totalCount).to.equal(3);
  });

  it('should filter by story title', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        filters: { title: 'zombies' },
      },
    });

    // we only have one story with "Zombies" in the title
    expect(data?.getCuratedItems.edges).to.have.length(1);
    // make sure total results value is correct
    expect(data?.getCuratedItems.totalCount).to.equal(1);
  });

  it('should filter by topic', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        filters: { topic: 'Technology' },
      },
    });

    // we only have two stories categorised as "Technology"
    expect(data?.getCuratedItems.edges).to.have.length(2);

    // make sure total results value is correct
    expect(data?.getCuratedItems.totalCount).to.equal(2);
  });

  it('should filter by curated status', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        filters: { status: CuratedStatus.CORPUS },
      },
    });

    // expect to see six stories added to the corpus as second-tier recommendations
    expect(data?.getCuratedItems.edges).to.have.length(6);
    // make sure total results value is correct
    expect(data?.getCuratedItems.totalCount).to.equal(6);
  });

  it('should filter by story URL', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        filters: { url: 'sample-domain' },
      },
    });

    // expect to see just the one story with the above domain
    expect(data?.getCuratedItems.edges).to.have.length(1);
    // make sure total results value is correct
    expect(data?.getCuratedItems.totalCount).to.equal(1);
  });

  it('should filter by several parameters', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS,
      variables: {
        filters: {
          url: 'sample-domain',
          title: 'zombies',
          topic: 'Technology',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
        },
      },
    });

    // expect to see just the one story
    expect(data?.getCuratedItems.edges).to.have.length(1);
    // make sure total results value is correct
    expect(data?.getCuratedItems.totalCount).to.equal(1);
  });
});

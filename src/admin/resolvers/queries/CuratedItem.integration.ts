import { CuratedStatus } from '@prisma/client';
import { db, server } from '../../../test/admin-server';
import { clearDb, createCuratedItemHelper } from '../../../test/helpers';
import {
  GET_CURATED_ITEMS,
  GET_CURATED_ITEMS_WITH_ORDER_BY,
  GET_CURATED_ITEMS_WITH_FILTERS,
  GET_CURATED_ITEMS_KITCHEN_SINK,
} from '../../../test/admin-server/queries.gql';

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
        },
        {
          title: 'How To Make Your Product Stand Out With GraphQL',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
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
          status: CuratedStatus.DECLINE,
        },
        {
          title: 'If You Do Not Do GraphQL Now, You Will Hate Yourself Later',
          language: 'de',
          status: CuratedStatus.DECLINE,
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
          page: 1,
          perPage: 20,
        },
      });

      expect(data?.getCuratedItems.items).toHaveLength(10);

      // Check default sorting - createdAt.DESC
      const firstItem = data?.getCuratedItems.items[0];
      const secondItem = data?.getCuratedItems.items[1];
      expect(firstItem.createdAt > secondItem.createdAt).toBeTruthy();
    });

    it('should get all available properties of curated items', async () => {
      const { data } = await server.executeOperation({
        query: GET_CURATED_ITEMS,
        variables: {
          page: 1,
          perPage: 1,
        },
      });

      expect(data?.getCuratedItems.items[0].externalId).toBeTruthy();
      expect(data?.getCuratedItems.items[0].title).toBeTruthy();
      expect(data?.getCuratedItems.items[0].url).toBeTruthy();
      expect(data?.getCuratedItems.items[0].excerpt).toBeTruthy();
      expect(data?.getCuratedItems.items[0].imageUrl).toBeTruthy();
      expect(data?.getCuratedItems.items[0].createdBy).toBeTruthy();
    });

    it('should respect pagination', async () => {
      const { data } = await server.executeOperation({
        query: GET_CURATED_ITEMS,
        variables: {
          page: 2,
          perPage: 2,
        },
      });

      // We expect to get two results back
      expect(data?.getCuratedItems.items).toHaveLength(2);
    });

    it('should return a pagination object', async () => {
      const { data } = await server.executeOperation({
        query: GET_CURATED_ITEMS,
        variables: {
          page: 2,
          perPage: 3,
        },
      });

      expect(data?.getCuratedItems.pagination.currentPage).toEqual(2);
      expect(data?.getCuratedItems.pagination.totalPages).toEqual(4);
      expect(data?.getCuratedItems.pagination.totalResults).toEqual(10);
      expect(data?.getCuratedItems.pagination.perPage).toEqual(3);
    });
  });

  it('should sort by createdAt: ASC', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_ORDER_BY,
      variables: {
        page: 1,
        perPage: 10,
        orderBy: { createdAt: 'ASC' },
      },
    });

    const firstItem = data?.getCuratedItems.items[0];
    const secondItem = data?.getCuratedItems.items[1];
    expect(firstItem.createdAt < secondItem.createdAt).toBeTruthy();
  });

  it('should sort by createdAt: DESC', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_ORDER_BY,
      variables: {
        page: 1,
        perPage: 10,
        orderBy: { createdAt: 'DESC' },
      },
    });

    const firstItem = data?.getCuratedItems.items[0];
    const secondItem = data?.getCuratedItems.items[1];
    expect(firstItem.createdAt > secondItem.createdAt).toBeTruthy();
  });

  it('should sort by updatedAt: ASC', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_ORDER_BY,
      variables: {
        page: 1,
        perPage: 10,
        orderBy: { updatedAt: 'ASC' },
      },
    });

    const firstItem = data?.getCuratedItems.items[0];
    const secondItem = data?.getCuratedItems.items[1];
    expect(firstItem.updatedAt < secondItem.updatedAt).toBeTruthy();
  });

  it('should sort by updatedAt: DESC', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_ORDER_BY,
      variables: {
        page: 1,
        perPage: 10,
        orderBy: { updatedAt: 'DESC' },
      },
    });

    const firstItem = data?.getCuratedItems.items[0];
    const secondItem = data?.getCuratedItems.items[1];
    expect(firstItem.updatedAt > secondItem.updatedAt).toBeTruthy();
  });

  it('should sort by both createdAt and updatedAt', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_ORDER_BY,
      variables: {
        page: 1,
        perPage: 10,
        orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
      },
    });

    const firstItem = data?.getCuratedItems.items[0];
    const secondItem = data?.getCuratedItems.items[1];

    // Only checking the first orderBy clause here as there is no guarantee
    // what the secondary sort order will be
    // and also because it's mainly to check that the orderBy clause
    // is converted correctly in the db resolver and the query doesn't fall over.
    expect(firstItem.createdAt > secondItem.createdAt).toBeTruthy();
  });

  it('should filter by language', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_FILTERS,
      variables: {
        page: 1,
        perPage: 10,
        filters: { language: 'de' },
      },
    });

    // we only have three stories in German set up before each test
    expect(data?.getCuratedItems.items).toHaveLength(3);
    // make sure total results is not _all_ results, i.e. 10, but only three
    expect(data?.getCuratedItems.pagination.totalResults).toBe(3);
  });

  it('should filter by story title', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_FILTERS,
      variables: {
        page: 1,
        perPage: 10,
        filters: { title: 'zombies' },
      },
    });

    // we only have one story with "Zombies" in the title
    expect(data?.getCuratedItems.items).toHaveLength(1);
    // make sure total results value is correct
    expect(data?.getCuratedItems.pagination.totalResults).toBe(1);
  });

  it('should filter by curated status', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_FILTERS,
      variables: {
        page: 1,
        perPage: 10,
        filters: { status: CuratedStatus.DECLINE },
      },
    });

    // expect to see two declined stories
    expect(data?.getCuratedItems.items).toHaveLength(2);
    // make sure total results value is correct
    expect(data?.getCuratedItems.pagination.totalResults).toBe(2);
  });

  it('should filter by story URL', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_FILTERS,
      variables: {
        page: 1,
        perPage: 10,
        filters: { url: 'sample-domain' },
      },
    });

    // expect to see just the one story with the above domain
    expect(data?.getCuratedItems.items).toHaveLength(1);
    // make sure total results value is correct
    expect(data?.getCuratedItems.pagination.totalResults).toBe(1);
  });

  it('should filter by several parameters', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_FILTERS,
      variables: {
        page: 1,
        perPage: 10,
        filters: {
          url: 'sample-domain',
          title: 'zombies',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
        },
      },
    });

    // expect to see just the one story
    expect(data?.getCuratedItems.items).toHaveLength(1);
    // make sure total results value is correct
    expect(data?.getCuratedItems.pagination.totalResults).toBe(1);
  });

  it('should both filter and order results', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_KITCHEN_SINK,
      variables: {
        page: 1,
        perPage: 10,
        orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
        filters: {
          url: 'sample-domain',
          title: 'zombies',
          language: 'en',
          status: CuratedStatus.RECOMMENDATION,
        },
      },
    });

    // All I want from this query is that it doesn't fail
    expect(data?.getCuratedItems.items).toHaveLength(1);
    expect(data?.getCuratedItems.pagination.totalResults).toBe(1);
  });
});

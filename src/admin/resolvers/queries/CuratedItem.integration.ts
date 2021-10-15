import { CuratedStatus } from '@prisma/client';
import { db, server } from '../../../test/admin-server';
import { clearDb, createCuratedItemHelper } from '../../../test/helpers';
import {
  GET_CURATED_ITEMS,
  GET_CURATED_ITEMS_WITH_FILTERS,
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

  it('should filter by topic', async () => {
    const { data } = await server.executeOperation({
      query: GET_CURATED_ITEMS_WITH_FILTERS,
      variables: {
        page: 1,
        perPage: 10,
        filters: { topic: 'Technology' },
      },
    });

    // we only have two stories categorised as "Technology"
    expect(data?.getCuratedItems.items).toHaveLength(2);
    // make sure total results value is correct
    expect(data?.getCuratedItems.pagination.totalResults).toBe(2);
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
          topic: 'Technology',
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
});

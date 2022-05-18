import { expect } from 'chai';
import { ApprovedItem, CuratedStatus } from '@prisma/client';
import { db } from '../../../test/admin-server';
import {
  clearDb,
  createApprovedItemHelper,
  createScheduledItemHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import {
  APPROVED_ITEM_REFERENCE_RESOLVER,
  GET_APPROVED_ITEM_BY_URL,
  GET_APPROVED_ITEM_WITH_SCHEDULING_HISTORY,
  GET_APPROVED_ITEMS,
} from './sample-queries.gql';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { MozillaAccessGroup } from '../../../shared/types';

describe('queries: ApprovedCorpusItem', () => {
  // adding headers with groups that grant full access
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${MozillaAccessGroup.SCHEDULED_SURFACE_CURATOR_FULL}`,
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

  describe('getApprovedCorpusItems query', () => {
    beforeAll(async () => {
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
        {
          title: 'How To Get Fabulous GraphQL On A Tight Budget',
          language: 'EN',
          status: CuratedStatus.RECOMMENDATION,
          topic: 'FOOD',
        },
        {
          title: 'Death, GraphQL And Taxes',
          language: 'EN',
          status: CuratedStatus.CORPUS,
          topic: 'ENTERTAINMENT',
        },
        {
          title: '22 Tips To Start Building A GraphQL You Always Wanted',
          language: 'EN',
          status: CuratedStatus.CORPUS,
          topic: 'POLITICS',
        },
        {
          title: '5 Ways You Can Get More GraphQL While Spending Less',
          language: 'EN',
          status: CuratedStatus.CORPUS,
          topic: 'POLITICS',
        },
        {
          title:
            "Are You Embarrassed By Your GraphQL Skills? Here's What To Do",
          language: 'DE',
          status: CuratedStatus.CORPUS,
          topic: 'FOOD',
        },
        {
          title: 'Proof That GraphQL Is Exactly What You Are Looking For',
          language: 'DE',
          status: CuratedStatus.CORPUS,
          topic: 'TRAVEL',
        },
        {
          title: 'If You Do Not Do GraphQL Now, You Will Hate Yourself Later',
          language: 'DE',
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

      expect(data?.getApprovedCorpusItems.edges).to.have.length(10);
      expect(data?.getApprovedCorpusItems.totalCount).to.equal(10);

      // Check default sorting - createdAt.DESC
      const firstItem = data?.getApprovedCorpusItems.edges[0].node;
      const secondItem = data?.getApprovedCorpusItems.edges[1].node;
      expect(firstItem.createdAt > secondItem.createdAt).to.be.true;
    });

    it('should get all available properties of curated items', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 1 },
        },
      });

      const firstItem = data?.getApprovedCorpusItems.edges[0].node;
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
      expect(firstItem.source).to.be.not.undefined;
      expect(firstItem.isCollection).to.be.a('boolean');
      expect(firstItem.isTimeSensitive).to.be.a('boolean');
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
      expect(data?.getApprovedCorpusItems.edges).to.have.length(2);
    });

    it('should return a PageInfo object', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 5 },
        },
      });

      const pageInfo = data?.getApprovedCorpusItems.pageInfo;
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

      const cursor = data?.getApprovedCorpusItems.edges[3].cursor;

      const { data: nextPageData } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { first: 4, after: cursor },
        },
      });

      expect(nextPageData?.getApprovedCorpusItems.edges)
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

      const cursor = data?.getApprovedCorpusItems.edges[0].cursor;

      const { data: prevPageData } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          pagination: { last: 4, before: cursor },
        },
      });

      expect(prevPageData?.getApprovedCorpusItems.edges)
        .to.be.an('array')
        .that.does.not.contain({ cursor });
    });

    it('should filter by language', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { language: 'DE' },
        },
      });

      // we only have three stories in German set up before each test
      expect(data?.getApprovedCorpusItems.edges).to.have.length(3);
      // make sure the total count is not _all_ results, i.e. 10, but only three
      expect(data?.getApprovedCorpusItems.totalCount).to.equal(3);
    });

    it('should filter by story title', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { title: 'ZoMbIeS' },
        },
      });

      // we only have one story with "Zombies" in the title
      expect(data?.getApprovedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getApprovedCorpusItems.totalCount).to.equal(1);
    });

    it('should filter by topic', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { topic: 'TeChNoLoGy' },
        },
      });

      // we only have two stories categorised as "Technology"
      expect(data?.getApprovedCorpusItems.edges).to.have.length(2);

      // make sure total results value is correct
      expect(data?.getApprovedCorpusItems.totalCount).to.equal(2);
    });

    it('should filter by curated status', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { status: CuratedStatus.CORPUS },
        },
      });

      // expect to see six stories added to the corpus as second-tier recommendations
      expect(data?.getApprovedCorpusItems.edges).to.have.length(6);
      // make sure total results value is correct
      expect(data?.getApprovedCorpusItems.totalCount).to.equal(6);
    });

    it('should filter by story URL', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: { url: 'sample-domain' },
        },
      });

      // expect to see just the one story with the above domain
      expect(data?.getApprovedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getApprovedCorpusItems.totalCount).to.equal(1);
    });

    it('should filter by several parameters', async () => {
      const { data } = await server.executeOperation({
        query: GET_APPROVED_ITEMS,
        variables: {
          filters: {
            url: 'sample-domain',
            title: 'zombies',
            topic: 'TECHNOLOGY',
            language: 'EN',
            status: CuratedStatus.RECOMMENDATION,
          },
        },
      });

      // expect to see just the one story
      expect(data?.getApprovedCorpusItems.edges).to.have.length(1);
      // make sure total results value is correct
      expect(data?.getApprovedCorpusItems.totalCount).to.equal(1);
    });
  });

  describe('getApprovedCorpusItemByUrl query', () => {
    beforeAll(async () => {
      // Create a few items with known URLs.
      const storyInput = [
        {
          title: 'Story one',
          url: 'https://www.sample-domain1.com/what-zombies-can-teach-you-graphql',
        },
        {
          title: 'Story two',
          url: 'https://www.test1.com/story-two',
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
      const inputUrl = 'https://www.test1.com/story-two';

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: inputUrl,
        },
      });

      const item = result.data?.getApprovedCorpusItemByUrl;

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
      expect(item.source).to.be.not.undefined;
      expect(item.isCollection).to.be.a('boolean');
      expect(item.isTimeSensitive).to.be.a('boolean');
      expect(item.isSyndicated).to.be.a('boolean');
    });

    it('should return null when no url is found', async () => {
      const inputUrl = 'https://www.test-no-url-found.com/story-five';

      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_BY_URL,
        variables: {
          url: inputUrl,
        },
      });

      expect(result.data).to.have.property('getApprovedCorpusItemByUrl');

      // There should be no data returned
      expect(result.data?.getApprovedCorpusItemByUrl).to.be.null;

      // There should be no errors
      expect(result.errors).to.be.undefined;
    });
  });

  describe('getScheduledSurfaceHistory subquery', () => {
    beforeAll(async () => {
      // Create a few items with known URLs.
      const storyInput = [
        {
          title: 'Story one',
          url: 'https://www.test-domain.com/story-one',
        },
        {
          title: 'Story two',
          url: 'https://www.test-domain.com/story-two',
        },
        {
          title: 'Story three',
          url: 'https://www.test-domain.com/story-three',
        },
      ];

      const stories: ApprovedItem[] = [];

      for (const input of storyInput) {
        const story = await createApprovedItemHelper(db, input);
        stories.push(story);
      }

      // Destructure the first two stories to be able to create scheduled
      // entries for them
      const [storyOne, storyTwo] = stories;

      // Set up some scheduled entries for story #1
      // US New Tab, date in 2050
      for (let i = 21; i <= 30; i++) {
        await createScheduledItemHelper(db, {
          scheduledSurfaceGuid: 'NEW_TAB_EN_US',
          approvedItem: storyOne,
          scheduledDate: new Date(`2050-01-${i}`).toISOString(),
        });
      }
      // DE New Tab, same dates
      for (let i = 11; i <= 20; i++) {
        await createScheduledItemHelper(db, {
          scheduledSurfaceGuid: 'NEW_TAB_DE_DE',
          approvedItem: storyOne,
          scheduledDate: new Date(`2050-01-${i}`).toISOString(),
        });
      }
      // Set up more scheduled entries for story #2
      for (let i = 1; i <= 10; i++) {
        await createScheduledItemHelper(db, {
          scheduledSurfaceGuid: 'NEW_TAB_EN_US',
          approvedItem: storyTwo,
          scheduledDate: new Date(`2050-01-${i}`).toISOString(),
        });
      }
    });

    it('returns an empty array if an Approved Item has not been scheduled onto any surface', async () => {
      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_WITH_SCHEDULING_HISTORY,
        variables: {
          url: 'https://www.test-domain.com/story-three',
        },
      });

      // There should be no errors
      expect(result.errors).to.be.undefined;

      // There should be no data returned for the subquery (an empty array),
      // since the third story doesn't have any scheduled entries in this test suite.
      expect(
        result.data?.getApprovedCorpusItemByUrl.scheduledSurfaceHistory
      ).to.have.lengthOf(0);
    });

    it('returns an empty array if an Approved item has not been scheduled onto a particular surface', async () => {
      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_WITH_SCHEDULING_HISTORY,
        variables: {
          url: 'https://www.test-domain.com/story-two',
          scheduledSurfaceGuid: 'NEW_TAB_EN_GB',
        },
      });

      // There should be no errors
      expect(result.errors).to.be.undefined;

      // There should be no data returned for the subquery (an empty array),
      // since the this story doesn't have any entries on the UK New Tab
      expect(
        result.data?.getApprovedCorpusItemByUrl.scheduledSurfaceHistory
      ).to.have.lengthOf(0);
    });

    it('respects the limit on results', async () => {
      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_WITH_SCHEDULING_HISTORY,
        variables: {
          url: 'https://www.test-domain.com/story-two',
          scheduledSurfaceGuid: 'NEW_TAB_EN_US',
          limit: 3,
        },
      });

      // There should be no errors
      expect(result.errors).to.be.undefined;

      expect(
        result.data?.getApprovedCorpusItemByUrl.scheduledSurfaceHistory
      ).to.have.lengthOf(3);
    });

    it('returns results for a specified scheduled surface only', async () => {
      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_WITH_SCHEDULING_HISTORY,
        variables: {
          url: 'https://www.test-domain.com/story-one',
          scheduledSurfaceGuid: 'NEW_TAB_DE_DE',
        },
      });

      // There should be no errors.
      expect(result.errors).to.be.undefined;

      // We've got ten of these seeded for this test suite.
      const history =
        result.data?.getApprovedCorpusItemByUrl.scheduledSurfaceHistory;
      expect(history).to.have.lengthOf(10);

      // Let's verify they're all scheduled for DE_DE
      history.forEach((entry) => {
        expect(entry.scheduledSurfaceGuid).to.equal('NEW_TAB_DE_DE');
      });
    });

    it('returns all entries for a given approved item', async () => {
      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_WITH_SCHEDULING_HISTORY,
        variables: {
          url: 'https://www.test-domain.com/story-one',
          limit: 100,
        },
      });

      // There should be no errors.
      expect(result.errors).to.be.undefined;

      // There's a total of 20 entries for the first story
      expect(
        result.data?.getApprovedCorpusItemByUrl.scheduledSurfaceHistory
      ).to.have.lengthOf(20);
    });

    it('returns the scheduled entries in descending order', async () => {
      const result = await server.executeOperation({
        query: GET_APPROVED_ITEM_WITH_SCHEDULING_HISTORY,
        variables: {
          url: 'https://www.test-domain.com/story-one',
          scheduledSurfaceGuid: 'NEW_TAB_DE_DE',
        },
      });

      // There should be no errors.
      expect(result.errors).to.be.undefined;

      // We've got ten of these seeded for this test suite.
      const history =
        result.data?.getApprovedCorpusItemByUrl.scheduledSurfaceHistory;
      expect(history).to.have.lengthOf(10);

      // Let's verify that the results are being returned in descending order
      expect(history[0].scheduledDate).to.equal('2050-01-20');
      expect(history[1].scheduledDate).to.equal('2050-01-19');
      expect(history[2].scheduledDate).to.equal('2050-01-18');
    });
  });

  describe('ApprovedItem reference resolver', () => {
    beforeAll(async () => {
      // Create a few items with known URLs.
      const storyInput = [
        {
          title: 'Story one',
          url: 'https://www.sample-domain.com/what-zombies-can-teach-you-graphql',
        },
        {
          title: 'Story two',
          url: 'https://www.test2.com/story-two',
        },
        {
          title: 'Story three',
          url: 'https://www.test2.com/story-three',
        },
        {
          title: 'Story four',
          url: 'https://www.test2.com/story-four',
        },
        {
          title: 'Story five',
          url: 'https://www.test2.com/story-five',
        },
        {
          title: 'Story six',
          url: 'https://www.test2.com/story-six',
        },
        {
          title: 'Story seven',
          url: 'https://www.test2.com/story-seven',
        },
      ];

      for (const input of storyInput) {
        await createApprovedItemHelper(db, input);
      }
    });

    it('returns the approved item if it exists', async () => {
      const result = await server.executeOperation({
        query: APPROVED_ITEM_REFERENCE_RESOLVER,
        variables: {
          representations: [
            {
              __typename: 'ApprovedCorpusItem',
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
        query: APPROVED_ITEM_REFERENCE_RESOLVER,
        variables: {
          representations: [
            {
              __typename: 'ApprovedCorpusItem',
              url: 'https://www.test2.com/story-seven',
            },
            {
              __typename: 'ApprovedCorpusItem',
              url: 'https://www.test2.com/story-three',
            },
            {
              __typename: 'ApprovedCorpusItem',
              url: 'https://www.sample-domain.com/what-zombies-can-teach-you-graphql',
            },
            {
              __typename: 'ApprovedCorpusItem',
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

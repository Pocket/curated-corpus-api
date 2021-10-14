import { CuratedStatus } from '@prisma/client';
import { expect } from 'chai';
import { db, server } from '../../../test/admin-server';
import {
  clearDb,
  createCuratedItemHelper,
  createNewTabFeedHelper,
} from '../../../test/helpers';
import {
  CREATE_CURATED_ITEM,
  UPDATE_CURATED_ITEM,
} from '../../../test/admin-server/mutations.gql';
import {
  CreateCuratedItemInput,
  UpdateCuratedItemInput,
} from '../../../database/types';

describe('mutations: CuratedItem', () => {
  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  beforeEach(async () => {
    await clearDb(db);
  });

  describe('createCuratedItem mutation', () => {
    // a standard set of inputs for this mutation
    const input: CreateCuratedItemInput = {
      title: 'Find Out How I Cured My Docker In 2 Days',
      url: 'https://test.com/docker',
      excerpt: 'A short summary of what this story is about',
      status: CuratedStatus.CORPUS,
      imageUrl: 'https://test.com/image.png',
      language: 'de',
      topic: 'Technology',
      isCollection: false,
      isShortLived: true,
      isSyndicated: false,
    };

    it('creates a curated item with all inputs supplied', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_CURATED_ITEM,
        variables: input,
      });

      // Expect to see all the input data we supplied in the Curated Item
      // returned by the mutation
      expect(data?.createCuratedItem).to.deep.include(input);
    });

    it('should fail to create a curated item with a duplicate URL', async () => {
      // Create a curated item with a set URL
      await createCuratedItemHelper(db, {
        title: 'I was here first!',
        url: 'https://test.com/docker',
      });

      // Attempt to create another item with the same URL
      const result = await server.executeOperation({
        query: CREATE_CURATED_ITEM,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `A curated item with the URL "${input.url}" already exists`
        );
      }
    });

    xit('should create an optional scheduled item', async () => {
      // a new tab entity for the optional scheduling
      const newTab = await createNewTabFeedHelper(db, { shortName: 'en-US' });

      // extra inputs
      input.scheduledDate = '2100-01-01';
      input.newTabFeedExternalId = newTab.externalId;

      const result = await server.executeOperation({
        query: CREATE_CURATED_ITEM,
        variables: input,
      });

      // Expect to see all the input data we supplied in the Curated Item
      // returned by the mutation
      expect(result.data?.createCuratedItem).to.deep.include(input);

      // NB we don't (yet) return anything for the scheduled item,
      // but if the mutation does not fall over, that means it has been created
      // successfully.
    });
  });

  describe('updateCuratedItem mutation', () => {
    it('updates a curated item when required variables are supplied', async () => {
      const item = await createCuratedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
        status: CuratedStatus.RECOMMENDATION,
        language: 'en',
      });

      const input: UpdateCuratedItemInput = {
        externalId: item.externalId,
        title: 'Anything but LEGO',
        url: 'https://test.com/lego',
        excerpt: 'Updated excerpt',
        status: CuratedStatus.CORPUS,
        imageUrl: 'https://test.com/image.png',
        language: 'de',
        topic: 'Business',
        isCollection: true,
        isShortLived: true,
        isSyndicated: false,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_CURATED_ITEM,
        variables: input,
      });

      // External ID should be unchanged
      expect(data?.updateCuratedItem.externalId).to.equal(item.externalId);

      // Updated properties should be... updated
      expect(data?.updateCuratedItem).to.deep.include(input);
    });

    it('should fail to update a curated item with a duplicate URL', async () => {
      await createCuratedItemHelper(db, {
        title: 'I was here first',
        url: 'https://test.com/first',
      });
      const item = await createCuratedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
        url: 'https://sample.com/three-things',
      });

      const input: UpdateCuratedItemInput = {
        externalId: item.externalId,
        title: 'Anything but LEGO',
        url: 'https://test.com/first',
        excerpt: 'Updated excerpt',
        status: CuratedStatus.RECOMMENDATION,
        imageUrl: 'https://test.com/image.png',
        language: 'de',
        topic: 'Business',
        isCollection: true,
        isShortLived: true,
        isSyndicated: false,
      };

      // Attempt to update the second item with a duplicate URL...
      const result = await server.executeOperation({
        query: UPDATE_CURATED_ITEM,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `A curated item with the URL "${input.url}" already exists`
        );
      }
    });
  });
});

import { CuratedStatus } from '@prisma/client';
import chai from 'chai';
import { db, server } from '../../../test/admin-server';
import { clearDb, createCuratedItemHelper } from '../../../test/helpers';
import { UPDATE_CURATED_ITEM } from '../../../test/admin-server/mutations.gql';
import { UpdateCuratedItemInput } from '../../../database/types';

describe('queries: CuratedItem', () => {
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
        status: CuratedStatus.DECLINE,
        language: 'de',
      };

      const { data } = await server.executeOperation({
        query: UPDATE_CURATED_ITEM,
        variables: input,
      });

      // External ID should be unchanged
      expect(data?.updateCuratedItem.externalId).toBe(item.externalId);

      // Updated properties should be... updated
      chai.expect(data?.updateCuratedItem).to.deep.include(input);

      // The one optional property should stay unchanged
      expect(data?.updateCuratedItem.imageUrl).toBe(item.imageUrl);
    });

    it('updates a curated item when all variables are supplied', async () => {
      const item = await createCuratedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
      });

      const input: UpdateCuratedItemInput = {
        externalId: item.externalId,
        title: 'Anything but LEGO',
        url: 'https://test.com/lego',
        excerpt: 'Updated excerpt',
        status: CuratedStatus.DECLINE,
        language: 'de',
        imageUrl: 'https://test.com/image.png',
      };

      const { data } = await server.executeOperation({
        query: UPDATE_CURATED_ITEM,
        variables: input,
      });

      // External ID should be unchanged
      expect(data?.updateCuratedItem.externalId).toBe(item.externalId);

      // Updated properties should be... updated
      chai.expect(data?.updateCuratedItem).to.deep.include(input);
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
        status: CuratedStatus.DECLINE,
        language: 'de',
      };

      // Attempt to update the second item with a duplicate URL...
      const result = await server.executeOperation({
        query: UPDATE_CURATED_ITEM,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).toMatch(
          `A curated item with the URL "${input.url}" already exists`
        );
      }
    });
  });
});

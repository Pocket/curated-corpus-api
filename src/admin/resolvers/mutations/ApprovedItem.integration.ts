import { CuratedStatus } from '@prisma/client';
import { expect } from 'chai';
import { db, server } from '../../../test/admin-server';
import { clearDb, createApprovedItemHelper } from '../../../test/helpers';
import {
  CREATE_APPROVED_ITEM,
  UPDATE_APPROVED_ITEM,
} from '../../../test/admin-server/mutations.gql';
import {
  CreateApprovedItemInput,
  UpdateApprovedItemInput,
} from '../../../database/types';

describe('mutations: ApprovedItem', () => {
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

  describe('createApprovedCuratedCorpusItem mutation', () => {
    // a standard set of inputs for this mutation
    const input: CreateApprovedItemInput = {
      title: 'Find Out How I Cured My Docker In 2 Days',
      url: 'https://test.com/docker',
      excerpt: 'A short summary of what this story is about',
      status: CuratedStatus.CORPUS,
      imageUrl: 'https://test.com/image.png',
      language: 'de',
      publisher: 'Convective Cloud',
      topic: 'Technology',
      isCollection: false,
      isShortLived: true,
      isSyndicated: false,
    };

    it('creates an approved item with all inputs supplied', async () => {
      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: input,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createApprovedCuratedCorpusItem).to.deep.include(
        input
      );
    });

    it('should fail to create an approved item with a duplicate URL', async () => {
      // Create a approved item with a set URL
      await createApprovedItemHelper(db, {
        title: 'I was here first!',
        url: 'https://test.com/docker',
      });

      // Attempt to create another item with the same URL
      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `An approved item with the URL "${input.url}" already exists`
        );
      }
    });

    it('should create an optional scheduled item', async () => {
      // extra inputs
      input.scheduledDate = '2100-01-01';
      input.newTabGuid = 'EN_US';

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: input,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation

      // We only return the approved item here, so need to purge the scheduling
      // input values from the input before comparison.
      delete input.scheduledDate;
      delete input.newTabGuid;
      expect(result.data?.createApprovedCuratedCorpusItem).to.deep.include(
        input
      );

      // NB: we don't (yet) return anything for the scheduled item,
      // but if the mutation does not fall over, that means it has been created
      // successfully.
    });

    it('should not create a scheduled entry for an approved item with invalid New Tab id supplied', async () => {
      // extra inputs
      input.scheduledDate = '2100-01-01';
      input.newTabGuid = 'RECSAPI';

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `Cannot create a scheduled entry with New Tab GUID of "${input.newTabGuid}".`
        );
      }
    });
  });

  describe('updateCuratedItem mutation', () => {
    it('updates an approved item when required variables are supplied', async () => {
      const item = await createApprovedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
        status: CuratedStatus.RECOMMENDATION,
        language: 'en',
      });

      const input: UpdateApprovedItemInput = {
        externalId: item.externalId,
        title: 'Anything but LEGO',
        url: 'https://test.com/lego',
        excerpt: 'Updated excerpt',
        status: CuratedStatus.CORPUS,
        imageUrl: 'https://test.com/image.png',
        language: 'de',
        publisher: 'Cloud Factory',
        topic: 'Business',
        isCollection: true,
        isShortLived: true,
        isSyndicated: false,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: input,
      });

      // External ID should be unchanged
      expect(data?.updateApprovedCuratedCorpusItem.externalId).to.equal(
        item.externalId
      );

      // Updated properties should be... updated
      expect(data?.updateApprovedCuratedCorpusItem).to.deep.include(input);
    });

    it('should fail to update an approved item with a duplicate URL', async () => {
      await createApprovedItemHelper(db, {
        title: 'I was here first',
        url: 'https://test.com/first',
      });
      const item = await createApprovedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
        url: 'https://sample.com/three-things',
      });

      const input: UpdateApprovedItemInput = {
        externalId: item.externalId,
        title: 'Anything but LEGO',
        url: 'https://test.com/first',
        excerpt: 'Updated excerpt',
        status: CuratedStatus.RECOMMENDATION,
        imageUrl: 'https://test.com/image.png',
        language: 'de',
        publisher: 'Brick Cloud',
        topic: 'Business',
        isCollection: true,
        isShortLived: true,
        isSyndicated: false,
      };

      // Attempt to update the second item with a duplicate URL...
      const result = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `An approved item with the URL "${input.url}" already exists`
        );
      }
    });
  });
});

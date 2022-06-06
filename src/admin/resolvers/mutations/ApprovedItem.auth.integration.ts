import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import {
  ApprovedItem,
  ApprovedItemAuthor,
  CreateApprovedItemInput,
  RejectApprovedItemInput,
  UpdateApprovedItemAuthorsInput,
  UpdateApprovedItemInput,
} from '../../../database/types';
import { CuratedStatus } from '@prisma/client';
import {
  ACCESS_DENIED_ERROR,
  CorpusItemSource,
  MozillaAccessGroup,
  Topics,
} from '../../../shared/types';
import {
  clearDb,
  createApprovedItemHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { db, getServer } from '../../../test/admin-server';
import {
  CREATE_APPROVED_ITEM,
  REJECT_APPROVED_ITEM,
  UPDATE_APPROVED_ITEM,
  UPDATE_APPROVED_ITEM_AUTHORS,
  UPLOAD_APPROVED_ITEM_IMAGE,
} from './sample-mutations.gql';
import { expect } from 'chai';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import { Upload } from 'graphql-upload';

describe('mutations: ApprovedItem - authentication checks', () => {
  const eventEmitter = new CuratedCorpusEventEmitter();

  // a standard set of inputs for this mutation
  const input: CreateApprovedItemInput = {
    prospectId: '123-abc',
    title: 'Find Out How I Cured My Docker In 2 Days',
    url: 'https://test.com/docker',
    excerpt: 'A short summary of what this story is about',
    authors: [
      { name: 'Mark Twain', sortOrder: 1 },
      { name: 'Jane Austen', sortOrder: 2 },
    ],
    status: CuratedStatus.CORPUS,
    imageUrl: 'https://test.com/image.png',
    language: 'DE',
    publisher: 'Convective Cloud',
    topic: Topics.TECHNOLOGY,
    source: CorpusItemSource.PROSPECT,
    isCollection: false,
    isTimeSensitive: true,
    isSyndicated: false,
  };

  beforeAll(async () => {
    await clearDb(db);
  });

  describe('createApprovedCorpusItem mutation', () => {
    it('should succeed if user has access to one of scheduled surfaces', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENGB}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createApprovedCorpusItem).to.deep.include(input);
    });

    it('should fail if request headers are not supplied', async () => {
      // With the default context, the headers are empty
      const server = getServer(eventEmitter);

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });

    it("should fail if user doesn't have access to any of scheduled surfaces", async () => {
      // Set up auth headers with access to something irrelevant here, such as collections
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.COLLECTION_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });

    it('should fail optional scheduling if user has no access to relevant scheduled surface', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_DEDE}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);

      // extra inputs for scheduling - note attempting to schedule onto the US New Tab
      // while only having access to the German New Tab
      input.scheduledDate = '2100-01-01';
      input.scheduledSurfaceGuid = 'NEW_TAB_EN_US';

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });
  });

  describe('updateApprovedCorpusItem mutation', () => {
    let item: ApprovedItem;
    let authors: ApprovedItemAuthor[];
    let input: UpdateApprovedItemInput;

    beforeEach(async () => {
      item = await createApprovedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
        status: CuratedStatus.RECOMMENDATION,
        language: 'EN',
      });

      // authors from `item` above do not go through graphql and therefore
      // contain extra info (externalId, approvedItemId). we need to remove
      // those properties to prepare an authors array for the update `input`
      // below
      if (item.authors) {
        authors =
          item.authors?.map((author) => ({
            name: author.name,
            sortOrder: author.sortOrder,
          })) ?? [];
      }

      input = {
        externalId: item.externalId,
        title: 'Anything but LEGO',
        excerpt: 'Updated excerpt',
        authors,
        status: CuratedStatus.CORPUS,
        imageUrl: 'https://test.com/image.png',
        language: 'DE',
        publisher: 'Cloud Factory',
        topic: Topics.BUSINESS,
        isTimeSensitive: true,
      };
    });

    it('should succeed if user has access to one of scheduled surfaces', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENGB}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);

      const res = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: { data: input },
      });

      // Good to check for any errors before proceeding with the rest of the test
      expect(res.errors).to.be.undefined;
      const data = res.data;

      // External ID should be unchanged
      expect(data?.updateApprovedCorpusItem.externalId).to.equal(
        item.externalId
      );

      // Updated properties should be... updated
      expect(data?.updateApprovedCorpusItem).to.deep.include(input);

      // The `updatedBy` field should now be the SSO username of the user
      // who updated this record
      expect(data?.updateApprovedCorpusItem.updatedBy).to.equal(
        headers.username
      );
    });

    it('should fail if request headers are not supplied', async () => {
      // With the default context, the headers are empty
      const server = getServer(eventEmitter);

      const result = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });

    it("should fail if user doesn't have access to any of scheduled surfaces", async () => {
      // Set up auth headers with access to something irrelevant here, such as collections
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.COLLECTION_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);

      const result = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });
  });

  describe('updateApprovedCorpusItemAuthors mutation', () => {
    let item: ApprovedItem;
    let authors: ApprovedItemAuthor[];
    let input: UpdateApprovedItemAuthorsInput;

    beforeEach(async () => {
      item = await createApprovedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
        status: CuratedStatus.RECOMMENDATION,
        language: 'EN',
      });

      authors = [
        { name: 'Author One', sortOrder: 1 },
        { name: 'Author Two', sortOrder: 2 },
      ];

      input = {
        externalId: item.externalId,
        authors,
      };
    });

    it('should succeed if user has access to one of scheduled surfaces', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENGB}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);

      const res = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM_AUTHORS,
        variables: { data: input },
      });

      // Good to check for any errors before proceeding with the rest of the test
      expect(res.errors).not.to.exist;
      const data = res.data;

      // External ID should be unchanged
      expect(data?.updateApprovedCorpusItemAuthors.externalId).to.equal(
        item.externalId
      );

      // Updated properties should be... updated
      expect(data?.updateApprovedCorpusItemAuthors.authors).to.deep.equal(
        input.authors
      );

      // The `updatedBy` field should now be the SSO username of the user
      // who updated this record
      expect(data?.updateApprovedCorpusItemAuthors.updatedBy).to.equal(
        headers.username
      );
    });

    it('should fail if request headers are not supplied', async () => {
      // With the default context, the headers are empty
      const server = getServer(eventEmitter);

      const result = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM_AUTHORS,
        variables: { data: input },
      });

      expect(result.data).not.to.exist;
      expect(result.errors).to.exist;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });

    it("should fail if user doesn't have access to any of scheduled surfaces", async () => {
      // Set up auth headers with access to something irrelevant here, such as collections
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.COLLECTION_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);

      const result = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM_AUTHORS,
        variables: { data: input },
      });

      expect(result.data).not.to.exist;
      expect(result.errors).to.exist;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });
  });

  describe('rejectApprovedItem mutation', () => {
    it('should successfully reject an approved item when the user has access to at least one scheduled surface', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENGB}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const item = await createApprovedItemHelper(db, {
        title: '15 Unheard Ways To Achieve Greater Terraform',
        status: CuratedStatus.RECOMMENDATION,
        language: 'EN',
      });

      const input: RejectApprovedItemInput = {
        externalId: item.externalId,
        reason: 'MISINFORMATION,OTHER',
      };

      const result = await server.executeOperation({
        query: REJECT_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // On success, mutation should return the deleted approved item.
      // Let's verify the id.
      expect(result.data?.rejectApprovedCorpusItem.externalId).to.equal(
        item.externalId
      );
    });

    it('should throw an error when the user has no access any scheduled surface', async () => {
      // Set up auth headers without access to any Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

      const input: RejectApprovedItemInput = {
        externalId: 'test-id',
        reason: 'MISINFORMATION,OTHER',
      };

      const result = await server.executeOperation({
        query: REJECT_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.undefined;
      expect(result.data).to.be.null;

      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });

    it('should throw an error when the user has only read-only access', async () => {
      // Set up auth headers with read-only access
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const input: RejectApprovedItemInput = {
        externalId: 'test-id',
        reason: 'MISINFORMATION,OTHER',
      };

      const result = await server.executeOperation({
        query: REJECT_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.undefined;
      expect(result.data).to.be.null;

      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });

    it('should throw an error when the request headers are undefined', async () => {
      // pass in empty object for headers
      const server = getServerWithMockedHeaders({});

      const input: RejectApprovedItemInput = {
        externalId: 'test-id',
        reason: 'MISINFORMATION,OTHER',
      };

      const result = await server.executeOperation({
        query: REJECT_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.undefined;
      expect(result.data).to.be.null;

      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });
  });

  describe('uploadApprovedCuratedCorpusItemImage mutation', () => {
    const testFilePath = __dirname + '/test-image.jpeg';

    beforeEach(() => {
      writeFileSync(testFilePath, 'I am an image');
    });

    afterEach(() => {
      unlinkSync(testFilePath);
    });

    it('should not succeed if user does not have write to corpus privileges', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const image: Upload = new Upload();

      image.resolve({
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: () => createReadStream(testFilePath),
      });

      const result = await server.executeOperation({
        query: UPLOAD_APPROVED_ITEM_IMAGE,
        variables: {
          image: image,
        },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);
    });
  });
});

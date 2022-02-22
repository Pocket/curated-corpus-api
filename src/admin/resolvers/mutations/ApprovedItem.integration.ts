import config from '../../../config';
import { ApprovedItem, CuratedStatus } from '@prisma/client';
import { expect } from 'chai';
import sinon from 'sinon';
import { db, getServer } from '../../../test/admin-server';
import {
  clearDb,
  createApprovedItemHelper,
  createRejectedCuratedCorpusItemHelper,
  createScheduledItemHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import {
  CREATE_APPROVED_ITEM,
  REJECT_APPROVED_ITEM,
  UPDATE_APPROVED_ITEM,
  UPLOAD_APPROVED_ITEM_IMAGE,
} from './sample-mutations.gql';
import {
  CreateApprovedItemInput,
  RejectApprovedItemInput,
  UpdateApprovedItemInput,
} from '../../../database/types';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import {
  ReviewedCorpusItemEventType,
  ScheduledCorpusItemEventType,
} from '../../../events/types';
import { Upload } from 'graphql-upload';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import { GET_REJECTED_ITEMS } from '../queries/sample-queries.gql';
import { ACCESS_DENIED_ERROR, MozillaAccessGroup } from '../../../shared/types';

describe('mutations: ApprovedItem', () => {
  const eventEmitter = new CuratedCorpusEventEmitter();

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${MozillaAccessGroup.SCHEDULED_SURFACE_CURATOR_FULL}`,
  };
  const server = getServerWithMockedHeaders(headers, eventEmitter);

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
      prospectId: '123-abc',
      title: 'Find Out How I Cured My Docker In 2 Days',
      url: 'https://test.com/docker',
      excerpt: 'A short summary of what this story is about',
      status: CuratedStatus.CORPUS,
      imageUrl: 'https://test.com/image.png',
      language: 'de',
      publisher: 'Convective Cloud',
      topic: 'Technology',
      isCollection: false,
      isTimeSensitive: true,
      isSyndicated: false,
    };

    it('should create an approved item if user has full access', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.ADD_ITEM, eventTracker);

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createApprovedCuratedCorpusItem).to.deep.include(
        input
      );

      // Check that the ADD_ITEM event was fired successfully:
      // 1 - Event was fired once!
      expect(eventTracker.callCount).to.equal(1);
      // 2 - Event has the right type.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.ADD_ITEM
      );
      // 3- Event has the right entity passed to it.
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.externalId
      ).to.equal(result.data?.createApprovedCuratedCorpusItem.externalId);
    });

    it('should create an approved item without a prospectId', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.ADD_ITEM, eventTracker);

      // clone the input
      const inputWithoutProspectId = { ...input };

      // delete the prospectId (as it will not be sent from the frontend for manually added items)
      delete inputWithoutProspectId.prospectId;

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: inputWithoutProspectId },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createApprovedCuratedCorpusItem).to.deep.include(
        inputWithoutProspectId
      );

      // Check that the ADD_ITEM event was fired successfully:
      // 1 - Event was fired once!
      expect(eventTracker.callCount).to.equal(1);
      // 2 - Event has the right type.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.ADD_ITEM
      );
      // 3- Event has the right entity passed to it.
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.externalId
      ).to.equal(result.data?.createApprovedCuratedCorpusItem.externalId);
    });

    it('should fail to create an approved item with a duplicate URL', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.ADD_ITEM, eventTracker);

      // Create an approved item with a set URL
      await createApprovedItemHelper(db, {
        title: 'I was here first!',
        url: 'https://test.com/docker',
      });

      // Attempt to create another item with the same URL
      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      expect(result.errors?.[0].message).to.contain(
        `An approved item with the URL "${input.url}" already exists`
      );
      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');

      // Check that the ADD_ITEM event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should fail to create an approved item if a rejected item with the same URL exists', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.ADD_ITEM, eventTracker);

      // Create an approved item with a set URL
      await createRejectedCuratedCorpusItemHelper(db, {
        title: 'I was here first!',
        url: 'https://test.com/docker',
      });

      // Attempt to create another item with the same URL
      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      expect(result.errors?.[0].message).to.contain(
        `A rejected item with the URL "${input.url}" already exists`
      );
      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');

      // Check that the ADD_ITEM event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should create an optional scheduled item', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.ADD_ITEM, eventTracker);
      eventEmitter.on(ScheduledCorpusItemEventType.ADD_SCHEDULE, eventTracker);

      // extra inputs
      input.scheduledDate = '2100-01-01';
      input.scheduledSurfaceGuid = 'NEW_TAB_EN_US';

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation

      // We only return the approved item here, so need to purge the scheduling
      // input values from the input before comparison.
      delete input.scheduledDate;
      delete input.scheduledSurfaceGuid;
      expect(result.data?.createApprovedCuratedCorpusItem).to.deep.include(
        input
      );

      // NB: we don't (yet) return anything for the scheduled item,
      // but if the mutation does not fall over, that means it has been created
      // successfully.

      // Check that both ADD_ITEM and ADD_SCHEDULE events were fired successfully:
      // 1 - Two events were fired!
      expect(eventTracker.callCount).to.equal(2);

      // 2 - Events have the right types.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.ADD_ITEM
      );
      expect(await eventTracker.getCall(1).args[0].eventType).to.equal(
        ScheduledCorpusItemEventType.ADD_SCHEDULE
      );

      // 3- Events have the right entities passed to it.
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.externalId
      ).to.equal(result.data?.createApprovedCuratedCorpusItem.externalId);

      // Since we don't return the scheduled item alongside the curated item
      // in the result of this mutation, there is no exact value to compare it to.
      // Let's just make sure it is there at all.
      expect(
        await eventTracker.getCall(1).args[0].scheduledCorpusItem.externalId
      ).to.not.be.null;
    });

    it('should not create a scheduled entry for an approved item with invalid Scheduled Surface GUID supplied', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.ADD_ITEM, eventTracker);

      // extra inputs
      input.scheduledDate = '2100-01-01';
      input.scheduledSurfaceGuid = 'RECSAPI';

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;

      // And there is the right error from the resolvers
      expect(result.errors?.[0].message).to.contain(
        `Cannot create a scheduled entry with Scheduled Surface GUID of "${input.scheduledSurfaceGuid}".`
      );
      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');

      // Check that the ADD_ITEM event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });
  });

  describe('updateApprovedCuratedCorpusItem mutation', () => {
    let item: ApprovedItem;
    let input: UpdateApprovedItemInput;

    beforeEach(async () => {
      item = await createApprovedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
        status: CuratedStatus.RECOMMENDATION,
        language: 'en',
      });

      input = {
        externalId: item.externalId,
        title: 'Anything but LEGO',
        excerpt: 'Updated excerpt',
        status: CuratedStatus.CORPUS,
        imageUrl: 'https://test.com/image.png',
        language: 'de',
        publisher: 'Cloud Factory',
        topic: 'Business',
        isTimeSensitive: true,
      };
    });

    it('should succeed if user has full access', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.UPDATE_ITEM, eventTracker);

      const { data } = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: { data: input },
      });

      // External ID should be unchanged
      expect(data?.updateApprovedCuratedCorpusItem.externalId).to.equal(
        item.externalId
      );

      // Updated properties should be... updated
      expect(data?.updateApprovedCuratedCorpusItem).to.deep.include(input);

      // Check that the UPDATE_ITEM event was fired successfully:
      // 1 - Event was fired once!
      expect(eventTracker.callCount).to.equal(1);
      // 2 - Event has the right type.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.UPDATE_ITEM
      );
      // 3- Event has the right entity passed to it.
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.externalId
      ).to.equal(data?.updateApprovedCuratedCorpusItem.externalId);
    });

    it('should succeed if user has access to one of scheduled surfaces', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENGB}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);
      await server.start();

      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.UPDATE_ITEM, eventTracker);

      const { data } = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: { data: input },
      });

      // External ID should be unchanged
      expect(data?.updateApprovedCuratedCorpusItem.externalId).to.equal(
        item.externalId
      );

      // Updated properties should be... updated
      expect(data?.updateApprovedCuratedCorpusItem).to.deep.include(input);

      // Check that the UPDATE_ITEM event was fired successfully:
      // 1 - Event was fired once!
      expect(eventTracker.callCount).to.equal(1);
      // 2 - Event has the right type.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.UPDATE_ITEM
      );
      // 3- Event has the right entity passed to it.
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.externalId
      ).to.equal(data?.updateApprovedCuratedCorpusItem.externalId);

      await server.stop();
    });

    it('should fail if request headers are not supplied', async () => {
      // With the default context, the headers are empty
      const server = getServer(eventEmitter);
      await server.start();

      const result = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it("should fail if user doesn't have access to any of scheduled surfaces", async () => {
      // Set up auth headers with access to something irrelevant here, such as collections
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.COLLECTION_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);
      await server.start();

      const result = await server.executeOperation({
        query: UPDATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });
  });

  describe('rejectApprovedCuratedCorpusItem mutation', () => {
    it('moves a corpus item from the approved corpus to the rejection pile', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REMOVE_ITEM, eventTracker);
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      const item = await createApprovedItemHelper(db, {
        title: '15 Unheard Ways To Achieve Greater Terraform',
        status: CuratedStatus.RECOMMENDATION,
        language: 'en',
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
      expect(result.data?.rejectApprovedCuratedCorpusItem.externalId).to.equal(
        item.externalId
      );

      // There should be a rejected item created. Since we always truncate
      // the database before every test, it is safe to assume that the
      // `getRejectedCuratedCorpusItems` query will contain the one item
      // that was created by this mutation.
      const { data: queryData } = await server.executeOperation({
        query: GET_REJECTED_ITEMS,
      });
      // There should be one rejected item in there...
      expect(queryData?.getRejectedCuratedCorpusItems.totalCount).to.equal(1);
      // ...and its URL should match that of the deleted Approved Item.
      expect(
        queryData?.getRejectedCuratedCorpusItems.edges[0].node.url
      ).to.equal(item.url);

      // Check that the REMOVE_ITEM and REJECT_ITEM events were fired successfully.
      expect(eventTracker.callCount).to.equal(2);

      // The REMOVE_ITEM event sends up-to-date info on the Approved Item.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.REMOVE_ITEM
      );
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.externalId
      ).to.equal(result.data?.rejectApprovedCuratedCorpusItem.externalId);

      // The REJECT_ITEM event sends through the newly created Rejected Item.
      expect(await eventTracker.getCall(1).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.REJECT_ITEM
      );
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.url
      ).to.equal(queryData?.getRejectedCuratedCorpusItems.edges[0].node.url);
    });

    it('should fail if externalId of approved item is not valid', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REMOVE_ITEM, eventTracker);
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      const input: RejectApprovedItemInput = {
        externalId: 'this-id-does-not-exist',
        reason: 'MISINFORMATION,OTHER',
      };

      const result = await server.executeOperation({
        query: REJECT_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.null;

      expect(result.errors?.[0].message).to.equal(
        `Could not find an approved item with external id of "${input.externalId}".`
      );
      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');

      // Check that the events were not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should fail if approved item has Scheduled Surface scheduled entries', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REMOVE_ITEM, eventTracker);
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      const item = await createApprovedItemHelper(db, {
        title: 'More Unheard Ways To Achieve Greater Terraform',
        status: CuratedStatus.CORPUS,
        language: 'en',
      });

      // Add an entry to a Scheduled Surface - approved item now can't be deleted
      // for data integrity reasons.
      await createScheduledItemHelper(db, {
        approvedItem: item,
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
      });

      const input: RejectApprovedItemInput = {
        externalId: item.externalId,
        reason: 'MISINFORMATION,OTHER',
      };

      const result = await server.executeOperation({
        query: REJECT_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.null;

      expect(result.errors?.[0].message).to.equal(
        `Cannot remove item from approved corpus - scheduled entries exist.`
      );
      expect(result.errors?.[0].extensions?.code).to.equal(
        'INTERNAL_SERVER_ERROR'
      );

      // Check that the events were not fired
      expect(eventTracker.callCount).to.equal(0);
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

    it('it should execute the mutation without errors and return the s3 location url', async () => {
      const image: Upload = new Upload();

      image.resolve({
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: () => createReadStream(testFilePath),
      });

      const { data, errors } = await server.executeOperation({
        query: UPLOAD_APPROVED_ITEM_IMAGE,
        variables: {
          image: image,
        },
      });

      const urlPrefix = config.aws.s3.localEndpoint;
      const urlPattern = new RegExp(
        `^${urlPrefix}/${config.aws.s3.bucket}/.+.jpeg$`
      );

      expect(errors).to.be.undefined;
      expect(data).to.have.keys('uploadApprovedCuratedCorpusItemImage');
      expect(data?.uploadApprovedCuratedCorpusItemImage.url).to.match(
        urlPattern
      );
    });
  });
});

describe('mutations: ApprovedItem - authentication checks', () => {
  const eventEmitter = new CuratedCorpusEventEmitter();

  // a standard set of inputs for this mutation
  const input: CreateApprovedItemInput = {
    prospectId: '123-abc',
    title: 'Find Out How I Cured My Docker In 2 Days',
    url: 'https://test.com/docker',
    excerpt: 'A short summary of what this story is about',
    status: CuratedStatus.CORPUS,
    imageUrl: 'https://test.com/image.png',
    language: 'de',
    publisher: 'Convective Cloud',
    topic: 'Technology',
    isCollection: false,
    isTimeSensitive: true,
    isSyndicated: false,
  };

  describe('createApprovedCuratedCorpusItem mutation', () => {
    it('should succeed if user has access to one of scheduled surfaces', async () => {
      // set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.ADD_ITEM, eventTracker);

      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENGB}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);
      await server.start();

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createApprovedCuratedCorpusItem).to.deep.include(
        input
      );

      // Check that the ADD_ITEM event was fired successfully:
      // 1 - Event was fired once!
      expect(eventTracker.callCount).to.equal(1);
      // 2 - Event has the right type.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.ADD_ITEM
      );
      // 3- Event has the right entity passed to it.
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.externalId
      ).to.equal(result.data?.createApprovedCuratedCorpusItem.externalId);

      await server.stop();
    });

    it('should fail if request headers are not supplied', async () => {
      // With the default context, the headers are empty
      const server = getServer(eventEmitter);
      await server.start();

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it("should fail if user doesn't have access to any of scheduled surfaces", async () => {
      // Set up auth headers with access to something irrelevant here, such as collections
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.COLLECTION_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);
      await server.start();

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should fail optional scheduling if user has no access to relevant scheduled surface', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_DEDE}`,
      };

      const server = getServerWithMockedHeaders(headers, eventEmitter);
      await server.start();

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

      await server.stop();
    });
  });

  describe('rejectApprovedItem mutation', () => {
    it('should successfully reject an approved item when the user has access to at least one scheduled surface ', async () => {
      // Set up auth headers with access to a single Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENGB}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const item = await createApprovedItemHelper(db, {
        title: '15 Unheard Ways To Achieve Greater Terraform',
        status: CuratedStatus.RECOMMENDATION,
        language: 'en',
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
      expect(result.data?.rejectApprovedCuratedCorpusItem.externalId).to.equal(
        item.externalId
      );

      await server.stop();
    });

    it('should throw an error when the user has no access any scheduled surface ', async () => {
      // Set up auth headers without access to any Scheduled Surface
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

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

      await server.stop();
    });

    it('should throw an error when the user has only read-only access ', async () => {
      // Set up auth headers with read-only access
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

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

      await server.stop();
    });

    it('should throw an error when the request headers are undefined  ', async () => {
      // pass in empty object for headers
      const server = getServerWithMockedHeaders({});
      await server.start();

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

      await server.stop();
    });
  });
});

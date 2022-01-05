import config from '../../../config';
import { CuratedStatus } from '@prisma/client';
import { expect } from 'chai';
import sinon from 'sinon';
import { db, getServer } from '../../../test/admin-server';
import {
  clearDb,
  createApprovedItemHelper,
  createRejectedCuratedCorpusItemHelper,
  createScheduledItemHelper,
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

describe('mutations: ApprovedItem', () => {
  const eventEmitter = new CuratedCorpusEventEmitter();
  const server = getServer(eventEmitter);

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
      isShortLived: true,
      isSyndicated: false,
    };

    it('creates an approved item with all inputs supplied', async () => {
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
      if (result.errors) {
        expect(result.errors[0].message).to.contain(
          `An approved item with the URL "${input.url}" already exists`
        );
        expect(result.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
      }

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
      if (result.errors) {
        expect(result.errors[0].message).to.contain(
          `A rejected item with the URL "${input.url}" already exists`
        );
        expect(result.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
      }

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
      input.newTabGuid = 'EN_US';

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
      delete input.newTabGuid;
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

    it('should not create a scheduled entry for an approved item with invalid New Tab id supplied', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.ADD_ITEM, eventTracker);

      // extra inputs
      input.scheduledDate = '2100-01-01';
      input.newTabGuid = 'RECSAPI';

      const result = await server.executeOperation({
        query: CREATE_APPROVED_ITEM,
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;

      // And there is the right error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.contain(
          `Cannot create a scheduled entry with New Tab GUID of "${input.newTabGuid}".`
        );
        expect(result.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
      }

      // Check that the ADD_ITEM event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });
  });

  describe('updateApprovedCuratedCorpusItem mutation', () => {
    it('updates an approved item when required variables are supplied', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.UPDATE_ITEM, eventTracker);

      const item = await createApprovedItemHelper(db, {
        title: "3 Things Everyone Knows About LEGO That You Don't",
        status: CuratedStatus.RECOMMENDATION,
        language: 'en',
      });

      const input: UpdateApprovedItemInput = {
        externalId: item.externalId,
        prospectId: '123-abc',
        title: 'Anything but LEGO',
        excerpt: 'Updated excerpt',
        status: CuratedStatus.CORPUS,
        imageUrl: 'https://test.com/image.png',
        language: 'de',
        publisher: 'Cloud Factory',
        topic: 'Business',
        isShortLived: true,
      };

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

      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `Could not find an approved item with external id of "${input.externalId}".`
        );
        expect(result.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
      }

      // Check that the events were not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should fail if approved item has New Tab scheduled entries', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REMOVE_ITEM, eventTracker);
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      const item = await createApprovedItemHelper(db, {
        title: 'More Unheard Ways To Achieve Greater Terraform',
        status: CuratedStatus.CORPUS,
        language: 'en',
      });

      // Add an entry to a New Tab - approved item now can't be deleted
      // for data integrity reasons.
      await createScheduledItemHelper(db, {
        approvedItem: item,
        newTabGuid: 'EN_US',
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

      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `Cannot remove item from approved corpus - scheduled entries exist.`
        );
        expect(result.errors[0].extensions?.code).to.equal(
          'INTERNAL_SERVER_ERROR'
        );
      }

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

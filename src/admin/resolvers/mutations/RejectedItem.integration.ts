import { expect } from 'chai';
import sinon from 'sinon';
import { db, getServer } from '../../../test/admin-server';
import {
  clearDb,
  createApprovedItemHelper,
  createRejectedCuratedCorpusItemHelper,
} from '../../../test/helpers';
import { CREATE_REJECTED_ITEM } from '../../../test/admin-server/mutations.gql';
import { CreateRejectedItemInput } from '../../../database/types';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { ReviewedCorpusItemEventType } from '../../../events/types';

describe('mutations: RejectedItem', () => {
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

  describe('createRejectedCuratedCorpusItem mutation', () => {
    // a standard set of inputs for this mutation
    const input: CreateRejectedItemInput = {
      prospectId: '123-abc',
      url: 'https://test.com/docker',
      title: 'Find Out How I Cured My Docker In 2 Days',
      topic: 'Technology',
      language: 'de',
      publisher: 'Convective Cloud',
      reason: 'MISINFORMATION,OTHER',
    };

    it('creates a rejected item with all inputs supplied', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: input,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createRejectedCuratedCorpusItem).to.deep.include(
        input
      );

      // Check that the REJECT_ITEM event was fired successfully:
      // 1 - Event was fired once.
      expect(eventTracker.callCount).to.equal(1);
      // 2 - Event has the right type.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ReviewedCorpusItemEventType.REJECT_ITEM
      );
      // 3- Event has the right entity passed to it.
      expect(
        await eventTracker.getCall(0).args[0].reviewedCorpusItem.externalId
      ).to.equal(result.data?.createRejectedCuratedCorpusItem.externalId);
    });

    it('should fail to create a rejected item with a duplicate URL', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      // Create a rejected item with a set URL
      await createRejectedCuratedCorpusItemHelper(db, {
        title: 'I was here first!',
        url: 'https://test.com/docker',
      });

      // Attempt to create another item with the same URL
      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.contain(
          `A rejected item with the URL "${input.url}" already exists.`
        );
        expect(result.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
      }

      // Check that the REJECT_ITEM event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should fail to create a rejected item if URL is in approved corpus', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      // Create an approved item with a set URL
      await createApprovedItemHelper(db, {
        title: 'I was here first!',
        url: 'https://test.com/docker',
      });

      // Attempt to create another item with the same URL
      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.contain(
          `An approved item with the URL "${input.url}" already exists.`
        );
        expect(result.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
      }

      // Check that the REJECT_ITEM event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });
  });
});

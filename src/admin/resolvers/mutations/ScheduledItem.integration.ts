import { expect } from 'chai';
import sinon from 'sinon';
import { db, getServer } from '../../../test/admin-server';
import {
  clearDb,
  createApprovedItemHelper,
  createScheduledItemHelper,
} from '../../../test/helpers';
import {
  CREATE_SCHEDULED_ITEM,
  DELETE_SCHEDULE_ITEM,
} from '../../../test/admin-server/mutations.gql';
import {
  CreateScheduledItemInput,
  DeleteScheduledItemInput,
} from '../../../database/types';
import { getUnixTimestamp } from '../fields/UnixTimestamp';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { ScheduledCorpusItemEventType } from '../../../events/types';

describe('mutations: NewTabFeedSchedule', () => {
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

  describe('createScheduledCuratedCorpusItem mutation', () => {
    it('should fail on invalid New Tab Feed ID', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ScheduledCorpusItemEventType.ADD_SCHEDULE, eventTracker);

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'A test story',
      });
      const input: CreateScheduledItemInput = {
        approvedItemExternalId: approvedItem.externalId,
        newTabGuid: 'RECSAPI',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: input,
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `Cannot create a scheduled entry with New Tab GUID of "RECSAPI".`
        );
      }

      // Check that the ADD_SCHEDULE event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should fail on invalid Approved Item ID', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ScheduledCorpusItemEventType.ADD_SCHEDULE, eventTracker);

      const input: CreateScheduledItemInput = {
        approvedItemExternalId: 'not-a-valid-id-at-all',
        newTabGuid: 'EN_US',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: input,
      });

      expect(result.data).to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `Cannot create a scheduled entry: Approved Item with id "not-a-valid-id-at-all" does not exist.`
        );
      }

      // Check that the ADD_SCHEDULE event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should create an entry and return data (including Approved Item)', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ScheduledCorpusItemEventType.ADD_SCHEDULE, eventTracker);

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'A test story',
      });

      const input: CreateScheduledItemInput = {
        approvedItemExternalId: approvedItem.externalId,
        newTabGuid: 'EN_US',
        scheduledDate: '2100-01-01',
      };

      const { data } = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: input,
      });

      const scheduledItem = data?.createScheduledCuratedCorpusItem;

      // Expect these fields to return valid values
      expect(scheduledItem.externalId).to.not.be.null;
      expect(scheduledItem.createdAt).to.not.be.null;
      expect(scheduledItem.updatedAt).to.not.be.null;

      // Expect these to match the input values
      expect(new Date(scheduledItem.scheduledDate)).to.deep.equal(
        new Date(input.scheduledDate)
      );

      // Finally, let's compare the returned ApprovedItem object to our inputs.
      // Need to destructure timestamps and compare them separately
      // as Prisma will convert to ISO string for comparison
      // and GraphQL server returns Unix timestamps.
      const { createdAt, updatedAt, ...otherApprovedItemProps } = approvedItem;
      const {
        createdAt: createdAtReturned,
        updatedAt: updatedAtReturned,
        ...otherReturnedApprovedItemProps
      } = scheduledItem.approvedItem;
      expect(getUnixTimestamp(createdAt)).to.equal(createdAtReturned);
      expect(getUnixTimestamp(updatedAt)).to.equal(updatedAtReturned);
      expect(otherApprovedItemProps).to.deep.include(
        otherReturnedApprovedItemProps
      );

      // Check that the ADD_SCHEDULE event was fired successfully:
      // 1 - Event was fired once!
      expect(eventTracker.callCount).to.equal(1);
      // 2 - Event has the right type.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ScheduledCorpusItemEventType.ADD_SCHEDULE
      );
      // 3- Event has the right entity passed to it.
      expect(
        await eventTracker.getCall(0).args[0].scheduledCorpusItem.externalId
      ).to.equal(scheduledItem.externalId);
    });
  });

  describe('deleteScheduledCuratedCorpusItem mutation', () => {
    it('should fail on invalid external ID', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(
        ScheduledCorpusItemEventType.REMOVE_SCHEDULE,
        eventTracker
      );

      const input: DeleteScheduledItemInput = {
        externalId: 'not-a-valid-ID-string',
      };

      const result = await server.executeOperation({
        query: DELETE_SCHEDULE_ITEM,
        variables: input,
      });

      expect(result.data).to.be.null;

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).to.equal(
          `Item with ID of '${input.externalId}' could not be found.`
        );
      }

      // Check that the REMOVE_SCHEDULE event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should delete an item scheduled for New Tab and return deleted data', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(
        ScheduledCorpusItemEventType.REMOVE_SCHEDULE,
        eventTracker
      );

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'This is a test',
      });

      const scheduledItem = await createScheduledItemHelper(db, {
        newTabGuid: 'EN_US',
        approvedItem,
      });

      const { data } = await server.executeOperation({
        query: DELETE_SCHEDULE_ITEM,
        variables: { externalId: scheduledItem.externalId },
      });

      // The shape of the Prisma objects the above helpers return doesn't quite match
      // the type we return in GraphQL (for example, IDs stay internal, we attach an
      // ApprovedItem, so until there is a query to retrieve the scheduled item
      // of the right shape (if it's ever implemented), laborious property-by-property
      // comparison is the go.
      const returnedItem = data?.deleteScheduledCuratedCorpusItem;
      expect(returnedItem.externalId).to.equal(scheduledItem.externalId);
      expect(returnedItem.createdBy).to.equal(scheduledItem.createdBy);
      expect(returnedItem.updatedBy).to.equal(scheduledItem.updatedBy);

      expect(returnedItem.createdAt).to.equal(
        getUnixTimestamp(scheduledItem.createdAt)
      );
      expect(returnedItem.updatedAt).to.equal(
        getUnixTimestamp(scheduledItem.updatedAt)
      );

      expect(new Date(returnedItem.scheduledDate)).to.deep.equal(
        scheduledItem.scheduledDate
      );

      // Finally, let's compare the returned ApprovedItem object to our inputs.
      // Need to destructure timestamps and compare them separately
      // as Prisma will convert to ISO string for comparison
      // and GraphQL server returns Unix timestamps.
      const { createdAt, updatedAt, ...otherApprovedItemProps } = approvedItem;
      const {
        createdAt: createdAtReturned,
        updatedAt: updatedAtReturned,
        ...otherReturnedApprovedItemProps
      } = returnedItem.approvedItem;
      expect(getUnixTimestamp(createdAt)).to.equal(createdAtReturned);
      expect(getUnixTimestamp(updatedAt)).to.equal(updatedAtReturned);
      expect(otherApprovedItemProps).to.deep.include(
        otherReturnedApprovedItemProps
      );

      // Check that the REMOVE_SCHEDULE event was fired successfully:
      // 1 - Event was fired once!
      expect(eventTracker.callCount).to.equal(1);
      // 2 - Event has the right type.
      expect(await eventTracker.getCall(0).args[0].eventType).to.equal(
        ScheduledCorpusItemEventType.REMOVE_SCHEDULE
      );
      // 3- Event has the right entity passed to it.
      expect(
        await eventTracker.getCall(0).args[0].scheduledCorpusItem.externalId
      ).to.equal(scheduledItem.externalId);
    });
  });
});

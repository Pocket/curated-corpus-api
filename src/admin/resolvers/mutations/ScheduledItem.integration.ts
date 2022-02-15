import { expect } from 'chai';
import sinon from 'sinon';
import { db } from '../../../test/admin-server';
import {
  clearDb,
  createApprovedItemHelper,
  createScheduledItemHelper,
} from '../../../test/helpers';
import {
  CREATE_SCHEDULED_ITEM,
  DELETE_SCHEDULED_ITEM,
} from './sample-mutations.gql';
import {
  CreateScheduledItemInput,
  DeleteScheduledItemInput,
} from '../../../database/types';
import { getUnixTimestamp } from '../fields/UnixTimestamp';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { ScheduledCorpusItemEventType } from '../../../events/types';
import { DateTime } from 'luxon';
import { getServerWithMockedHeaders } from '../../../test/helpers';
import { ACCESS_DENIED_ERROR, MozillaAccessGroup } from '../../../shared/types';

describe('mutations: ScheduledItem', () => {
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

  describe('createScheduledCuratedCorpusItem mutation', () => {
    it('should fail on invalid Scheduled Surface GUID', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ScheduledCorpusItemEventType.ADD_SCHEDULE, eventTracker);

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'A test story',
      });
      const input: CreateScheduledItemInput = {
        approvedItemExternalId: approvedItem.externalId,
        scheduledSurfaceGuid: 'RECSAPI',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      expect(result.errors?.[0].message).to.contain(
        `Cannot create a scheduled entry with Scheduled Surface GUID of "RECSAPI".`
      );
      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');

      // Check that the ADD_SCHEDULE event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should fail on invalid Approved Item ID', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ScheduledCorpusItemEventType.ADD_SCHEDULE, eventTracker);

      const input: CreateScheduledItemInput = {
        approvedItemExternalId: 'not-a-valid-id-at-all',
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;

      // And there is the correct error from the resolvers
      expect(result.errors?.[0].message).to.contain(
        `Cannot create a scheduled entry: Approved Item with id "not-a-valid-id-at-all" does not exist.`
      );
      expect(result.errors?.[0].extensions?.code).to.equal(
        'INTERNAL_SERVER_ERROR'
      );

      // Check that the ADD_SCHEDULE event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should fail if story is already scheduled for given Scheduled Surface/date combination', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ScheduledCorpusItemEventType.ADD_SCHEDULE, eventTracker);

      // create a sample curated item
      const item = await createApprovedItemHelper(db, {
        title: 'A test story',
      });

      // create a scheduled entry for this item
      const existingScheduledEntry = await createScheduledItemHelper(db, {
        approvedItem: item,
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
      });

      // This is the date format for the GraphQL mutation.
      const scheduledDate = DateTime.fromJSDate(
        existingScheduledEntry.scheduledDate
      ).toFormat('yyyy-MM-dd');

      // And this human-readable (and cross-locale understandable) format
      // is used in the error message we're anticipating to get.
      const displayDate = DateTime.fromJSDate(
        existingScheduledEntry.scheduledDate
      ).toFormat('MMM d, y');

      // Set up the input for the mutation that contains the exact same values
      // as the scheduled entry created above.
      const input: CreateScheduledItemInput = {
        approvedItemExternalId: item.externalId,
        scheduledSurfaceGuid: existingScheduledEntry.scheduledSurfaceGuid,
        scheduledDate,
      };

      const result = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;

      // Expecting to see a custom error message from the resolver
      expect(result.errors?.[0].message).to.contain(
        `This story is already scheduled to appear on NEW_TAB_EN_US on ${displayDate}.`
      );
      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');

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
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        scheduledDate: '2100-01-01',
      };

      const { data } = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: { data: input },
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

    it('should fail if user has read-only access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'A test story',
      });

      const input: CreateScheduledItemInput = {
        approvedItemExternalId: approvedItem.externalId,
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;

      expect(result.errors).not.to.be.null;

      // And there is an access denied error
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it("should fail if user doesn't have access to specified scheduled surface", async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_DEDE}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'A test story',
      });

      const input: CreateScheduledItemInput = {
        approvedItemExternalId: approvedItem.externalId,
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;

      expect(result.errors).not.to.be.null;

      // And there is an access denied error
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should succeed if user has access to specified scheduled surface', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'A test story',
      });

      const input: CreateScheduledItemInput = {
        approvedItemExternalId: approvedItem.externalId,
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_SCHEDULED_ITEM,
        variables: { data: input },
      });

      // Hooray! There is data
      expect(result.data).not.to.be.null;

      // And no errors, too!
      expect(result.errors).to.be.undefined;

      await server.stop();
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
        query: DELETE_SCHEDULED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;

      // And there is the correct error from the resolvers
      expect(result.errors?.[0].message).to.contain(
        `Item with ID of '${input.externalId}' could not be found.`
      );
      expect(result.errors?.[0].extensions?.code).to.equal(
        'INTERNAL_SERVER_ERROR'
      );

      // Check that the REMOVE_SCHEDULE event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should delete an item scheduled for a Scheduled Surface and return deleted data', async () => {
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
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        approvedItem,
      });

      const { data } = await server.executeOperation({
        query: DELETE_SCHEDULED_ITEM,
        variables: { data: { externalId: scheduledItem.externalId } },
      });

      // The shape of the Prisma objects the above helpers return doesn't quite match
      // the type we return in GraphQL (for example, IDs stay internal, we attach an
      // ApprovedItem), so until there is a query to retrieve the scheduled item
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

    it('should fail if user has read-only access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'This is a test',
      });

      const scheduledItem = await createScheduledItemHelper(db, {
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        approvedItem,
      });

      const result = await server.executeOperation({
        query: DELETE_SCHEDULED_ITEM,
        variables: { data: { externalId: scheduledItem.externalId } },
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;

      expect(result.errors).not.to.be.null;

      // And there is an access denied error
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it("should fail if user doesn't have access to specified scheduled surface", async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_DEDE}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'This is a test',
      });

      const scheduledItem = await createScheduledItemHelper(db, {
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        approvedItem,
      });

      const result = await server.executeOperation({
        query: DELETE_SCHEDULED_ITEM,
        variables: { data: { externalId: scheduledItem.externalId } },
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;

      expect(result.errors).not.to.be.null;

      // And there is an access denied error
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should succeed if user has access to specified scheduled surface', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const approvedItem = await createApprovedItemHelper(db, {
        title: 'This is a test',
      });

      const scheduledItem = await createScheduledItemHelper(db, {
        scheduledSurfaceGuid: 'NEW_TAB_EN_US',
        approvedItem,
      });

      const result = await server.executeOperation({
        query: DELETE_SCHEDULED_ITEM,
        variables: { data: { externalId: scheduledItem.externalId } },
      });

      // Hooray! There is data
      expect(result.data).not.to.be.null;

      // And no errors, too!
      expect(result.errors).to.be.undefined;

      await server.stop();
    });
  });
});

import chai from 'chai';
import { db, server } from '../../../test/admin-server';
import {
  clearDb,
  createCuratedItemHelper,
  createNewTabScheduleHelper,
} from '../../../test/helpers';
import {
  CREATE_NEW_TAB_FEED_SCHEDULE,
  DELETE_NEW_TAB_FEED_SCHEDULE,
} from '../../../test/admin-server/mutations.gql';
import {
  CreateNewTabFeedScheduledItemInput,
  DeleteNewTabFeedScheduledItemInput,
} from '../../../database/types';
import { getUnixTimestamp } from '../fields/UnixTimestamp';

describe('mutations: NewTabFeedSchedule', () => {
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

  describe('createNewTabFeedScheduledItem mutation', () => {
    it('fails on invalid New Tab Feed ID', async () => {
      const curatedItem = await createCuratedItemHelper(db, {
        title: 'A test story',
      });
      const input: CreateNewTabFeedScheduledItemInput = {
        curatedItemExternalId: curatedItem.externalId,
        newTabGuid: 'RECSAPI',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_NEW_TAB_FEED_SCHEDULE,
        variables: input,
      });

      expect(result.data).toBeNull();
      expect(result.errors).not.toBeNull();

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).toMatch(
          `Cannot create a scheduled entry with New Tab GUID of "RECSAPI".`
        );
      }
    });

    it('fails on invalid Curated Item ID', async () => {
      const input: CreateNewTabFeedScheduledItemInput = {
        curatedItemExternalId: 'not-a-valid-id-at-all',
        newTabGuid: 'EN_US',
        scheduledDate: '2100-01-01',
      };

      const result = await server.executeOperation({
        query: CREATE_NEW_TAB_FEED_SCHEDULE,
        variables: input,
      });

      expect(result.data).toBeNull();

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).toMatch(
          `Cannot create a scheduled entry: Curated Item with id "not-a-valid-id-at-all" does not exist.`
        );
      }
    });

    it('should create an entry and return data (including Curated Item)', async () => {
      const curatedItem = await createCuratedItemHelper(db, {
        title: 'A test story',
      });

      const input: CreateNewTabFeedScheduledItemInput = {
        curatedItemExternalId: curatedItem.externalId,
        newTabGuid: 'EN_US',
        scheduledDate: '2100-01-01',
      };

      const { data } = await server.executeOperation({
        query: CREATE_NEW_TAB_FEED_SCHEDULE,
        variables: input,
      });

      const scheduledItem = data?.createNewTabFeedScheduledItem;

      // Expect these fields to return valid values
      expect(scheduledItem.externalId).toBeTruthy();
      expect(scheduledItem.createdAt).toBeTruthy();
      expect(scheduledItem.updatedAt).toBeTruthy();

      // Expect these to match the input values
      expect(new Date(scheduledItem.scheduledDate)).toMatchObject(
        new Date(input.scheduledDate)
      );

      // Finally, let's compare the returned CuratedItem object to our inputs.
      // Need to destructure timestamps and compare them separately
      // as Prisma will convert to ISO string for comparison
      // and GraphQL server returns Unix timestamps.
      const { createdAt, updatedAt, ...otherCuratedItemProps } = curatedItem;
      const {
        createdAt: createdAtReturned,
        updatedAt: updatedAtReturned,
        ...otherReturnedCuratedItemProps
      } = scheduledItem.curatedItem;
      chai.expect(getUnixTimestamp(createdAt)).to.equal(createdAtReturned);
      chai.expect(getUnixTimestamp(updatedAt)).to.equal(updatedAtReturned);
      chai
        .expect(otherCuratedItemProps)
        .to.deep.include(otherReturnedCuratedItemProps);
    });
  });

  describe('deleteNewTabFeedScheduledItem mutation', () => {
    it('fails on invalid external ID', async () => {
      const input: DeleteNewTabFeedScheduledItemInput = {
        externalId: 'not-a-valid-ID-string',
      };

      const result = await server.executeOperation({
        query: DELETE_NEW_TAB_FEED_SCHEDULE,
        variables: input,
      });

      expect(result.data).toBeNull();

      // And there is the correct error from the resolvers
      if (result.errors) {
        expect(result.errors[0].message).toMatch(
          `Item with ID of '${input.externalId}' could not be found.`
        );
      }
    });

    it('should delete an item scheduled for New Tab and return deleted data', async () => {
      const curatedItem = await createCuratedItemHelper(db, {
        title: 'This is a test',
      });

      const scheduledItem = await createNewTabScheduleHelper(db, {
        newTabGuid: 'EN_US',
        curatedItem,
      });

      const { data } = await server.executeOperation({
        query: DELETE_NEW_TAB_FEED_SCHEDULE,
        variables: { externalId: scheduledItem.externalId },
      });

      // The shape of the Prisma objects the above helpers return doesn't quite match
      // the type we return in GraphQL (for example, IDs stay internal, we attach a
      // CuratedItem, so until there is a query to retrieve the scheduled item
      // of the right shape (if it's ever implemented), laborious property-by-property
      // comparison is the go.
      const returnedItem = data?.deleteNewTabFeedScheduledItem;
      expect(returnedItem.externalId).toBe(scheduledItem.externalId);
      expect(returnedItem.createdBy).toBe(scheduledItem.createdBy);
      expect(returnedItem.updatedBy).toBe(scheduledItem.updatedBy);

      chai
        .expect(returnedItem.createdAt)
        .to.equal(getUnixTimestamp(scheduledItem.createdAt));
      chai
        .expect(returnedItem.updatedAt)
        .to.equal(getUnixTimestamp(scheduledItem.updatedAt));

      expect(new Date(returnedItem.scheduledDate)).toMatchObject(
        scheduledItem.scheduledDate
      );

      // Finally, let's compare the returned CuratedItem object to our inputs.
      // Need to destructure timestamps and compare them separately
      // as Prisma will convert to ISO string for comparison
      // and GraphQL server returns Unix timestamps.
      const { createdAt, updatedAt, ...otherCuratedItemProps } = curatedItem;
      const {
        createdAt: createdAtReturned,
        updatedAt: updatedAtReturned,
        ...otherReturnedCuratedItemProps
      } = returnedItem.curatedItem;
      chai.expect(getUnixTimestamp(createdAt)).to.equal(createdAtReturned);
      chai.expect(getUnixTimestamp(updatedAt)).to.equal(updatedAtReturned);
      chai
        .expect(otherCuratedItemProps)
        .to.deep.include(otherReturnedCuratedItemProps);
    });
  });
});

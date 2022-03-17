import { expect } from 'chai';
import sinon from 'sinon';
import { db } from '../../../test/admin-server';
import {
  clearDb,
  createApprovedItemHelper,
  createRejectedCuratedCorpusItemHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { CREATE_REJECTED_ITEM } from './sample-mutations.gql';
import { CreateRejectedItemInput } from '../../../database/types';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { ReviewedCorpusItemEventType } from '../../../events/types';
import { ACCESS_DENIED_ERROR, MozillaAccessGroup } from '../../../shared/types';

describe('mutations: RejectedItem', () => {
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

  describe('createRejectedCuratedCorpusItem mutation', () => {
    // a standard set of inputs for this mutation
    let input: CreateRejectedItemInput;

    beforeEach(() => {
      // re-set input for each test (as tests may alter input)
      input = {
        prospectId: '123-abc',
        url: 'https://test.com/docker',
        title: 'Find Out How I Cured My Docker In 2 Days',
        topic: 'Technology',
        language: 'DE',
        publisher: 'Convective Cloud',
        reason: 'MISINFORMATION,OTHER',
      };
    });

    it('creates a rejected item with all inputs supplied', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createRejectedCuratedCorpusItem).to.deep.include(
        input
      );
      // Expect to see the SSO username in the `createdBy` field
      expect(result.data?.createRejectedCuratedCorpusItem.createdBy).to.equal(
        headers.username
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

    it('creates a rejected item without a prospectId', async () => {
      // Set up event tracking
      const eventTracker = sinon.fake();
      eventEmitter.on(ReviewedCorpusItemEventType.REJECT_ITEM, eventTracker);

      const inputWithoutProspectId = { ...input };
      delete inputWithoutProspectId.prospectId;

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: inputWithoutProspectId },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createRejectedCuratedCorpusItem).to.deep.include(
        inputWithoutProspectId
      );
      // Expect to see the SSO username in the `createdBy` field
      expect(result.data?.createRejectedCuratedCorpusItem.createdBy).to.equal(
        headers.username
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

    it('should create a rejected item if the user has access to at least one of the scheduled surfaces', async () => {
      const server = getServerWithMockedHeaders({
        ...headers,
        groups: `group-1,${MozillaAccessGroup.NEW_TAB_CURATOR_DEDE}`,
      });

      await server.start();

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;

      // Expect to see all the input data we supplied in the Approved Item
      // returned by the mutation
      expect(result.data?.createRejectedCuratedCorpusItem).to.deep.include(
        input
      );

      await server.stop();
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
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      expect(result.errors?.[0].message).to.contain(
        `A rejected item with the URL "${input.url}" already exists.`
      );
      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');

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
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.errors).not.to.be.null;

      // And there is the correct error from the resolvers
      expect(result.errors?.[0].message).to.contain(
        `An approved item with the URL "${input.url}" already exists.`
      );
      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');

      // Check that the REJECT_ITEM event was not fired
      expect(eventTracker.callCount).to.equal(0);
    });

    it('should throw an error if user has read-only access', async () => {
      const server = getServerWithMockedHeaders({
        ...headers,
        groups: MozillaAccessGroup.READONLY,
      });

      await server.start();

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      // ...without success. There is no data
      expect(result.data).to.be.null;

      expect(result.errors).not.to.be.null;
      // And there is an access denied error
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should throw an error if the user does not have any scheduled surface access', async () => {
      const server = getServerWithMockedHeaders({
        ...headers,
        groups: 'group-1, group-2',
      });

      await server.start();

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;

      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should throw an error if the request header groups are undefined', async () => {
      const server = getServerWithMockedHeaders({
        ...headers,
        groups: undefined,
      });

      await server.start();

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.data).to.be.null;

      expect(result.errors).not.to.be.null;
      expect(result.errors?.[0].message).to.contain(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should succeed with spaces in rejection reasons', async () => {
      input.reason = ' MISINFORMATION, OTHER ';

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data).not.to.be.null;
    });

    it('should fail when given an invalid rejection reason', async () => {
      input.reason = 'BADFONT';

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.undefined;
      expect(result.data).to.be.null;

      expect(result.errors?.[0].message).to.contain(
        ` is not a valid rejection reason.`
      );
    });

    it('should fail when given invalid rejection reasons', async () => {
      input.reason = 'BADFONT,BORINGCOLORS';

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.undefined;
      expect(result.data).to.be.null;

      expect(result.errors?.[0].message).to.contain(
        ` is not a valid rejection reason.`
      );
    });

    it('should fail when given valid and invalid rejection reasons', async () => {
      input.reason = 'MISINFORMATION,IDONTLIKEIT';

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.undefined;
      expect(result.data).to.be.null;

      expect(result.errors?.[0].message).to.contain(
        ` is not a valid rejection reason.`
      );
    });

    it('should fail if language code is outside of allowed values', async () => {
      input.language = 'ZZ';

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.undefined;
      expect(result.data).to.be.oneOf([null, undefined]);

      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');
      expect(result.errors?.[0].message).to.contain(
        'does not exist in "CorpusLanguage" enum.'
      );
    });

    it('should fail if language code is correct but not in upper case', async () => {
      input.language = 'de';

      const result = await server.executeOperation({
        query: CREATE_REJECTED_ITEM,
        variables: { data: input },
      });

      expect(result.errors).not.to.be.undefined;
      expect(result.data).to.be.oneOf([null, undefined]);

      expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');
      expect(result.errors?.[0].message).to.contain(
        'does not exist in "CorpusLanguage" enum.'
      );
    });
  });
});

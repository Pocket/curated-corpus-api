import { expect } from 'chai';
import { getServer } from '../../../test/public-server';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import {CORPUS_ITEM_REFERENCE_RESOLVER, GET_SCHEDULED_SURFACE} from './sample-queries.gql';
import {createApprovedItemHelper} from "../../../test/helpers";
import {db} from "../../../test/admin-server";
import {APPROVED_ITEM_REFERENCE_RESOLVER} from "../../../admin/resolvers/queries/sample-queries.gql";

describe('queries: ScheduledSurface', () => {
  const server = getServer(new CuratedCorpusEventEmitter());

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('CorpusItem reference resolver', () => {
    it('returns the approved item if it exists', async () => {
      // Create a few items with known URLs.
      const corpusItemInput = {
        title: 'Story one',
        url: 'https://www.sample-domain.com/what-zombies-can-teach-you-graphql',
      };

      const approvedItem = await createApprovedItemHelper(db, corpusItemInput);
      const corpusItemId = approvedItem.externalId;

      const result = await server.executeOperation({
        query: CORPUS_ITEM_REFERENCE_RESOLVER,
        variables: {
          representations: [
            {
              __typename: 'CorpusItem',
              id: corpusItemId,
            },
          ],
        },
      });

      expect(result.errors).to.be.undefined;

      expect(result.data).to.not.be.null;
      expect(result.data?._entities).to.have.lengthOf(1);
    });
  });

  it('should throw an error if the GUID provided is not known', async () => {
    const result = await server.executeOperation({
      query: GET_SCHEDULED_SURFACE,
      variables: { id: 'ABRACADABRA' },
    });

    // There should be errors
    expect(result.errors).not.to.be.null;

    expect(result.errors?.[0].message).to.contain(
      `Could not find Scheduled Surface with id of "ABRACADABRA"`
    );
    expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');
  });
});

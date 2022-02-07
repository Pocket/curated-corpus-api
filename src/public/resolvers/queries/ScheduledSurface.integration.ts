import { expect } from 'chai';
import { getServer } from '../../../test/public-server';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { GET_SCHEDULED_SURFACE } from './sample-queries.gql';

describe('queries: ScheduledSurface', () => {
  const server = getServer(new CuratedCorpusEventEmitter());

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('scheduledSurface query', () => {
    it('should get New Tab metadata for a given GUID', async () => {
      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACE,
        variables: { id: 'EN_GB' },
      });

      expect(data?.scheduledSurface.id).to.equal('EN_GB');
      expect(data?.scheduledSurface.name).to.equal('en-GB');
    });
  });

  it('should throw an error if the GUID provided is not known', async () => {
    const result = await server.executeOperation({
      query: GET_SCHEDULED_SURFACE,
      variables: { id: 'ABRACADABRA' },
    });

    // There should be errors
    expect(result.errors).not.to.be.null;

    if (result.errors) {
      expect(result.errors[0].message).to.contain(
        `Could not find Scheduled Surface with id of "ABRACADABRA"`
      );
      expect(result.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
    }
  });
});

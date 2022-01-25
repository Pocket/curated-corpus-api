import { expect } from 'chai';
import { getServer } from '../../../test/admin-server';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { GET_NEW_TABS_FOR_USER } from './sample-queries.gql';

describe('queries: NewTab', () => {
  const server = getServer(new CuratedCorpusEventEmitter());

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('getNewTabsForUser query', () => {
    it('should get all newtabs until we enable SSO', async () => {
      const { data } = await server.executeOperation({
        query: GET_NEW_TABS_FOR_USER,
      });

      const newTabs = data?.getNewTabsForUser;

      // we currently have two available new tabs
      expect(newTabs.length).to.equal(4);

      newTabs.forEach((newTab) => {
        expect(newTab.guid).not.to.be.undefined;
        expect(newTab.name).not.to.be.undefined;
        expect(newTab.utcOffset).not.to.be.undefined;
        expect(newTab.prospectTypes).not.to.be.undefined;
      });
    });
  });
});

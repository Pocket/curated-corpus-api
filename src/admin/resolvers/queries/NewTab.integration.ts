import { expect } from 'chai';
import { getServer } from '../../../test/admin-server';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { GET_NEW_TABS_FOR_USER } from '../../../test/admin-server/queries.gql';

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
      // the token below is the example from https://jwt.io/
      const { data } = await server.executeOperation({
        query: GET_NEW_TABS_FOR_USER,
        variables: {
          token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      });

      const newTabs = data?.getNewTabsForUser;

      // we currently have two available new tabs
      expect(newTabs.length).to.equal(2);

      newTabs.forEach((newTab) => {
        expect(newTab.guid).not.to.be.undefined;
        expect(newTab.name).not.to.be.undefined;
        expect(newTab.utcOffset).not.to.be.undefined;
        expect(newTab.prospectTypes).not.to.be.undefined;
      });
    });
  });
});

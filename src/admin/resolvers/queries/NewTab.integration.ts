import { expect } from 'chai';
import { getServerWithMockedHeaders } from '../../../test/helpers';
import { GET_SCHEDULED_SURFACES_FOR_USER } from './sample-queries.gql';
import { MozillaAccessGroup } from '../../../shared/types';

describe('queries: ScheduledSurface', () => {
  describe('getNewTabsForUser query', () => {
    it('should return all available surfaces for read-only users', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getNewTabsForUser;

      expect(scheduledSurfaces).to.have.lengthOf(4);

      scheduledSurfaces.forEach((scheduledSurface) => {
        expect(scheduledSurface.guid).not.to.be.undefined;
        expect(scheduledSurface.name).not.to.be.undefined;
        expect(scheduledSurface.utcOffset).not.to.be.undefined;
        expect(scheduledSurface.prospectTypes).not.to.be.undefined;
      });

      await server.stop();
    });

    it('should return all available surfaces for users with full access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.SCHEDULED_SURFACE_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getNewTabsForUser;

      expect(scheduledSurfaces).to.have.lengthOf(4);

      scheduledSurfaces.forEach((scheduledSurface) => {
        expect(scheduledSurface.guid).not.to.be.undefined;
        expect(scheduledSurface.name).not.to.be.undefined;
        expect(scheduledSurface.utcOffset).not.to.be.undefined;
        expect(scheduledSurface.prospectTypes).not.to.be.undefined;
      });

      await server.stop();
    });

    it('should return a single new tab for users with access to one new tab', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getNewTabsForUser;

      expect(scheduledSurfaces).to.have.lengthOf(1);
      expect(scheduledSurfaces[0].guid).to.equal('EN_US');

      await server.stop();
    });

    it('should return a limited set of new tabs for users with limited new tab access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS},${MozillaAccessGroup.NEW_TAB_CURATOR_DEDE}`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getNewTabsForUser;

      expect(scheduledSurfaces).to.have.lengthOf(2);
      expect(scheduledSurfaces[0].guid).to.equal('EN_US');
      expect(scheduledSurfaces[1].guid).to.equal('DE_DE');

      await server.stop();
    });

    it('should return no scheduled surfaces for users with no access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,group3`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getNewTabsForUser;

      expect(scheduledSurfaces).to.have.lengthOf(0);

      await server.stop();
    });
  });
});

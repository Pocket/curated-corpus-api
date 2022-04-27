import { expect } from 'chai';
import { getServerWithMockedHeaders } from '../../../test/helpers';
import { GET_SCHEDULED_SURFACES_FOR_USER } from './sample-queries.gql';
import { MozillaAccessGroup } from '../../../shared/types';

describe('auth: ScheduledSurface', () => {
  describe('getScheduledSurfacesForUser query', () => {
    it('should return all available surfaces for read-only users', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getScheduledSurfacesForUser;

      expect(scheduledSurfaces).to.have.lengthOf(scheduledSurfaces.length);

      scheduledSurfaces.forEach((scheduledSurface) => {
        expect(scheduledSurface.guid).not.to.be.undefined;
        expect(scheduledSurface.name).not.to.be.undefined;
        expect(scheduledSurface.ianaTimezone).not.to.be.undefined;
        expect(scheduledSurface.prospectTypes).not.to.be.undefined;
      });
    });

    it('should return all available surfaces for users with full access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.SCHEDULED_SURFACE_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getScheduledSurfacesForUser;

      expect(scheduledSurfaces).to.have.lengthOf(scheduledSurfaces.length);

      scheduledSurfaces.forEach((scheduledSurface) => {
        expect(scheduledSurface.guid).not.to.be.undefined;
        expect(scheduledSurface.name).not.to.be.undefined;
        expect(scheduledSurface.ianaTimezone).not.to.be.undefined;
        expect(scheduledSurface.prospectTypes).not.to.be.undefined;
      });
    });

    it('should return a single surface for users with access to one scheduled surface', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getScheduledSurfacesForUser;

      expect(scheduledSurfaces).to.have.lengthOf(1);
      expect(scheduledSurfaces[0].guid).to.equal('NEW_TAB_EN_US');
    });

    it('should return a limited set of scheduled surfaces for users with limited scheduled surface access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${MozillaAccessGroup.NEW_TAB_CURATOR_ENUS},${MozillaAccessGroup.NEW_TAB_CURATOR_DEDE}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getScheduledSurfacesForUser;

      expect(scheduledSurfaces).to.have.lengthOf(2);
      expect(scheduledSurfaces[0].guid).to.equal('NEW_TAB_EN_US');
      expect(scheduledSurfaces[1].guid).to.equal('NEW_TAB_DE_DE');
    });

    it('should return no scheduled surfaces for users with no access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,group3`,
      };

      const server = getServerWithMockedHeaders(headers);

      const { data } = await server.executeOperation({
        query: GET_SCHEDULED_SURFACES_FOR_USER,
      });

      const scheduledSurfaces = data?.getScheduledSurfacesForUser;

      expect(scheduledSurfaces).to.have.lengthOf(0);
    });
  });
});

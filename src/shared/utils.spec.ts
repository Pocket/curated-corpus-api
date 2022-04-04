import { MozillaAccessGroup } from './types';
import {
  getScheduledSurfaceByAccessGroup,
  getScheduledSurfaceByGuid,
  toUtcDateString,
} from './utils';

describe('shared/utils', () => {
  describe('toUtcDateString', () => {
    it('should convert to YYYY-MM-DD UTC for zero-padded months', async () => {
      const date = new Date(1647042571000); // 2022-03-11 23:49:31 UTC
      expect(toUtcDateString(date)).toEqual('2022-03-11');
    });
    it('should convert to YYYY-MM-DD UTC for two-digit months', async () => {
      const date = new Date(1671032431000); // 2022-12-14 15:40:31 UTC
      expect(toUtcDateString(date)).toEqual('2022-12-14');
    });
    it('should convert to YYYY-MM-DD UTC for zero-padded days', () => {
      const date = new Date(1646162014000); // 2022-03-01 11:13:34 UTC
      expect(toUtcDateString(date)).toEqual('2022-03-01');
    });
  });

  describe('getScheduledSurfaceByAccessGroup', () => {
    it('should return a scheduled surface for a valid access group', () => {
      const result = getScheduledSurfaceByAccessGroup(
        MozillaAccessGroup.NEW_TAB_CURATOR_ENUS
      );

      expect(result).not.toBeUndefined();

      if (result) {
        expect(result.guid).toBeTruthy();
      }
    });

    it('should return undefined for an invalid access group', () => {
      expect(getScheduledSurfaceByAccessGroup('stone_cutters')).toBeUndefined();
    });

    it('should return undefined for a non-scheduled surface access group', () => {
      expect(
        getScheduledSurfaceByAccessGroup(
          MozillaAccessGroup.COLLECTION_CURATOR_FULL
        )
      ).toBeUndefined();
    });
  });

  describe('getScheduledSurfaceByGuid', () => {
    it('should return a scheduled surface for a valid guid', () => {
      const result = getScheduledSurfaceByGuid('NEW_TAB_EN_US');

      expect(result).not.toBeUndefined();

      if (result) {
        expect(result.name).toBeTruthy();
      }
    });

    it('should return undefined for an invalid guid', () => {
      expect(getScheduledSurfaceByGuid('STONE_CUTTERS')).toBeUndefined();
    });
  });
});

import { CorpusItemSource, MozillaAccessGroup, Topics } from './types';
import {
  getCorpusItemFromApprovedItem,
  getScheduledSurfaceByAccessGroup,
  getScheduledSurfaceByGuid,
  toUtcDateString,
  getPocketPath,
} from './utils';
import { ApprovedItem } from '../database/types';
import { CuratedStatus } from '@prisma/client';

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

  describe('getCorpusItemFromApprovedItem', () => {
    it('should map an ApprovedItem to a CorpusItem', () => {
      const approvedItem: ApprovedItem = {
        externalId: '123-abc',
        prospectId: 'abc-123',
        url: 'https://test.com',
        status: CuratedStatus.CORPUS,
        id: 123,
        title: 'Test title',
        excerpt: 'An excerpt',
        language: 'EN',
        publisher: 'The Times of Narnia',
        imageUrl: 'https://test.com/image.png',
        topic: Topics.EDUCATION,
        source: CorpusItemSource.PROSPECT,
        isCollection: false,
        isTimeSensitive: false,
        isSyndicated: false,
        createdAt: new Date(),
        createdBy: 'Anyone',
        updatedAt: new Date(),
        updatedBy: null,
        authors: [{ name: 'A.U. Thur', sortOrder: 0 }],
      };

      const result = getCorpusItemFromApprovedItem(approvedItem);

      expect(result).not.toBeUndefined();

      expect(result.id).toEqual(approvedItem.externalId);
      expect(result.url).toEqual(approvedItem.url);
      expect(result.title).toEqual(approvedItem.title);
      expect(result.excerpt).toEqual(approvedItem.excerpt);
      expect(result.authors).toEqual(approvedItem.authors);
      expect(result.language).toEqual(approvedItem.language);
      expect(result.publisher).toEqual(approvedItem.publisher);
      expect(result.imageUrl).toEqual(approvedItem.imageUrl);
      expect(result.topic).toEqual(approvedItem.topic);
    });
  });

  describe('getPocketPath', () => {
    it('matches syndicated articles without locale', () => {
      expect(
        getPocketPath('https://getpocket.com/explore/item/foo-bar')
      ).toEqual({
        locale: null,
        path: '/explore/item/foo-bar',
        type: 'SyndicatedArticle',
        key: 'foo-bar',
      });
    });
    it('matches syndicated articles with two character locale', () => {
      expect(
        getPocketPath('https://getpocket.com/de/explore/item/foo-bar')
      ).toEqual({
        locale: 'de',
        path: '/explore/item/foo-bar',
        type: 'SyndicatedArticle',
        key: 'foo-bar',
      });
    });
    it('matches syndicated articles with five character locale', () => {
      expect(
        getPocketPath('https://getpocket.com/en-GB/explore/item/foo-bar')
      ).toEqual({
        locale: 'en-GB',
        path: '/explore/item/foo-bar',
        type: 'SyndicatedArticle',
        key: 'foo-bar',
      });
    });
    it('matches collections without locale', () => {
      expect(
        getPocketPath('https://getpocket.com/collections/foo-bar')
      ).toEqual({
        locale: null,
        path: '/collections/foo-bar',
        type: 'Collection',
        key: 'foo-bar',
      });
    });
    it('matches collections articles with two character locale', () => {
      expect(
        getPocketPath('https://getpocket.com/de/collections/foo-bar')
      ).toEqual({
        locale: 'de',
        path: '/collections/foo-bar',
        type: 'Collection',
        key: 'foo-bar',
      });
    });
    it('matches collections articles with five character locale', () => {
      expect(
        getPocketPath('https://getpocket.com/en-GB/collections/foo-bar')
      ).toEqual({
        locale: 'en-GB',
        path: '/collections/foo-bar',
        type: 'Collection',
        key: 'foo-bar',
      });
    });
    it('doesnt match other pocket urls', () => {
      expect(getPocketPath('https://getpocket.com/saves')).toEqual({
        locale: null,
        path: '/saves',
      });
      expect(getPocketPath('https://getpocket.com')).toEqual({
        locale: null,
        path: '/',
      });
      expect(getPocketPath('https://other.com')).toBeNull();
    });
  });
});

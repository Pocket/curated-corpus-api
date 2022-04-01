import {
  AccessGroupToScheduledSurfaceMap,
  ScheduledSurface,
  ScheduledSurfaceGuidToMozillaAccessGroup,
} from './types';

describe('types', () => {
  /*
    the two describe blocks below are self-referential on purpose. the
    structures we are testing here are both arbitrary - in that there's no
    programmatic way to describe which each should contain. the best we can do
    is compare their intended matching parts to ensure both are equal.

    these will *not* help us keep these up to date/accurate (because again -
    there is no way to programmatically define them), but these will at least
    ensure the structures match.
  */
  describe('AccessGroupToScheduledSurfaceMap construct', () => {
    it('should contain the correct keys', () => {
      const expected = Object.values(
        ScheduledSurfaceGuidToMozillaAccessGroup
      ).sort();

      const actual = Object.keys(AccessGroupToScheduledSurfaceMap).sort();

      expect(actual).toEqual(expected);
    });

    // this test ensures the values (which are derived in the construct) are
    // actual ScheduledSurfaces
    it('should contain correct values', () => {
      const values = Object.values(AccessGroupToScheduledSurfaceMap);
      const keys = Object.keys(ScheduledSurfaceGuidToMozillaAccessGroup);

      // make sure each value in the construct has a corresponding key in the
      // check cosntruct
      values.forEach((val: ScheduledSurface) => {
        expect(keys.includes(val.guid)).toBeTruthy();
      });

      // make sure the values are all unique and have the same count as the
      // check construct
      const uniqueValues = [...new Set(values)];

      expect(uniqueValues.length).toEqual(keys.length);
    });
  });

  describe('ScheduledSurfaceGuidToMozillaAccessGroup', () => {
    it('should contain the correct values', () => {
      const expected = Object.keys(AccessGroupToScheduledSurfaceMap).sort();
      const actual = Object.values(
        ScheduledSurfaceGuidToMozillaAccessGroup
      ).sort();

      expect(actual).toEqual(expected);
    });

    it('should contain the correct keys', () => {
      const values = Object.values(AccessGroupToScheduledSurfaceMap).map(
        (ss: ScheduledSurface) => {
          return ss.guid;
        }
      );
      const keys = Object.keys(ScheduledSurfaceGuidToMozillaAccessGroup);

      // make sure each value in the construct has a corresponding key in the
      // check cosntruct
      keys.forEach((key) => {
        expect(values.includes(key)).toBeTruthy();
      });

      // make sure the values are all unique and have the same count as the
      // check construct
      const uniqueKeys = [...new Set(keys)];

      expect(uniqueKeys.length).toEqual(values.length);
    });
  });
});

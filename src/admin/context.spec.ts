import { expect } from 'chai';

import { getTokenFromAuthorizationHeader } from './context';

describe('context', () => {
  describe('getTokenFromAuthorizationHeader', () => {
    it('should return the token from a properly formed header', () => {
      const header = 'Bearer videogametoken';

      expect(getTokenFromAuthorizationHeader(header)).to.equal(
        'videogametoken'
      );
    });

    it('should return undefined from a malformed header', () => {
      // there shouldn't be more than one space!
      let header = 'Hack allyourbase belongtous';

      expect(getTokenFromAuthorizationHeader(header)).to.be.undefined;

      header = 'oopsnospaces!';

      expect(getTokenFromAuthorizationHeader(header)).to.be.undefined;
    });
  });
});

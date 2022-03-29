import { toUtcDateString } from './utils';

describe('toUtcDateString: should convert to YYYY-MM-DD UTC', () => {
  it('works for for zero-padded months', async () => {
    const date = new Date(1647042571000); // 2022-03-11 23:49:31 UTC
    expect(toUtcDateString(date)).toEqual('2022-03-11');
  });
  it('works for two-digit months', async () => {
    const date = new Date(1671032431000); // 2022-12-14 15:40:31 UTC
    expect(toUtcDateString(date)).toEqual('2022-12-14');
  });
  it('works for zero-padded days', () => {
    const date = new Date(1646162014000); // 2022-03-01 11:13:34 UTC
    expect(toUtcDateString(date)).toEqual('2022-03-01');
  });
});

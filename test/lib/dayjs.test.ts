import dayjs, { tzdb } from '../../lib/dayjs';

describe('dayjs', () => {
  it('tzdb', () => {
    expect(Array.isArray(tzdb)).toBe(true);
  });
  it('dayjs class', () => {
    expect(dayjs('2020-01-01T00:00:00.000Z').valueOf()).toBe(1577836800000);
  });
});

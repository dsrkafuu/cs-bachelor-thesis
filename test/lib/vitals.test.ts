import { fcpThres, getScore, getNES } from '../../lib/vitals';

describe('vitals/getScore', () => {
  it('get score', () => {
    expect(getScore(1700, fcpThres)).toBeGreaterThan(80);
    expect(getScore(2700, fcpThres)).toBeGreaterThan(60);
    expect(getScore(3200, fcpThres)).toBeLessThan(60);
  });
});

describe('vitals/getNES', () => {
  it('get NES', () => {
    expect(getNES(1000, 2000, 50, 0.0001)).toBeGreaterThan(80);
    expect(getNES(1000)).toBe(0);
  });
});

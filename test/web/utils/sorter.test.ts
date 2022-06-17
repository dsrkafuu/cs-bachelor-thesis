import * as sorter from '../../../src/utils/sorter';

describe('utils/sorter/numSorter', () => {
  it('return -1 when a < b', () => {
    expect(sorter.numSorter(1, 2)).toBe(-1);
  });
  it('return 1 when a > b', () => {
    expect(sorter.numSorter(2, 1)).toBe(1);
  });
  it('return 0 when a = b', () => {
    expect(sorter.numSorter(1, 1)).toBe(0);
  });
});

describe('utils/sorter/strSorter', () => {
  it('return -1 when a < b', () => {
    expect(sorter.strSorter('a', 'b')).toBe(-1);
  });
  it('return 1 when a > b', () => {
    expect(sorter.strSorter('b', 'a')).toBe(1);
  });
  it('return 0 when a = b', () => {
    expect(sorter.strSorter('a', 'a')).toBe(0);
  });
});

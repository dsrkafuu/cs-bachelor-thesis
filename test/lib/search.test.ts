import search from '../../lib/search';

describe('search', () => {
  it('search', () => {
    expect(Object.keys(search).length).toBe(9);
  });
});

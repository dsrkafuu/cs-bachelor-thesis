import * as axios from '../../../src/utils/axios';

describe('utils/axios', () => {
  it('request json example', async () => {
    const res = await axios.axios.get(
      'https://jsonplaceholder.typicode.com/users'
    );
    expect(res.data.length).toBe(10);
  });
});

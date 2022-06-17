import * as storage from '../../../src/utils/storage';

describe('utils/storage/setItem', () => {
  it('set item in localStorage', () => {
    storage.setItem('test', 'test');
    expect(localStorage.getItem('test')).toBe(JSON.stringify('test'));
  });
  it('set item in sessionStorage', () => {
    storage.setItem('test', 'test', true);
    expect(sessionStorage.getItem('test')).toBe(JSON.stringify('test'));
  });
});

describe('utils/storage/getItem', () => {
  it('get item from localStorage', () => {
    localStorage.setItem('test', JSON.stringify('test'));
    expect(storage.getItem('test')).toBe('test');
  });
  it('get item from sessionStorage', () => {
    sessionStorage.setItem('test', JSON.stringify('test'));
    expect(storage.getItem('test', true)).toBe('test');
  });
});

describe('utils/storage/removeItem', () => {
  it('remove item from localStorage', () => {
    localStorage.setItem('test', 'test');
    storage.removeItem('test');
    expect(localStorage.getItem('test')).toBe(null);
  });
  it('remove item from sessionStorage', () => {
    sessionStorage.setItem('test', 'test');
    storage.removeItem('test', true);
    expect(sessionStorage.getItem('test')).toBe(null);
  });
});

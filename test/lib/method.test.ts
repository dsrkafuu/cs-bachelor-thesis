import methods from '../../lib/methods';

describe('methods', () => {
  it('returns a function wrapper', () => {
    const handlers = {};
    expect(methods(handlers)).toBeInstanceOf(Function);
  });
  it('returns with get method', async () => {
    const handlers = { get: jest.fn() };
    const wrapper = methods(handlers);
    const req = { method: 'GET' } as any;
    const res = {} as any;
    await wrapper(req, res);
    expect(handlers.get).toHaveBeenCalledWith(req, res);
  });
  it('returns with post method', async () => {
    const handlers = { post: jest.fn() };
    const wrapper = methods(handlers);
    const req = { method: 'POST' } as any;
    const res = {} as any;
    await wrapper(req, res);
    expect(handlers.post).toHaveBeenCalledWith(req, res);
  });
  it('returns with put method', async () => {
    const handlers = { put: jest.fn() };
    const wrapper = methods(handlers);
    const req = { method: 'PUT' } as any;
    const res = {} as any;
    await wrapper(req, res);
    expect(handlers.put).toHaveBeenCalledWith(req, res);
  });
  it('returns with delete method', async () => {
    const handlers = { del: jest.fn() };
    const wrapper = methods(handlers);
    const req = { method: 'DELETE' } as any;
    const res = {} as any;
    await wrapper(req, res);
    expect(handlers.del).toHaveBeenCalledWith(req, res);
  });
  it('returns with options method', async () => {
    const handlers = { options: jest.fn() };
    const wrapper = methods(handlers);
    const req = { method: 'OPTIONS' } as any;
    const res = {} as any;
    await wrapper(req, res);
    expect(handlers.options).toHaveBeenCalledWith(req, res);
  });
});

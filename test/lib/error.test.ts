import { ResError, sendError } from '../../lib/error';

describe('erroe/ResError', () => {
  it('generate a response error', () => {
    expect(new ResError(500, 'My Error')).toBeInstanceOf(Error);
  });
});

describe('erroe/sendError', () => {
  it('send a response error', () => {
    const res = {
      statusCode: undefined,
      send: jest.fn(),
    } as any;
    sendError(res, new ResError(500, 'My Error'));
    expect(res.statusCode).toBe(500);
    expect(res.send).toHaveBeenCalledWith('My Error');
  });
});

import { ResError } from '../../lib/error';
import {
  setAuthCookie,
  getPayload,
  getCleanPath,
  parseLocation,
  validateObjectID,
  validateUsername,
  validatePassword,
  validateDomain,
} from '../../lib/utils';

describe('utils/setAuthCookie', () => {
  const res = {
    setHeader: jest.fn(),
  } as any;
  const token = 'token';
  it('set auth cookie without remember', () => {
    setAuthCookie(res, token, false);
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', [
      `auth_token=${token}; Path=/; SameSite=Strict`,
    ]);
  });
  it('set auth cookie with remember', () => {
    setAuthCookie(res, token, true);
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', [
      `auth_token=${token}; Path=/; SameSite=Strict; Max-Age=604800`,
    ]);
  });
});

describe('utils/getPayload', () => {
  const req = {
    query: {
      key: 'value',
    },
    body: {
      key: 'value',
    },
  } as any;
  const key = 'key';
  const validator = jest.fn();
  const reason = 'reason';
  it('get payload', () => {
    expect(getPayload(req, key)).toBe('value');
  });
  it('get payload with validator', () => {
    validator.mockReturnValue(false);
    expect(() => getPayload(req, key, validator)).toThrow(
      new ResError(400, 'invalid request payload')
    );
  });
  it('get payload with validator and reason', () => {
    validator.mockReturnValue(false);
    expect(() => getPayload(req, key, validator, reason)).toThrow(
      new ResError(400, reason)
    );
  });
  it('get payload in empty body', () => {
    req.body = {};
    req.query = {};
    expect(getPayload(req, key)).toBeUndefined();
  });
});

describe('utils/getCleanPath', () => {
  it('get clean path', () => {
    expect(getCleanPath('/path/')).toBe('/path');
    expect(getCleanPath('/base/path/', '/base')).toBe('/path');
    expect(getCleanPath('/base/path/', '/base/')).toBe('/path');
    expect(getCleanPath('/base/path/', '/base/path')).toBe('/');
  });
});

describe('utils/parseLocation', () => {
  it('parse location', async () => {
    expect(await parseLocation('')).toBeUndefined();
    expect(await parseLocation('::ffff:')).toBeUndefined();
  });
});

describe('utils/validateObjectID', () => {
  it('validate valid object id', () => {
    expect(validateObjectID('6239c1cda8cc0d130a00f53e')).toBe(true);
  });
  it('validate invalid object id', () => {
    expect(validateObjectID('')).toBe(false);
  });
});

describe('utils/validateUsername', () => {
  it('validate valid username', () => {
    expect(validateUsername('username')).toBe(true);
  });
  it('validate invalid username', () => {
    expect(validateUsername('awd a 2  ')).toBe(false);
  });
});

describe('utils/validatePassword', () => {
  it('validate valid password', () => {
    expect(validatePassword('password')).toBe(true);
  });
  it('validate invalid password', () => {
    expect(validatePassword('awdf3 4 w aw ')).toBe(false);
  });
});

describe('utils/validateDomain', () => {
  it('validate valid domain', () => {
    expect(validateDomain('example.org')).toBe(true);
  });
  it('validate invalid domain', () => {
    expect(validateDomain('awdwqk2309g h')).toBe(false);
  });
});

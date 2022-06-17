import {
  hashPassword,
  checkPassword,
  createJWT,
  parseJWT,
  createFingerprint,
} from '../../lib/crypto';

describe('crypto/hashPassword', () => {
  it('hash password with bcryptjs', async () => {
    const password = 'test';
    const hash = await hashPassword(password);
    expect(hash.length).toBe(60);
  });
});

describe('crypto/checkPassword', () => {
  it('check password with bcryptjs', async () => {
    const password = 'test';
    const hash = await hashPassword(password);
    expect(await checkPassword(password, hash)).toBe(true);
  });
});

const payload = {
  id: 'test',
  name: 'test',
};

describe('crypto/createJWT', () => {
  it('create jwt with jwt-simple', async () => {
    const jwt = await createJWT('JWS', payload);
    expect(jwt.split('.').length).toBe(3);
  });
  it('create jwt with jwe', async () => {
    const jwt = await createJWT('JWE', payload);
    expect(jwt.split('.').length).toBe(5);
  });
});

describe('crypto/parseJWT', () => {
  it('parse jwt with jwt-simple', async () => {
    const jwt = await createJWT('JWS', payload);
    expect(await parseJWT('JWS', jwt)).toEqual(payload);
  });
  it('parse jwt with jwe', async () => {
    const jwt = await createJWT('JWE', payload);
    expect(await parseJWT('JWE', jwt)).toEqual(payload);
  });
  it('parse errord jwt', async () => {
    const jwt = '[object Object]';
    expect(await parseJWT('JWE', jwt)).toBeNull();
  });
});

describe('crypto/createFingerprint', () => {
  it('create fingerprint', () => {
    expect(createFingerprint('test')).toBe('a77b972839b0f1ca72b9dd871056088f');
  });
});

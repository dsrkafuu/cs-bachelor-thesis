import process from 'process';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify, EncryptJWT, jwtDecrypt } from 'jose';

let seed = process.env.AUTH_HASH_SEED;
if (process.env.NODE_ENV === 'test') {
  seed = 'test';
}
/* istanbul ignore if */
if (!seed) {
  throw new Error('Missing env `AUTH_HASH_SEED`');
}
const hash = crypto.createHash('sha256').update(seed).digest(); // SHA-256 to 32 bytes (256 bits)
const jwk = crypto.createSecretKey(hash);

/**
 * hash password with bcrypt 30byte (60char)
 */
export async function hashPassword(password: string) {
  return await bcryptjs.hash(password, 10);
}

/**
 * validate password with bcrypt
 */
export async function checkPassword(password: string, hash: string) {
  return await bcryptjs.compare(password, hash);
}

/**
 * gen JWT (JWS/JWE) token
 * https://www.iana.org/assignments/jose/jose.xhtml
 */
export async function createJWT(
  mode: 'JWS' | 'JWE',
  payload: any,
  expire?: string | number
) {
  let signer;
  if (mode === 'JWS') {
    signer = new SignJWT(payload);
    signer = signer.setProtectedHeader({ alg: 'HS256' });
    expire && (signer = signer.setExpirationTime(expire));
    return await signer.sign(jwk);
  } else {
    signer = new EncryptJWT(payload);
    signer = signer.setProtectedHeader({ alg: 'dir', enc: 'A256GCM' });
    expire && (signer = signer.setExpirationTime(expire));
    return await signer.encrypt(jwk);
  }
}

/**
 * parse JWT (JWS) token
 */
export async function parseJWT(mode: 'JWS' | 'JWE', jwt: string) {
  try {
    if (mode === 'JWS') {
      return (await jwtVerify(jwt, jwk)).payload;
    } else {
      return (await jwtDecrypt(jwt, jwk)).payload;
    }
  } catch {
    return null;
  }
}

/**
 * get md5 fingerprint
 */
export function createFingerprint(...args: Array<string | number>) {
  const input = Buffer.from(args.join(''));
  return crypto
    .createHash('md5')
    .update(Buffer.concat([hash, input]))
    .digest('hex');
}

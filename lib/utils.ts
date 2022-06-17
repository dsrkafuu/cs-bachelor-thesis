import path from 'path';
import fs from 'fs';
import maxmind, { Reader } from 'maxmind';
import isLocalhost from 'is-localhost-ip';
import { ResError } from './error';
import logger, { LogType } from './logger';

export function setAuthCookie(
  res: CoreResponse,
  token: string,
  remember?: boolean
) {
  let setter = `auth_token=${token}; Path=/; SameSite=Strict`;
  if (remember) {
    setter += '; Max-Age=604800'; // 7 days
  }
  res.setHeader('Set-Cookie', [setter]);
}

/**
 * get payload (string or undefined)
 */
export function getPayload(
  req: CoreRequest,
  key: string,
  validator?: (value: any) => boolean,
  reason?: string,
  loggerType?: LogType
) {
  const payload = req.query[key] || req.body?.[key];
  if (validator && !validator(payload)) {
    const _reason = reason || 'invalid request payload';
    if (loggerType) {
      logger.error(loggerType, _reason, { payload });
    }
    throw new ResError(400, _reason);
  }
  if (payload === null || payload === undefined || payload === '') {
    return undefined;
  }
  return payload;
}

/**
 * remove trailing slash and base url
 */
export function getCleanPath(path: string, base = '/') {
  if (path.length > 2 && path.endsWith('/')) {
    path = path.slice(0, path.length - 1);
  }
  path = path.replace(base, '');
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path;
}

let mmdb: Reader<any> | null;
/**
 * get geo location from ip address
 */
export async function parseLocation(ip?: string) {
  if (!ip || (await isLocalhost(ip))) {
    return undefined;
  }
  if (!mmdb) {
    let dbFile = path.join(__dirname, './meta/GeoLite2-Country.mmdb');
    if (!fs.existsSync(dbFile)) {
      dbFile = path.join(__dirname, '../public/meta/GeoLite2-Country.mmdb');
      if (!fs.existsSync(dbFile)) {
        throw new Error('geodb not found');
      }
    }
    mmdb = await maxmind.open(dbFile);
  }
  const result = mmdb.get(ip);
  return result?.country?.iso_code as string | undefined;
}

export function validateObjectID(_id: string) {
  return _id.length === 24;
}

export function validateUsername(username: string) {
  return (
    /^[a-z][0-9a-z_-]+$/i.test(username) &&
    username.length <= 20 &&
    username.length >= 5
  );
}

export function validatePassword(password: string) {
  return (
    /^[0-9a-z!@#$%^&*_-]+$/i.test(password) &&
    password.length >= 6 &&
    password.length <= 50
  );
}

export function validateDomain(domain: string) {
  return /^[^.][.a-z0-9-]+[a-z]{2,}$/.test(domain) || domain === 'localhost';
}

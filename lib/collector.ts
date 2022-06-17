import requestIp from 'request-ip';
import UAParser from 'ua-parser-js';
import { createFingerprint } from './crypto';
import { getPayload, parseLocation } from './utils';
import { ResError } from './error';
import { ErrorModel, SessionModel, ViewModel, VitalModel } from '../db/models';
import logger from './logger';

// collect route basics
interface CollectMeta {
  sid: string;
  origin: URL;
  href: URL;
}
export function getCollectMeta(req: CoreRequest) {
  const sid = getPayload(
    req,
    'id',
    (sid) => sid && sid.length === 24,
    'invalid site id',
    'collector'
  );
  if (!req.headers.origin) {
    logger.error('collector', 'invalid request origin', {
      origin: 'undefined',
    });
    throw new ResError(400, 'invalid request origin');
  }
  let origin: URL;
  try {
    origin = new URL(req.headers.origin);
  } catch {
    logger.error('collector', 'invalid request origin', {
      origin: req.headers.origin,
    });
    throw new ResError(400, 'invalid request origin');
  }
  const href = getPayload(
    req,
    'href',
    (v) => !!v || typeof v !== 'string',
    'invalid request href',
    'collector'
  );
  const hrefURL = new URL(href, 'https://example.org');
  return {
    sid,
    origin,
    href: hrefURL,
  } as CollectMeta;
}

// all client metas, version is full, ready for reduced ua in modern browsers
export interface SessionMeta {
  fp: string; // session fingerprint
  ua: string;
  ip: string;
  browser: string; // Chrome
  version: string; // 84.0.4143.2 (need polyfill in reduced ua)
  system: string; // Windows
  platform: string; // desktop (default)
  model: string; // Pixel 3 (need polyfill in reduced ua)
  arch: string; // arm (need polyfill in reduced ua)
  screen: string; // 1920x1080
  language: string; // zh-cn (lower case)
  cvsfp: string; // client canvas fingerprint
}
/**
 * get client (session) meta and gen fingerprint id
 */
export function getSessionMeta(req: CoreRequest, sid: string) {
  const ua = req.headers['user-agent'] || '';
  const uap = new UAParser(ua);
  const bros = uap.getBrowser();
  const devc = uap.getDevice();
  const os = uap.getOS();
  const cpu = uap.getCPU();
  const meta = {} as SessionMeta;
  meta.ua = ua;
  meta.ip = requestIp.getClientIp(req) || '';
  meta.browser = bros.name || '';
  meta.version = (getPayload(req, 'uafv') || bros.version || '').toLowerCase();
  meta.system = os.name || '';
  meta.platform = devc.type || 'desktop';
  meta.model = (getPayload(req, 'device') || devc.model || '').toLowerCase();
  meta.arch = (getPayload(req, 'arch') || cpu.architecture || '').toLowerCase();
  meta.screen = getPayload(req, 'screen') || '';
  meta.language = (getPayload(req, 'lang') || '').toLowerCase();
  meta.cvsfp = (getPayload(req, 'cvsfp') || '').toLowerCase();
  // generate session fingerprint id,
  // by those not commonly changed in once browse,
  // add extra meta for reduced-ua in modern browsers
  meta.fp = createFingerprint(
    sid,
    meta.ip,
    ua,
    meta.version, // (extra) version in reduced-ua only has major version
    meta.model, // (extra) model in reduced-ua is locked
    meta.arch, // (extra) arch in reduced-ua is locked
    meta.cvsfp // (extra) canvas fingerprint in modern browsers
  );
  return meta;
}

/* istanbul ignore next */
/**
 * write session to db
 */
export async function handleSession(sid: string, meta: SessionMeta) {
  const location = (await parseLocation(meta.ip)) || '';
  return await SessionModel.findOneAndUpdate(
    {
      _fp: meta.fp,
    },
    {
      _site: sid,
      ip: meta.ip || undefined,
      browser: meta.browser || undefined,
      version: meta.version || undefined,
      system: meta.system || undefined,
      platform: meta.platform || undefined,
      model: meta.model || undefined,
      archtecture: meta.arch || undefined,
      screen: meta.screen || undefined,
      language: meta.language || undefined,
      location: location || undefined,
    },
    {
      new: true,
      upsert: true,
    }
  ).lean();
}

/* istanbul ignore next */
export async function handleView(
  req: CoreRequest,
  sid: string,
  fp: string,
  path: string,
  host?: string
) {
  const title = getPayload(req, 'title');
  const _ref = getPayload(req, 'ref');
  // get a clean referrer & filter out same site referrer
  let refURL: URL | null = null;
  if (_ref) {
    try {
      refURL = new URL(_ref);
      if (host && refURL.hostname === host) {
        refURL = null;
      }
    } catch {
      refURL = null;
    }
  }
  // remove search/hash & trailing slash
  let ref = refURL ? refURL.host + refURL.pathname : undefined;
  if (ref && ref.endsWith('/')) {
    ref = ref.slice(0, ref.length - 1);
  }
  return await ViewModel.create({
    _site: sid,
    _session: fp,
    pathname: path,
    title,
    referrer: ref,
  });
}

/* istanbul ignore next */
export async function handleVital(
  req: CoreRequest,
  sid: string,
  fp: string,
  path: string
) {
  const validVital = (value: any) => {
    const res = Number(value);
    return Number.isNaN(res) ? undefined : res;
  };
  return await VitalModel.create({
    _site: sid,
    _session: fp,
    pathname: path,
    cls: validVital(getPayload(req, 'cls')),
    fcp: validVital(getPayload(req, 'fcp')),
    fid: validVital(getPayload(req, 'fid')),
    lcp: validVital(getPayload(req, 'lcp')),
    ttfb: validVital(getPayload(req, 'ttfb')),
  });
}

/* istanbul ignore next */
export async function handleError(
  req: CoreRequest,
  sid: string,
  fp: string,
  path: string
) {
  const type = getPayload(
    req,
    'type',
    (v) => !!v,
    'invalid error type',
    'collector'
  );
  let message = getPayload(
    req,
    'msg',
    (v) => !!v,
    'invalid error message',
    'collector'
  );
  const name = getPayload(req, 'name');
  const stack = getPayload(req, 'stack');

  let rmessage: string | undefined = undefined;
  const rawmsg = message;
  try {
    const url = new URL(message);
    message = url.origin + url.pathname;
    rmessage = rawmsg;
  } catch {
    message = rawmsg;
    rmessage = undefined;
  }

  return await ErrorModel.create({
    _site: sid,
    _session: fp,
    pathname: path,
    type,
    name: name || 'Error',
    message,
    rmessage,
    stack: stack || undefined,
    resolved: false,
  });
}

import methods from '../lib/methods';
import { withCORS, withBotCheck, withDatabase } from '../lib/middleware';
import {
  getCollectMeta,
  getSessionMeta,
  handleError,
  handleSession,
  handleView,
  handleVital,
} from '../lib/collector';
import { createJWT, parseJWT } from '../lib/crypto';
import { ResError } from '../lib/error';
import { getCleanPath, getPayload } from '../lib/utils';
import { SiteModel } from '../db/models';
import logger from '../lib/logger';

// can be saved as cache in client (jwt token)
interface SessionCache {
  sid: string; // site id
  fp: string; // session fingerprint
  base?: string; // base url
}
/**
 * try gey cache from client
 */
async function getClientCache(req: CoreRequest) {
  const cache = getPayload(req, 'cache');
  if (cache) {
    let cacheData;
    try {
      cacheData = (await parseJWT('JWS', cache)) || {};
    } catch {
      cacheData = {};
    }
    const { sid, fp, base } = cacheData;
    if (typeof sid === 'string' && typeof fp === 'string') {
      return {
        sid,
        fp,
        base: typeof base === 'string' ? base : undefined,
      } as SessionCache;
    }
  }
}

async function handler(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withCORS(req, res);
  withBotCheck(req);

  // datas needed
  const cache = await getClientCache(req);
  const collect = getCollectMeta(req);
  let sid: string; // site id
  let fp: string; // session fingerprint
  let base: string | undefined;

  // define sid & path without base
  if (cache) {
    sid = cache.sid;
    base = cache.base;
  } else {
    sid = collect.sid;
    const site = await SiteModel.findById(collect.sid).lean();
    if (!site) {
      logger.error('collector', 'invalid site id', { _id: sid });
      throw new ResError(400, 'invalid site id');
    }
    base = site.baseURL;
  }
  const path = getCleanPath(collect.href.pathname, base);

  // parallel workers for session and different routes
  const workers = [];

  // define session
  if (cache) {
    fp = cache.fp;
  } else {
    const session = getSessionMeta(req, sid);
    fp = session.fp;
    workers.push(handleSession(sid, session));
  }

  // handle different routes
  const route = getPayload(req, 'route');
  switch (route) {
    case 'view':
      workers.push(handleView(req, sid, fp, path, collect.origin.hostname));
      break;
    case 'vital':
      workers.push(handleVital(req, sid, fp, path));
      break;
    case 'error':
      workers.push(handleError(req, sid, fp, path));
      break;
    default:
      logger.error('collector', 'invalid request route', { route });
      throw new ResError(400, 'invalid request route');
  }
  await Promise.all(workers);

  if (!cache) {
    const cache: SessionCache = { sid, fp };
    base && (cache.base = base);
    const token = await createJWT('JWS', cache);
    res.status(201).send(token);
  } else {
    res.status(204).send(null);
  }
}

export default methods({
  get: handler,
  post: handler,
  options: handler,
});

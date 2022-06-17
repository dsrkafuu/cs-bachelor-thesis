import process from 'process';
import cookie from 'cookie';
import contentType from 'content-type';
import rawBody, { RawBodyError } from 'raw-body';
import etag from 'etag';
import { ResError } from '../lib/error';
import logger from '../lib/logger';

/**
 * convert URLSearchParams into query string object
 */
function buildObjBySearch(search: URLSearchParams) {
  const obj: CoreRequestQuery = {};
  search.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

function getQueryParser(req: IncomingMessage) {
  return (): CoreRequestQuery => {
    const search = new URL(req.url || '/', 'https://example.org').searchParams;
    const params = (req as any).params || {};
    return {
      ...buildObjBySearch(search),
      ...params,
    };
  };
}

function getCookieParser(req: IncomingMessage) {
  return (): CoreRequestCookies => {
    const header: string | string[] | undefined = req.headers.cookie;
    if (!header) {
      return {};
    }
    return cookie.parse(Array.isArray(header) ? header.join(';') : header);
  };
}

async function getBodyParser(req: IncomingMessage) {
  const reqType = req.headers['content-type'];
  const reqLength = req.headers['content-length'];
  // not parsing body if no type/length is specified
  if (!reqType || !reqLength) {
    return undefined;
  }
  let body: Buffer;
  try {
    body = await rawBody(req, {
      length: reqLength,
      limit: process.env.BODY_SIZE_LIMIT || '10kb',
    });
  } catch (e) {
    const err = e as RawBodyError;
    throw new ResError(
      err.status,
      err.message
        .split(' ')
        .map((s) => s[0].toUpperCase() + s.slice(1))
        .join(' ')
    );
  }
  return () => {
    const { type } = contentType.parse(reqType);
    switch (type) {
      case 'application/json': {
        try {
          const str = body.toString();
          return str ? JSON.parse(str) : {};
        } catch {
          throw new ResError(400, 'invalid json request body');
        }
      }
      case 'application/x-www-form-urlencoded': {
        const str = body.toString();
        const search = new URLSearchParams(str);
        return buildObjBySearch(search);
      }
      case 'text/plain': {
        return body.toString();
      }
      case 'application/octet-stream': {
        return body;
      }
      default: {
        return undefined;
      }
    }
  };
}

/**
 * lazy props makes query, cookies, body parser run only when they are used
 */
function setLazyProperty<T>(
  req: IncomingMessage,
  prop: string,
  getter: (() => T) | undefined
) {
  const opts = { configurable: true, enumerable: true };
  const optsReset = { ...opts, writable: true };
  if (typeof getter !== 'function') {
    Object.defineProperty(req, prop, { ...opts, value: getter });
  } else {
    Object.defineProperty(req, prop, {
      ...opts,
      get: () => {
        const value = getter(); // no props need since binded outside
        // actually set the property on the object to avoid recalculating it
        Object.defineProperty(req, prop, { ...optsReset, value });
        return value;
      },
      set: (value) => {
        Object.defineProperty(req, prop, { ...optsReset, value });
      },
    });
  }
}

function setCharset(type: string) {
  const parsed = contentType.parse(type);
  if (parsed.type === 'text/html' || parsed.type === 'text/plain') {
    parsed.parameters.charset = 'utf-8';
    return contentType.format(parsed);
  } else {
    return type;
  }
}

function createETag(body: any, encoding: 'utf-8' | undefined) {
  const buf = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body;
  return etag(buf, { weak: true });
}

function status(res: ServerResponse, statusCode: number): ServerResponse {
  res.statusCode = statusCode;
  return res;
}

function send(
  req: IncomingMessage,
  res: ServerResponse,
  body: any
): ServerResponse {
  let chunk: unknown = body;
  let encoding: 'utf-8' | undefined;

  // check body type
  switch (typeof chunk) {
    case 'string': {
      if (chunk.length === 0) {
        chunk = undefined;
      } else {
        res.setHeader('Content-Type', 'text/plain');
      }
      break;
    }
    case 'boolean':
    case 'number':
    case 'object':
      if (chunk === null) {
        chunk = undefined;
      } else if (Buffer.isBuffer(chunk)) {
        res.setHeader('Content-Type', 'application/octet-stream');
      } else {
        chunk = JSON.stringify(body);
        res.setHeader('Content-Type', 'application/json');
      }
      break;
    default:
      throw new Error(`unsupported body type ${typeof chunk}`);
  }
  // if strings, mark as utf-8
  if (typeof chunk === 'string') {
    encoding = 'utf-8';
    // reflect this in content-type
    const type = res.getHeader('Content-Type');
    if (typeof type === 'string') {
      res.setHeader('Content-Type', setCharset(type));
    }
  }

  // populate Content-Length
  let len: number | undefined;
  if (chunk !== undefined) {
    if (Buffer.isBuffer(chunk)) {
      len = chunk.length; // get length of Buffer
    } else if (typeof chunk === 'string') {
      if (chunk.length < 1000) {
        // just calculate length small chunk
        len = Buffer.byteLength(chunk, encoding);
      } else {
        // convert chunk to Buffer and calculate
        const buf = Buffer.from(chunk, encoding);
        len = buf.length;
        chunk = buf;
        encoding = undefined;
      }
    } else {
      throw new Error(`unsupported body type ${typeof chunk}`);
    }
    if (len) {
      res.setHeader('Content-Length', len);
    }
  }

  // populate ETag & Cache-Control
  const cacheStr = `${res.getHeader('Cache-Control')}` || '';
  if (
    !res.getHeader('ETag') &&
    len !== undefined &&
    !cacheStr.includes('immutable')
  ) {
    const etag = createETag(chunk, encoding);
    if (etag) {
      const reqEtag = req.headers['if-none-match'];
      // 304 Not Modified
      if (reqEtag === etag) {
        res.statusCode = 304;
      } else {
        res.setHeader('etag', etag);
      }
    }
  } else {
    res.removeHeader('etag');
  }
  if (!cacheStr) {
    res.setHeader('Cache-Control', 'no-cache');
  }

  // strip irrelevant headers
  if (204 === res.statusCode || 304 === res.statusCode) {
    res.removeHeader('Content-Type');
    res.removeHeader('Content-Length');
    res.removeHeader('Transfer-Encoding');
    chunk = null;
  }

  // Skip body for HEAD
  if (req.method === 'HEAD') {
    res.end();
  }
  // Respond with or without encoding
  else if (encoding) {
    res.end(chunk, encoding);
  } else {
    res.end(chunk);
  }
  return res;
}

/**
 * make core api handler support local node server
 */
export default function bridge(
  handler: (req: CoreRequest, res: CoreResponse) => void | Promise<void>
) {
  return async (_req: IncomingMessage, _res: ServerResponse) => {
    const req = _req as CoreRequest;
    const res = _res as CoreResponse;

    try {
      // request bridge
      setLazyProperty<CoreRequestQuery>(req, 'query', getQueryParser(req));
      setLazyProperty<CoreRequestCookies>(req, 'cookies', getCookieParser(req));
      setLazyProperty<any>(req, 'body', await getBodyParser(req));
      // response bridge
      res.status = (statusCode) => status(res, statusCode) as CoreResponse;
      res.send = (body) => send(req, res, body) as CoreResponse;
      // core api handler
      await handler(req, res);
    } catch (err) {
      if (err instanceof ResError) {
        res.statusCode = err.statusCode;
        send(req, res, err.message);
      } else {
        logger.error('server', 'internal server error', err);
        res.statusCode = 500;
        send(req, res, 'internal server error');
      }
    }
  };
}

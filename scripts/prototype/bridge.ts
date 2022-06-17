/* core API handler types */
interface CoreRequest {
  url: string;
  cookies: {
    [key: string]: string;
  };
}
interface CoreResponse {
  status(code: number): CoreResponse;
  end(body: string): CoreResponse;
}

export function handler(req: CoreRequest, res: CoreResponse) {
  if (!req.cookies.session) {
    res.status(403).end('Forbidden');
  }
  res.status(200).end('Hello World');
}

/* Cloudflare bridge */
type CoreHandler = (req: CoreRequest, res: CoreResponse) => void;

interface Request {
  url: string;
  cookies?: string;
}
class Response {
  status: number;
  body?: string;
  constructor(status = 200) {
    this.status = status;
  }
}
type CloudFlareHandler = (request: Request) => Response;

// get a tool func which makes a func only valid before "end"
function getWithBeforeEnd() {
  let ended = false; // record whether ended
  /**
   * @param func funcs like status() & end() which needs to be wrapped
   * @param ender whether the func makes the request ended
   */
  function wrapper<A extends unknown[], R>(
    func: (...args: A) => R,
    ender = false
  ): (...args: A) => R {
    let res: R;
    return (...args: A) => {
      if (!ended) {
        res = func(...args);
        ender && (ended = true);
      }
      return res;
    };
  }
  return wrapper;
}

export function connectCloudFlare(handler: CoreHandler): CloudFlareHandler {
  return (request: Request) => {
    // parse raw cookies
    const cookies: { [key: string]: string } = {};
    const rawCookies = request.cookies || '';
    rawCookies.split(';').forEach((cookie) => {
      cookies[cookie.split('=')[0]] = cookie.split('=')[1];
    });
    // populate CoreRequest
    const coreReq: CoreRequest = {
      url: request.url,
      cookies,
    };
    // populate CoreResponse
    const withBeforeEnd = getWithBeforeEnd();
    const res = new Response();
    const coreRes: CoreResponse = {
      status: withBeforeEnd((code: number) => {
        res.status = code;
        return coreRes;
      }, false),
      end: withBeforeEnd((body: string) => {
        res.body = body;
        return coreRes;
      }, true),
    };
    handler(coreReq, coreRes);
    return res;
  };
}

const cfh = connectCloudFlare(handler);
console.log(cfh({ url: 'https://example.com', cookies: 'session=12345' }));
// Response { status: 200, body: 'Hello World' }
console.log(cfh({ url: 'https://example.com' }));
// Response { status: 403, body: 'Forbidden' }

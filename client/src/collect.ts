import type { CollectRoute, CollectData } from './types';
import getCanvasFP, { getCache, setCache } from './utils';

interface UAMeta {
  uafv?: string;
  device?: string;
  arch?: string;
  screen?: string;
  lang?: string;
  cvsfp?: string;
}
// fix for furture reduced ua in modern browsers
// https://developer.chrome.com/docs/privacy-sandbox/user-agent/
// https://www.chromium.org/updates/ua-reduction/
let uaMeta: UAMeta | null = null;
async function getUAMeta() {
  if (uaMeta) {
    return uaMeta;
  }
  const meta = {} as UAMeta;

  // full user agent
  const uad = (navigator as any).userAgentData;
  if (uad) {
    const { architecture, model, uaFullVersion } =
      await uad.getHighEntropyValues([
        'architecture',
        'model',
        'uaFullVersion',
      ]);
    uaFullVersion && (meta.uafv = uaFullVersion);
    model && (meta.device = model);
    architecture && (meta.arch = architecture);
  }

  // screen & lang
  const {
    navigator: { language },
    screen: { width, height },
  } = window;
  width > 0 && height > 0 && (meta.screen = `${width}x${height}`);
  language && (meta.lang = language);

  // canvas fingerprint
  let cvsfp = getCache('cvsfp');
  if (!cvsfp) {
    cvsfp = await getCanvasFP();
  }
  if (cvsfp) {
    meta.cvsfp = cvsfp;
    setCache('cvsfp', cvsfp);
  }

  uaMeta = meta;
  return uaMeta;
}

/**
 * send data to api, id/language/screen is included by default
 */
export async function collect(
  id: string,
  host: string, // host with no trailing slash
  route: CollectRoute,
  data: CollectData,
  sync = false
) {
  let url = `${host}/api/collect`;

  // session related
  const cache = getCache('sfp');

  // generate request body
  const body: CollectData = {
    route,
    id,
    ...data,
    ...(await getUAMeta()),
  };
  if (cache) {
    body.cache = cache;
  }
  const keys = Object.keys(body) as Array<keyof typeof body>;
  const search = (
    keys.reduce((acc, key) => {
      const value = body[key];
      if (value) {
        return `${acc}&${key}=${encodeURIComponent(value)}`;
      }
      return acc;
    }, '') as string
  ).substring(1);

  // check to use GET or POST, use POST only if
  // 1. sending Error data
  // 2. URL too long for GET
  let method = 'GET';
  if (route === 'error' || `${url}?${search}`.length > 2000) {
    method = 'POST';
  }
  if (method === 'GET') {
    url = `${url}?${search}`;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[DEBUG] SENDING', search);
  }

  // send data in different ways
  let sended = false;
  // always try beacons first (has cache already)
  if (!!navigator.sendBeacon && (sync || cache)) {
    let beaconBody: Blob | null = null;
    if (method === 'POST') {
      beaconBody = new Blob([search], {
        type: 'application/x-www-form-urlencoded',
      });
    }
    try {
      navigator.sendBeacon(url, beaconBody);
      sended = true;
    } catch (e) {
      // on some android chrome webview,
      // non CORS-safelisted request disabled temporarily
      // due to a security issue http://crbug.com/490015
    }
  }
  // need response or fallbacks (no cache or beacon failed)
  if (!sended) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, !sync); // sync xhr only used for old browsers
    xhr.onload = () => {
      if (!cache && xhr.status === 201) {
        if (typeof xhr.response === 'string') {
          setCache('sfp', xhr.response);
        }
      }
    };
    if (method === 'POST') {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(search);
    } else {
      xhr.send(null);
    }
  }
}

/**
 * same as `collect` but only send once on
 * page leave, href change or history push (auto spa)
 * returns a function to append data
 */
export function collectLeave(
  id: string,
  host: string, // host with no trailing slash
  route: CollectRoute // api route
) {
  let _data: CollectData = { href: '' };

  const send = (sync: boolean) => {
    if (Object.keys(_data).length === 1) {
      return; // do not send if only empty data
    }
    const data = { ..._data };
    _data = { href: '' }; // reset for furture data appending
    collect(id, host, route, data, sync);
  };
  document.addEventListener('visibilitychange', () => {
    document.visibilityState === 'hidden' && send(true);
  });
  // safari may not fire `visibilitychange` when closing tab directly,
  // the fix should only apply to safari since
  // it may cause performance issue on other browsers
  const safari = (window as any).safari;
  if (typeof safari === 'object' && (safari || {}).pushNotification) {
    window.addEventListener('beforeunload', (e) => {
      // ensure the event successfully ended
      // (not prevented by other/future javascript main thread)
      setTimeout(() => {
        !e.defaultPrevented && e.returnValue !== false && send(true);
      }, 0);
    });
  }

  /**
   * append data to current data,
   * or send data when href changed
   */
  return (data: CollectData) => {
    if (_data.href && data.href !== _data.href) {
      send(false);
    } else {
      _data = { ..._data, ...data };
    }
  };
}

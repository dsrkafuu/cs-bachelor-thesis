import type { Options, DSRA, VitalData, CollectData, ErrorType } from './types';
import { formatID, formatHost } from './utils';
import { collect, collectLeave } from './collect';
import { getCLS, getFCP, getFID, getLCP, getTTFB, Metric } from 'web-vitals';
import catchErrors from './error';

const defaultOptions: Options = {
  autoView: false,
  autoVital: true,
  autoError: true,
};

let _dsra: DSRA | null = null;

/**
 * @param id website ID
 * @param host analytics host
 * @param options
 */
function useDSRA(id: string, host: string, options?: Options): DSRA {
  // ensure singleton
  if (_dsra) {
    return _dsra;
  }

  // init vars
  const opts = { ...defaultOptions, ...(options || {}) };
  const _id = formatID(id);
  if (!_id) {
    throw new Error(`Invalid site id: ${id}`);
  }
  const _host = formatHost(host);
  if (!_host) {
    throw new Error(`Invalid api host: ${host}`);
  }
  const dsra = {} as DSRA;

  /**
   * send view data
   * @param href href path from location.href etc.
   * @param title custom page title
   * @param referrer custom referrer
   */
  dsra.sendView = (href: string, title?: string, referrer?: string) => {
    const data: CollectData = {
      href,
    };
    title && (data.title = title);
    referrer && (data.ref = referrer);
    collect(_id, _host, 'view', data);
  };

  // vital data will be merged then send when
  // page leave, href change or history push (auto spa)
  const append = collectLeave(_id, _host, 'vital');
  /**
   * send vital data
   * @param href href path from location.href etc.
   * @param value web vital partial/full data
   */
  dsra.sendVital = (href: string, value: VitalData) => {
    const data: CollectData = {
      href,
    };
    const { cls, fcp, fid, lcp, ttfb } = value;
    cls !== undefined && (data.cls = cls.toString());
    fcp !== undefined && (data.fcp = fcp.toString());
    fid !== undefined && (data.fid = fid.toString());
    lcp !== undefined && (data.lcp = lcp.toString());
    ttfb !== undefined && (data.ttfb = ttfb.toString());
    append(data);
  };

  /**
   * record error
   * @param href href path from location.href etc.
   * @param error javascript error
   */
  dsra.sendError = (href: string, type: ErrorType, error: Error) => {
    const data: CollectData = {
      href,
      type,
    };
    const { message, name, stack } = error;
    data.name = name || 'Error';
    message && (data.msg = message);
    stack && (data.stack = stack);
    collect(_id, _host, 'error', data);
  };

  // start features in auto mode
  if (opts.autoView) {
    const handler = () => {
      dsra.sendView(location.href, document.title, document.referrer);
    };
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', handler);
    } else {
      handler();
    }
  }
  if (opts.autoVital) {
    const handler = (type: keyof VitalData) => {
      return (met: Metric) => {
        dsra.sendVital(location.href, { [type]: met.value });
      };
    };
    getCLS(handler('cls'));
    getFCP(handler('fcp'));
    getFID(handler('fid'));
    getLCP(handler('lcp'));
    getTTFB(handler('ttfb'));
  }
  if (opts.autoError) {
    catchErrors(dsra.sendError);
  }

  _dsra = dsra;
  return _dsra;
}

export default useDSRA;

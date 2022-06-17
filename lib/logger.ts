import process from 'process';
import { LogModel } from '../db/models';

export type LogType = 'server' | 'auth' | 'user' | 'site' | 'collector';
export type LogLevel = 'info' | 'warn' | 'error';

/* async pool */
type WorkConstructor = () => Promise<any>;
const concurrency = 1000;
const waiting = [] as WorkConstructor[];
const executing = new Set<Promise<any>>();
/**
 * push a work into async pool
 */
function pushWork(constructor: () => Promise<any>, callback?: () => void) {
  if (executing.size < concurrency) {
    const work = constructor();
    work.finally(() => {
      executing.delete(work);
      if (waiting.length > 0) {
        const next = waiting.shift();
        next && pushWork(next);
      }
      callback && callback();
    });
    executing.add(work);
  } else {
    waiting.push(constructor);
  }
}

function getLogger(level: LogLevel) {
  if (process.env.NODE_ENV === 'test') {
    return () => undefined;
  }

  /* istanbul ignore if */
  if (process.env.CONSOLE_LOGGER) {
    return (type: LogType, msg: string, props?: any) => {
      console[level](
        JSON.stringify({
          time: Date.now(),
          pid: process.pid,
          level,
          type,
          msg,
          ...props,
        })
      );
    };
  }
  /* istanbul ignore next */
  return (type: LogType, msg: string, payload?: any, callback?: () => void) => {
    const logline = () => {
      let p: string | undefined;
      try {
        p = JSON.stringify(payload);
      } catch {
        p = undefined;
      }
      return LogModel.create({
        time: Date.now(),
        pid: process.pid,
        level,
        type,
        msg,
        payload: p,
      });
    };
    pushWork(logline, callback);
  };
}

export const info = getLogger('info');
export const warn = getLogger('warn');
export const error = getLogger('error');
export default {
  info,
  warn,
  error,
};

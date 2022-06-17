import { ErrorHandler } from './types';

/**
 * runtime javascript error
 */
function catchRuntimeError(send: (e: Error) => void) {
  // preserve original error handler
  const _onerror = window.onerror;
  window.onerror = (...args) => {
    _onerror && _onerror.apply(window, args);
    if (args[4] instanceof Error) {
      send(args[4]);
    }
  };
}

/**
 * unhandled promise rejection
 */
function catchPromiseError(send: (e: Error) => void) {
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason instanceof Error) {
      send(e.reason);
    }
  });
}

/**
 * generate error from dom element
 */
function genResourceError(
  element:
    | HTMLScriptElement
    | HTMLLinkElement
    | HTMLImageElement
    | HTMLMediaElement
    | HTMLIFrameElement
) {
  const tagName = element.tagName
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
  const error = new Error('');
  error.name = tagName.replace(/^\w/, (c) => c.toUpperCase()) + 'Error';
  error.stack = element.outerHTML;
  if (element instanceof HTMLLinkElement) {
    error.message = element.href;
  } else {
    error.message = element.src;
  }
  return error;
}

/**
 * resource loading error
 */
function catchResourceError(send: (e: Error) => void) {
  window.addEventListener(
    'error',
    (e) => {
      // runtime js error filter
      const target = e.target || e.srcElement;
      // script loading error
      if (
        target instanceof HTMLScriptElement ||
        target instanceof HTMLLinkElement ||
        target instanceof HTMLImageElement ||
        target instanceof HTMLMediaElement ||
        target instanceof HTMLIFrameElement
      ) {
        send(genResourceError(target));
      }
    },
    true // resource error event not bubble up
  );
}

export default (sendError: ErrorHandler) => {
  const href = location.href;
  catchRuntimeError((e) => sendError(href, 'runtime', e));
  catchPromiseError((e) => sendError(href, 'promise', e));
  catchResourceError((e) => sendError(href, 'resource', e));
};

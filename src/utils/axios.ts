import { default as _axios } from 'axios';

const baseURL = '/';
let qid = 1;

/**
 * mount qid, request time and auth token
 */
function requestConfigInterceptor(config: any) {
  config.qid = qid++;
  config.time = Date.now();
  return config;
}

/**
 * log request metadata
 */
function responseInterceptor(res: any) {
  const status = res.status;
  const qid = res.config.qid;
  const method = res.config.method?.toUpperCase();
  const url = res.config.url;
  const time = res.config.time;
  const duration = Date.now() - time;
  console.log(
    `#${qid} -> ${method} ${url} (${status}) [${duration}ms] | ${time}`
  );
  return res;
}

/**
 * log error metadata
 */
/* istanbul ignore next */
function responseErrorInterceptor(e: any) {
  const status = e.response ? e.response.status || '?' : '?';
  const qid = e.config?.qid || '?';
  const method = e.config?.method?.toUpperCase() || '?';
  const url = e.config?.url || '?';
  const time = e.config?.time;
  const duration = Date.now() - time || '?';
  console.error(
    `#${qid} -> ${method} ${url} (${status}) [${duration}ms] | ${time}`
  );
  return Promise.reject(e);
}

export const axios = _axios.create({
  baseURL,
  timeout: 10000,
});
axios.interceptors.request.use(requestConfigInterceptor);
axios.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

export const api = _axios.create({
  baseURL: baseURL + 'api',
  timeout: 10000,
});
api.interceptors.request.use(requestConfigInterceptor);
api.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

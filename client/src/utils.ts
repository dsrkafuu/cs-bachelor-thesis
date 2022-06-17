const CACHE_KEY_PREFIX = 'dsra-';
type CacheKey = 'sfp' | 'cvsfp';

/**
 * get session cache from storage
 */
export function getCache(key: CacheKey) {
  try {
    return sessionStorage.getItem(CACHE_KEY_PREFIX + key);
  } catch {
    return null;
  }
}

/**
 * set session cache to storage
 */
export function setCache(key: CacheKey, value: string) {
  try {
    sessionStorage.setItem(CACHE_KEY_PREFIX + key, value);
  } catch {
    return;
  }
}

/**
 * ensure the id is a valid 24-char object id
 */
export function formatID(id: string) {
  return id.length === 24 ? id : null;
}

/**
 * ensure the host looks like `https://example.org` or `https://example.org/sub` (no trail)
 */
export function formatHost(api: string) {
  // remove trailing slash if has
  const exp = /(.*)\/$/.exec(api);
  if (exp && exp[1]) {
    api = exp[1];
  }
  return /^https?:\/\/.+[^/]$/i.test(api) ? api : null;
}

/**
 * convert array buffer to hex string
 */
function toHex(buf: ArrayBuffer) {
  const byteToHex: string[] = [];
  for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, '0');
    byteToHex.push(hexOctet);
  }
  const buff = new Uint8Array(buf);
  const hexOctets: string[] = [];
  for (let i = 0; i < buff.length; ++i) {
    hexOctets.push(byteToHex[buff[i]]);
  }
  return hexOctets.join('');
}

/**
 * get a canvas fingerprint
 */
export default async function getCanvasFP() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = 200;
    canvas.width = 500;
    if (!ctx) {
      return '';
    }
    // text with lowercase/uppercase/punctuation symbols
    const txt = '❁ AbCdEfGh\n\r <🍎🍊🍉🍈🍒🍍🥝>';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    // color mixing to increase the difference in rendering
    ctx.fillStyle = '#069';
    ctx.fillText(txt, 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText(txt, 4, 17);
    // canvas blending
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgb(0,255,255)';
    ctx.beginPath();
    ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgb(255,255,0)';
    ctx.beginPath();
    ctx.arc(75, 100, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgb(255,0,255)';
    // canvas winding
    ctx.arc(75, 75, 75, 0, Math.PI * 2, true);
    ctx.arc(75, 75, 25, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    // export to data url
    const url = canvas.toDataURL();
    const buf = new TextEncoder().encode(url);
    const hash = await window.crypto.subtle.digest('SHA-1', buf);
    return toHex(hash);
  } catch (e) {
    console.log(e);
    return '';
  }
}

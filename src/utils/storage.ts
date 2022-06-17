export const KEY_CUR_SITE = 'dsra-cur_site';
export const KEY_TZ = 'dsra-tz';

export function setItem(key: string, data: any, session?: boolean) {
  try {
    if (session) {
      sessionStorage.setItem(key, JSON.stringify(data));
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch {
    return;
  }
}

export function getItem(key: string, session?: boolean) {
  try {
    const data = (session ? sessionStorage : localStorage).getItem(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function removeItem(key: string, session?: boolean) {
  try {
    if (session) {
      sessionStorage.removeItem(key);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    return;
  }
}

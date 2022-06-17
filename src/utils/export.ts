import { api } from './axios';

/* istanbul ignore next */
function objArrayToCSV(keys: string[], arr: any[]) {
  if (!keys.length || !arr.length) {
    return '';
  }
  const ret = arr.map((obj) => {
    return keys.map((key) => obj[key] || '').join(',');
  });
  ret.unshift(Object.keys(arr[0]).join(','));
  return ret.join('\n');
}

/**
 * download string as file
 */
/* istanbul ignore next */
export default async (path: string, params: any) => {
  const res = await api.get(path, { params: { ...params, export: 1 } });
  let data = res.data;
  if (!Array.isArray(data) || typeof data[0] !== 'object') {
    data = [];
  }
  const keys = new Set<string>();
  for (const obj of data) {
    for (const key in obj) {
      keys.add(key);
    }
  }
  const keysArr = Array.from(keys);
  const blob = new Blob([objArrayToCSV(keysArr, data)], {
    type: 'text/csv',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'data.csv';
  a.click();
};

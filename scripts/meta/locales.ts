import fs from 'fs';
import path from 'path';
import axios from 'axios';

const url =
  'https://ghproxy.com/https://raw.githubusercontent.com/umpirsky/locale-list/master/data/zh_CN/locales.json';

(async () => {
  const dest = path.resolve(__dirname, '../../src/hooks/useLocales');
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  const target = path.join(dest, 'locales.json');
  const updfile = path.join(dest, 'locales.txt');

  let lastupd = NaN;
  if (fs.existsSync(updfile)) {
    lastupd = Number(fs.readFileSync(updfile, 'utf-8').trim());
  }
  // update in 30 days
  if (fs.existsSync(target) && Date.now() - lastupd < 30 * 24 * 3600 * 1000) {
    console.log('locales list is up to date:', new Date(lastupd).toISOString());
    return;
  }
  console.log('downloading locales list...');

  try {
    const res = await axios({ method: 'GET', url, responseType: 'stream' });
    if (!res.data) {
      throw new Error('download failed');
    }
    const stream: fs.ReadStream = res.data;
    const writer = fs.createWriteStream(target);

    await new Promise<void>((resolve) => {
      stream.pipe(writer);
      writer.on('close', () => {
        resolve();
      });
    });

    const formatted = {} as any;
    const data = JSON.parse(fs.readFileSync(target, 'utf-8'));
    for (const [key, value] of Object.entries(data)) {
      const fkey = key.toLowerCase().replaceAll('_', '-');
      formatted[fkey] = value;
    }
    fs.writeFileSync(target, JSON.stringify(formatted, null, 2));
    const time = Date.now();
    fs.writeFileSync(updfile, time.toString(), 'utf-8');
    console.log('locales list update:', new Date(time).toISOString());
    console.log('locales list saved to:', target);
  } catch (e) {
    console.log('error downloading locales list');
    console.error(e);
  }
})();

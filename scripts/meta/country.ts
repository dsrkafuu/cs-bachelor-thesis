import fs from 'fs';
import path from 'path';
import axios from 'axios';

const url =
  'https://ghproxy.com/https://raw.githubusercontent.com/umpirsky/country-list/master/data/zh_CN/country.json';

(async () => {
  const dest = path.resolve(__dirname, '../../src/hooks/useCountry');
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  const target = path.join(dest, 'country.json');
  const updfile = path.join(dest, 'country.txt');

  let lastupd = NaN;
  if (fs.existsSync(updfile)) {
    lastupd = Number(fs.readFileSync(updfile, 'utf-8').trim());
  }
  // update in 30 days
  if (fs.existsSync(target) && Date.now() - lastupd < 30 * 24 * 3600 * 1000) {
    console.log('country list is up to date:', new Date(lastupd).toISOString());
    return;
  }
  console.log('downloading country list...');

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
        const time = Date.now();
        fs.writeFileSync(updfile, time.toString(), 'utf-8');
        console.log('country list update:', new Date(time).toISOString());
        console.log('country list saved to:', target);
        resolve();
      });
    });
  } catch (e) {
    console.log('error downloading country list');
    console.error(e);
  }
})();

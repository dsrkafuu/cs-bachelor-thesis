import fs from 'fs';
import path from 'path';
// import zlib from 'zlib';
// import tar from 'tar';
import axios from 'axios';

const url =
  'https://ghproxy.com/https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb';

(async () => {
  let dest = path.resolve(__dirname, '../../public');
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  dest = path.resolve(dest, './meta');
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  const target = path.join(dest, 'GeoLite2-Country.mmdb');
  const updfile = path.join(dest, 'GeoLite2-Country.txt');

  let lastupd = NaN;
  if (fs.existsSync(updfile)) {
    lastupd = Number(fs.readFileSync(updfile, 'utf-8').trim());
  }
  if (fs.existsSync(target) && Date.now() - lastupd < 7 * 24 * 3600 * 1000) {
    console.log('geodb is up to date:', new Date(lastupd).toISOString());
    return;
  }
  console.log('downloading geodb...');

  try {
    // const res = await axios({ method: 'GET', url, responseType: 'stream' });
    // if (!res.data) {
    //   throw new Error('download failed');
    // }
    // const stream: fs.ReadStream = res.data
    //   .pipe(zlib.createGunzip({}))
    //   .pipe(tar.t());

    // await new Promise<void>((resolve) => {
    //   stream.on('entry', (entry) => {
    //     if (entry.path.endsWith('.mmdb')) {
    //       const time = Date.now();
    //       fs.writeFileSync(updfile, time.toString(), 'utf-8');
    //       const writer = fs.createWriteStream(target);
    //       entry.pipe(writer);
    //       writer.on('close', () => {
    //         console.log('geodb update:', new Date(time).toISOString());
    //         console.log('geodb saved to:', target);
    //       });
    //     }
    //   });
    //   stream.on('finish', () => {
    //     resolve();
    //   });
    // });

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
        console.log('geodb update:', new Date(time).toISOString());
        console.log('geodb saved to:', target);
        resolve();
      });
    });
  } catch (e) {
    console.log('error downloading geodb');
    console.error(e);
  }
})();

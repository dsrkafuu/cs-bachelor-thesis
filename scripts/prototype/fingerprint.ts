import 'dotenv/config';
import { createFingerprint } from '../../lib/crypto';

const fps = [
  'Mozilla/5.0 (Windows NT 10.0; rv:97.0) Gecko/20100101 Firefox/97.0|112.2.45.1|96||amd64',
  'Mozilla/5.0 (Windows NT 10.0; rv:97.0) Gecko/20100101 Firefox/97.0|112.2.45.1|96||amd64',
  'Mozilla/5.0 (Windows NT 10.0; rv:82.0) Gecko/20100101 Firefox/82.0|112.2.45.1|96||amd64',
  'Mozilla/5.0 (Windows NT 10.0; rv:97.0) Gecko/20100101 Firefox/97.0|112.2.45.2|96||amd64',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36 Edg/99.0.1150.30',
];

/**
 * hash collision rate
 * @param size namespace
 * @param times calculate times
 */
function collision(size: number, times: number) {
  const exponent = (-times * (times - 1)) / (2 * size);
  return 1 - Math.E ** exponent;
}

(async () => {
  fps.forEach((fp) => console.log(fp));
  fps.forEach((fp) => console.log(createFingerprint(fp)));
  // https://www.ruanyifeng.com/blog/2018/09/hash-collision-and-birthday-attack.html
  // 24char session fingerprint
  const namespace = '0123456789abcdef'.length ** 32;
  // assume 7.9 billion (everyone) use hundred client to view website
  const pop = 7.9 * 1e9 * 100;
  const rate = collision(namespace, pop);
  console.log(rate * 100 + '%'); // 8.8e-14%
})();

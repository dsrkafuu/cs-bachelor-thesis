const axios = require('axios');
const { prompt } = require('enquirer');
const { bench, wait } = require('./bench');

const ORIGIN = 'http://localhost:3000';
const UA_FIREFOX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0';
const UA_EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 Edg/98.0.1108.56';

function getRandomIP() {
  const ip = [];
  for (let i = 0; i < 4; i++) {
    ip.push(Math.floor(Math.random() * 256));
  }
  if (ip[0] === 0) {
    ip[0] = 168;
  }
  return ip.join('.');
}

(async () => {
  const url = new URL('http://localhost:3000/api/collect');
  url.searchParams.set('id', '622988ef9aaae09d163eead1');
  url.searchParams.set('route', 'view');
  url.searchParams.set('href', 'http://localhost:5000/posts/hello/');
  url.searchParams.set('ref', 'https://github.com/dsrkafuu/dsr-analytics');
  url.searchParams.set('screen', '1366x768');
  url.searchParams.set('lang', 'zh-CN');

  const { type } = await prompt({
    type: 'select',
    name: 'type',
    message: '请选择测试类型',
    choices: [
      '同 Session View 创建',
      '同 Session View 创建 (带缓存)',
      '不同 Session View 创建',
    ],
  });

  if (type === '同 Session View 创建') {
    console.log(`\n正在测试同 Session View 创建...`);
    await bench(url.toString(), 'GET', {
      headers: {
        'User-Agent': UA_FIREFOX,
        'X-Client-IP': '114.114.114.114',
        Origin: ORIGIN,
      },
    });
    await wait(5000);
  } else if (type === '同 Session View 创建 (带缓存)') {
    console.log(`\n正在测试同 Session View 创建 (带缓存)...`);
    // pre-gen session
    const res = await axios.get(url.toString(), {
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': UA_EDGE,
        'X-Client-IP': getRandomIP(),
        Origin: ORIGIN,
      },
    });
    if (res.status !== 201) {
      throw new Error(`预构建缓存失败，HTTP 代码：${res.status}`);
    }
    // apply cache
    const cache = res.data;
    console.log(`使用缓存：${cache}`);
    const urlWithCache = new URL(url.toString());
    urlWithCache.searchParams.set('cache', cache);
    await bench(urlWithCache.toString(), 'GET', {
      headers: {
        'User-Agent': UA_EDGE,
        Origin: ORIGIN,
      },
    });
    await wait(5000);
  } else {
    console.log(`\n正在测试不同 Session View 创建...`);
    await bench(url.toString(), 'GET', {
      headers: {
        'User-Agent': UA_FIREFOX,
        Origin: ORIGIN,
      },
      setupClient: (client) => {
        client.setHeaders({
          'X-Client-IP': getRandomIP(),
        });
      },
    });
  }
})();

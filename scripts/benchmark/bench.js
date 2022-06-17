const autocannon = require('autocannon');

function bench(url, method = 'GET', options = {}) {
  const connections = 1000; // 1000 线程
  const pipelining = 1; // 每请求对应一个 TCP 连接 (无 pipelining)
  const duration = 10; // 10 秒

  options = {
    ...options,
    url,
    method,
    connections,
    pipelining,
    duration,
  };

  return new Promise((resolve, reject) => {
    const cannon = autocannon(options, (e, res) => {
      if (e) {
        reject(e);
      }
      resolve(res);
    });
    autocannon.track(cannon);
  });
}

function wait(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = {
  bench,
  wait,
};

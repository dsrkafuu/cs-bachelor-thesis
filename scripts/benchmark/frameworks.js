const childProcess = require('child_process');
const path = require('path');
const { bench, wait } = require('./bench');

const frameworks = [
  {
    name: 'Node HTTP',
    file: path.resolve(__dirname, './frameworks/http.js'),
  },
  {
    name: 'Express',
    file: path.resolve(__dirname, './frameworks/express.js'),
  },
  {
    name: 'Fastify',
    file: path.resolve(__dirname, './frameworks/fastify.js'),
  },
  {
    name: 'Connect',
    file: path.resolve(__dirname, './frameworks/connect.js'),
  },
];

(async () => {
  // 启动测试
  for (let i = 0; i < frameworks.length; i++) {
    const framework = frameworks[i];
    const times = [];
    for (let j = 0; j < 10; j++) {
      const proc = childProcess.fork(framework.file);
      const duration = await new Promise((resolve) => {
        proc.on('message', (duration) => {
          if (typeof duration === 'number') {
            resolve(duration);
          }
        });
      });
      times.push(duration);
      proc.kill('SIGINT');
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(
      `${framework.name}: ${times.reduce((pre, cur) => `${pre} ${cur}`, '')}`
    );
    console.log(
      `${framework.name} inited ${times.length} times in average ${(
        avg / 1e6
      ).toFixed(2)}ms\n`
    );
  }
  await wait(3000);

  // 性能测试
  for (let i = 0; i < frameworks.length; i++) {
    const framework = frameworks[i];
    const proc = childProcess.fork(framework.file);
    await new Promise((resolve) => {
      proc.on('message', (duration) => {
        if (typeof duration === 'number') {
          resolve(duration);
        }
      });
    });
    console.log(`\nperformancing ${framework.name}...`);
    await bench('http://localhost:3100/');
    proc.kill('SIGINT');
  }
})();

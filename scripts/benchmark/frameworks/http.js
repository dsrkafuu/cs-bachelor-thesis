const process = require('process');
const start = process.hrtime.bigint();

const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      msg: 'Hello World',
    })
  );
});

const duration = Number(process.hrtime.bigint() - start);
server.listen(3100, () => {
  process.send && process.send(duration);
});

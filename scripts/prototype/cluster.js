const cluster = require('cluster');
const http = require('http');
const os = require('os');

const cpus = os.cpus().length;
if (cluster.isMaster) {
  // fork workers
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }
} else {
  // in workers do the work
  http
    .createServer((_, res) => {
      res.writeHead(204);
      res.end(null);
    })
    .listen(3000);
}

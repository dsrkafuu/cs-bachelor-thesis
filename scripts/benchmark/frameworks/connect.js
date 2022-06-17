const process = require('process');
const start = process.hrtime.bigint();

const connect = require('connect');
const router = require('router')();
const app = connect();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      msg: 'Hello World',
    })
  );
});
app.use(router);

const duration = Number(process.hrtime.bigint() - start);
app.listen(3100, () => {
  process.send && process.send(duration);
});

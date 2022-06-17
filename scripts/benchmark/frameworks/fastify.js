const process = require('process');
const start = process.hrtime.bigint();

const Fastify = require('fastify');
const fastify = Fastify();

fastify.get('/', async () => {
  return {
    msg: 'Hello World',
  };
});

const duration = Number(process.hrtime.bigint() - start);
fastify.listen(3100, () => {
  process.send && process.send(duration);
});

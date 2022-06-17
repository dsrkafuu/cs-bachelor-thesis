const process = require('process');
const start = process.hrtime.bigint();

const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.json({
    msg: 'Hello World',
  });
});

const duration = Number(process.hrtime.bigint() - start);
app.listen(3100, () => {
  process.send && process.send(duration);
});

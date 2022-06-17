const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();
const hash = require('crypto').createHash;
let data = 'abcdefghidkwxyzABCDEFGNO3456789 中文 🤣😂🤦‍♂️🎶👍💕'.repeat(100);
const scenarios = ['md5', 'sha1', 'sha256'];
for (const alg of scenarios) {
  suite.add(`${alg}`, () => hash(alg).update(data).digest('hex'));
}
suite
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .run();

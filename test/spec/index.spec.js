const {Readable, Writable} = require('stream');
const test = require('ava');
const HLS = require('hls-parser');
const fixtures = require('../helper/fixtures');
const {createUrlRewriter} = require('../..');

const results = [];
const actuals = [];

class DummyReadable extends Readable {
  constructor() {
    super({objectMode: true});
  }

  _read() {
    fixtures.forEach(({before, after}) => {
      const data = HLS.parse(before);
      if (data && data.type === 'playlist' && !data.uri) {
        data.uri = 'http://media.example.com';
      }
      this.push(data);
      results.push(after.trim());
    });
    this.push(null);
  }
}

class DummyWritable extends Writable {
  constructor() {
    super({objectMode: true});
  }

  _write(data, _, cb) {
    actuals.push(HLS.stringify(data).trim());
    cb();
  }
}

const src = new DummyReadable();
const rewrite = createUrlRewriter();
const dest = new DummyWritable();

test.cb('createUrlRewriter', t => {
  src.pipe(rewrite).pipe(dest)
  .on('finish', () => {
    t.is(results.length, actuals.length);
    for (let i = 0; i < results.length; i++) {
      t.is(results[i], actuals[i]);
    }
    t.end();
  });
});

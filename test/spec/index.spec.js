const {Readable, Writable} = require('stream');
const test = require('ava');
const HLS = require('hls-parser');
const fixtures = require('../helper/fixtures');
const {createUrlRewriter} = require('../..');

const {Segment} = HLS.types;
const results = [];
const actuals = [];
const objects = [
  {
    uri: 'abc.ts',
    mediaSequenceNumber: 0,
    discontinuitySequence: 0
  },
  {
    uri: '/def.ts',
    mediaSequenceNumber: 1,
    discontinuitySequence: 0
  },
  {
    uri: 'http://media.example.com/ghi.ts',
    mediaSequenceNumber: 2,
    discontinuitySequence: 0
  }
];
const urlsExpected = [
  '/media.example.com/playlist/abc.ts',
  '/media.example.com/def.ts',
  '/media.example.com/ghi.ts'
];
const urlsActual = [];

class DummyReadable extends Readable {
  constructor() {
    super({objectMode: true});
  }

  _read() {
    fixtures.forEach(({before, after}) => {
      const data = HLS.parse(before);
      if (data && data.type === 'playlist' && !data.uri) {
        data.uri = 'http://media.example.com/playlist/media.m3u8';
      }
      this.push(data);
      results.push(after.trim());
    });
    objects.forEach(object => {
      this.push(new Segment(object));
    });
    this.push(null);
  }
}

class DummyWritable extends Writable {
  constructor() {
    super({objectMode: true});
  }

  _write(data, _, cb) {
    if (data.type === 'playlist') {
      actuals.push(HLS.stringify(data).trim());
    } else if (data.type === 'segment') {
      urlsActual.push(data.uri);
    }
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
    t.is(urlsExpected.length, urlsActual.length);
    for (let i = 0; i < urlsExpected.length; i++) {
      t.is(urlsExpected[i], urlsActual[i]);
    }
    t.end();
  });
});

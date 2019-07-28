const {Readable, Writable} = require('stream');
const test = require('ava');
const HLS = require('hls-parser');
const fixtures = require('../helper/fixtures-file');
const {createUrlRewriter} = require('../..');

const {Segment} = HLS.types;
const results = [];
const actuals = [];
const objects = [
  {
    uri: 'abc.ts',
    parentUri: 'file:///path/to/playlist/media.m3u8',
    mediaSequenceNumber: 0,
    discontinuitySequence: 0
  },
  {
    uri: '/def.ts',
    parentUri: 'file:///path/to/playlist/media.m3u8',
    mediaSequenceNumber: 1,
    discontinuitySequence: 0
  },
  {
    uri: 'http://media.example.com/ghi.ts',
    parentUri: 'file:///path/to/playlist/media.m3u8',
    mediaSequenceNumber: 2,
    discontinuitySequence: 0
  }
];
const urlsExpected = [
  'abc.ts',
  '/def.ts',
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
      if (data.isMasterPlaylist) {
        data.uri = 'file:///path/to/playlist/master.m3u8';
        data.parentUri = '';
      } else {
        data.uri = '/playlist/media.m3u8';
        data.parentUri = 'file:///path/to/playlist/master.m3u8';
        for (const segment of data.segments) {
          segment.parentUri = data.uri;
        }
      }
      this.push(data);
      results.push(after.trim());
    });
    objects.forEach(object => {
      const segment = new Segment(object);
      segment.parentUri = 'file:///path/to/playlist/media.m3u8';
      this.push(segment);
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
      const result = HLS.stringify(data).trim();
      // console.log(result);
      actuals.push(result);
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

const {Readable, Writable} = require('stream');
const test = require('ava');
const HLS = require('hls-parser');
const getFixtures = require('../helper/fixtures');
const {createUrlRewriter} = require('../..');

const {Segment} = HLS.types;
const results = [];
const actuals = [];
const objects = [
  {
    uri: 'abc.ts',
    parentUri: 'http://media.example.com/playlist/media.m3u8',
    mediaSequenceNumber: 0,
    discontinuitySequence: 0
  },
  {
    uri: '/def.ts',
    parentUri: 'http://media.example.com/playlist/media.m3u8',
    mediaSequenceNumber: 1,
    discontinuitySequence: 0
  },
  {
    uri: 'http://foo.bar/ghi.ts',
    parentUri: 'http://media.example.com/playlist/media.m3u8',
    mediaSequenceNumber: 2,
    discontinuitySequence: 0
  }
];
const urlsExpected = [
  'abc.ts',
  '../def.ts',
  '/foo.bar/ghi.ts'
];
const urlsActual = [];

class DummyReadable extends Readable {
  constructor() {
    super({objectMode: true});
  }

  _read() {
    const fixtures = getFixtures();
    fixtures.forEach(({before, after}) => {
      const data = HLS.parse(before);
      if (data.isMasterPlaylist) {
        data.uri = masterPlaylistUrl;
        data.parentUri = '';
        isMasterPlaylistRead = true;
      } else {
        data.uri = 'playlist/media.m3u8';
        data.parentUri = masterPlaylistUrl;
        for (const segment of data.segments) {
          segment.parentUri = 'http://media.example.com/playlist/media.m3u8';
        }
      }
      this.push(data);
      results.push(after.trim());
    });
    objects.forEach(object => {
      const segment = new Segment(object);
      segment.parentUri = 'http://media.example.com/playlist/media.m3u8';
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
      if (data.isMasterPlaylist) {
        actualMasterPlaylistUrl = data.uri;
      }
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

const masterPlaylistUrl = 'http://media.example.com/master.m3u8';
let isMasterPlaylistRead = false;
let actualMasterPlaylistUrl;

test.cb('createUrlRewriter', t => {
  src.pipe(rewrite).pipe(dest)
  .on('finish', () => {
    t.is(results.length, actuals.length);
    for (const i of results.keys()) {
      t.is(results[i], actuals[i]);
    }
    t.is(urlsExpected.length, urlsActual.length);
    for (const i of urlsExpected.keys()) {
      t.is(urlsExpected[i], urlsActual[i]);
    }
    if (isMasterPlaylistRead) {
      t.is(actualMasterPlaylistUrl, masterPlaylistUrl);
    }
    t.end();
  });
});

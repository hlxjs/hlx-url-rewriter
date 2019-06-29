const stream = require('stream');
const defaultFunc = require('./default');

class TransformStream extends stream.Transform {
  constructor(rules) {
    super({objectMode: true});
    this.rules = rules || defaultFunc;
  }

  _transform(data, _, cb) {
    if (data.type === 'playlist') {
      rewrite(data, this.rules);
    }
    this.push(data);
    cb();
  }
}

function rewrite(playlist, rewriteFunc) {
  function rewriteUrl(item = {}) {
    const {uri} = item;
    if (uri) {
      item.uri = rewriteFunc(uri);
    }
  }
  function rewriteUrls(list) {
    for (const item of list) {
      rewriteUrl(item);
      rewriteUrl(item.key);
      rewriteUrl(item.map);
    }
  }
  rewriteUrl(playlist);
  if (playlist.isMasterPlaylist) {
    const {variants, sessionDataList, sessionKeyList} = playlist;
    [variants, sessionDataList, sessionKeyList].forEach(rewriteUrls);
    for (const variant of variants) {
      const {audio, video, subtitles, closedCaptions} = variant;
      [audio, video, subtitles, closedCaptions].forEach(rewriteUrls);
    }
  } else {
    const {segments} = playlist;
    rewriteUrls(segments);
  }
}

module.exports = TransformStream;

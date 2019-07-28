const path = require('path');
const debug = require('debug');
const {createUrl} = require('hlx-util');

const print = debug('hlx-url-rewriter');

function defaultFunc(data) {
  if (data.type === 'playlist') {
    if (data.isMasterPlaylist) {
      const {variants, sessionDataList, sessionKeyList} = data;
      for (const variant of variants) {
        rewriteUrl(variant, data);
        const {audio, video, subtitles, closedCaptions} = variant;
        [audio, video, subtitles, closedCaptions].forEach(list => {
          rewriteUrls(list, data);
        });
      }
      [sessionDataList, sessionKeyList].forEach(list => {
        rewriteUrls(list, data);
      });
      rewriteUrl(data);
    } else {
      rewriteUrls(data.segments, data);
      rewriteUrl(data);
    }
  } else if (data.type === 'segment') {
    rewriteUrl(data);
  }
}

function rewriteUrls(list, base) {
  for (const item of list) {
    rewriteUrl(item, base);
  }
}

function rewriteUrl(data, base = {}) {
  if (!data || data.__hlx_url_rewriter_visited__) {
    return;
  }
  const {uri, parentUri} = data;
  if (parentUri) {
    data.uri = rewrite(uri, parentUri);
  } else {
    data.uri = rewrite(uri, base.uri);
  }

  if (data.type === 'segment') {
    rewriteUrl(data.key, data);
    rewriteUrl(data.map, data);
  }
  data.__hlx_url_rewriter_visited__ = true;
}

function rewrite(uri, base) {
  print(`\t<<< "${uri}", "${base}"`);
  let result;
  const obj = createUrl(uri, base);
  if (obj.protocol === 'file:') {
    result = uri;
  } else {
    result = `${path.join(`/${obj.hostname}`, obj.pathname)}${obj.search}${obj.hash}`;
  }
  print(`\t>>> "${result}"`);
  return result;
}

module.exports = defaultFunc;

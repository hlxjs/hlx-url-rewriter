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

function rewriteUrl(data, base) {
  if (!data || data.__hlx_url_rewriter_visited__) {
    return;
  }
  const {uri, parentUri} = data;
  if (parentUri) {
    data.uri = rewrite(uri, parentUri);
  } else {
    data.uri = rewrite(uri, base ? createUrl(base.uri, base.parentUri).href : '');
  }

  if (data.type === 'segment') {
    rewriteUrl(data.key, base);
    rewriteUrl(data.map, base);
  }
  data.__hlx_url_rewriter_visited__ = true;
}

function createFullPath(obj) {
  const {rootPath = '/'} = defaultFunc.options;
  const pathname = obj.protocol === 'file:' ? path.relative(rootPath, obj.pathname) : obj.pathname;
  return path.join(`/${obj.hostname}`, pathname);
}

function rewrite(uri, base) {
  print(`\t<<< "${uri}", "${base}"`);
  const obj = createUrl(uri, base);
  if (!base) {
    return uri;
  }
  const pathname = createFullPath(obj);
  const basePathname = createFullPath(createUrl(base));
  const result = path.relative(path.dirname(basePathname), pathname);
  print(`\t>>> "${result}"`);
  return `${result}${obj.search}${obj.hash}`;
}

module.exports = defaultFunc;

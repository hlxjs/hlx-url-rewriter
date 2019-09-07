const path = require('path');
const {URL} = require('url');
const debug = require('debug');
const {tryCatch} = require('hlx-util');

const print = debug('hlx-url-rewriter');

function createUrl(url, base) {
  return tryCatch(
    () => new URL(url),
    () => new URL(url, base),
    () => null
  );
}

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

function rewrite(uri, base) {
  const {rootPath = '/'} = defaultFunc.options;
  const playlistUrl = createUrl(base);
  if (path.isAbsolute(uri) && playlistUrl.protocol === 'file:') {
    uri = `file://${path.join(rootPath, uri)}`;
  }
  print(`\t<<< "${uri}", "${base}", rootPath=${rootPath}`);
  const url = createUrl(uri, base);
  if (!url) {
    print(`\t>>> "${uri}"`);
    return uri;
  }
  let result;
  if (!playlistUrl) {
    print('\tpattern-A');
    result = path.relative(url.protocol === 'file:' ? rootPath : '/', url.pathname);
  } else if (url.protocol === playlistUrl.protocol && url.hostname === playlistUrl.hostname) {
    print('\tpattern-B');
    result = path.relative(path.dirname(playlistUrl.pathname), url.pathname);
  } else if (playlistUrl.protocol === 'file:') {
    print('\tpattern-C');
    result = path.relative(path.dirname(playlistUrl.pathname), path.join(rootPath, url.hostname, url.pathname));
  } else {
    print('\tpattern-D');
    result = path.join('/', url.hostname, url.pathname);
  }
  print(`\t>>> "${result}"`);
  return `${result}${url.search}${url.hash}`;
}

module.exports = defaultFunc;

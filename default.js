const path = require('path');
const {URL} = require('url');
const debug = require('debug');

const print = debug('hlx-url-rewriter');

function tryCatch(...params) {
  const func = params.shift();
  try {
    return func();
  } catch (err) {
    if (params.length > 0) {
      return tryCatch(...params);
    }
    throw err;
  }
}

function getUrlObj(url) {
  return tryCatch(
    () => {
      return new URL(url);
    },
    () => {
      return null;
    }
  );
}

function getUrlType(url) {
  if (tryCatch(
      () => {
        url = new URL(url);
        return true;
      },
      () => {
        return false;
      }
    )) {
    return 'absolute';
  }

  if (url.startsWith('//')) {
    return 'scheme-relative';
  }

  if (url.startsWith('/')) {
    return 'path-absolute';
  }

  return 'path-relative';
}

let baseUrl = null;

function defaultFunc(data) {
  if (data.type === 'playlist') {
    if (data.isMasterPlaylist) {
      rewriteUrl(data, true);
      const {variants, sessionDataList, sessionKeyList} = data;
      for (const variant of variants) {
        rewriteUrl(variant);
        const {audio, video, subtitles, closedCaptions} = variant;
        [audio, video, subtitles, closedCaptions].forEach(rewriteUrls);
      }
      [sessionDataList, sessionKeyList].forEach(rewriteUrls);
    } else {
      rewriteUrl(data, true);
      rewriteUrls(data.segments);
    }
  } else if (data.type === 'segment') {
    rewriteUrl(data);
  }
}

function rewriteUrls(list) {
  for (const item of list) {
    rewriteUrl(item);
  }
}

function rewriteUrl(data, saveAsBaseUrl) {
  rewrite(data, saveAsBaseUrl);
  if (data.type === 'segment') {
    rewrite(data.key);
    rewrite(data.map);
  }
}

function rewrite(data, saveAsBaseUrl) {
  if (!data || data.__hlx_url_rewriter_visited__) {
    return;
  }

  let {uri} = data;

  print(`\t<<< "${uri}"`);

  if (saveAsBaseUrl) {
    baseUrl = null;
  }

  let type = getUrlType(uri);

  if (type === 'scheme-relative') {
    uri = `http:${uri}`;
    type = 'absolute';
  }

  if (type === 'absolute') {
    const obj = getUrlObj(uri);
    if (saveAsBaseUrl) {
      baseUrl = obj;
    }
    data.uri = `/${obj.hostname}${obj.pathname}${obj.search}${obj.hash}`;
  } else if (type === 'path-absolute' && baseUrl) {
    data.uri = `/${baseUrl.hostname}${uri}`;
  } else if (type === 'path-relative' && baseUrl) {
    data.uri = path.resolve(`/${baseUrl.hostname}/${path.dirname(baseUrl.pathname)}/`, uri);
  }
  print(`\t>>> "${data.uri}"`);
  data.__hlx_url_rewriter_visited__ = true;
}

module.exports = defaultFunc;

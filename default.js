const {URL} = require('url');

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

let baseHostName = '';

function defaultFunc(url, saveAsBaseUrl) {
  if (saveAsBaseUrl) {
    baseHostName = '';
  }

  // Convert absolute urls into relative paths
  let type = getUrlType(url);

  if (type === 'scheme-relative') {
    url = `http:${url}`;
    type = 'absolute';
  }

  if (type === 'absolute') {
    const obj = getUrlObj(url);
    if (saveAsBaseUrl) {
      baseHostName = obj.hostname;
    }
    return `/${obj.hostname}${obj.pathname}${obj.search}${obj.hash}`;
  }

  if (type === 'path-absolute' && baseHostName) {
    return `/${baseHostName}${url}`;
  }

  return url;
}

module.exports = defaultFunc;

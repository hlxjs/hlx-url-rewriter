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

function defaultFunc(url) {
  // Convert absolute urls into relative paths
  const obj = getUrlObj(url);
  if (!obj) {
    // url is already a relative path
    return url;
  }
  return `/${obj.hostname}${obj.pathname}${obj.search}${obj.hash}`;
}

module.exports = defaultFunc;

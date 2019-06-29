[![Build Status](https://travis-ci.org/hlxjs/hlx-url-rewriter.svg?branch=master)](https://travis-ci.org/hlxjs/hlx-url-rewriter)
[![Coverage Status](https://coveralls.io/repos/github/hlxjs/hlx-url-rewriter/badge.svg?branch=master)](https://coveralls.io/github/hlxjs/hlx-url-rewriter?branch=master)
[![Dependency Status](https://david-dm.org/hlxjs/hlx-url-rewriter.svg)](https://david-dm.org/hlxjs/hlx-url-rewriter)
[![Development Dependency Status](https://david-dm.org/hlxjs/hlx-url-rewriter/dev-status.svg)](https://david-dm.org/hlxjs/hlx-url-rewriter#info=devDependencies)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

# hlx-url-rewriter
A transform stream to modify URLs contained in HLS playlists

## Features
* Being used with other [`hls-streams`](https://github.com/hls-streams) objects, it provides a functionality to filter every playlists and rewrite the urls in them based on the `rules`.

## Install
[![NPM](https://nodei.co/npm/hlx-url-rewriter.png?mini=true)](https://nodei.co/npm/hlx-url-rewriter/)

## Usage

```js
const {createReadStream} = require('hlx-file-reader');
const {createUrlRewriter} = require('hlx-url-rewriter'); // url-rewriter
const {createTerminator} = require('hlx-terminator')

const src = createReadStream('https://foo.bar/sample.m3u8');
const rewrite = createUrlRewriter(urlStr => {
  // Convert an absolute url into a relative one
  const url = new URL(urlStr);
  return url.pathname;
});
const dest = createTerminator();

// Rewrite all urls
src.pipe(rewrite).pipe(dest)
.on('data', data => {
  console.log(data.uri); // should be a relative url
});
```
## API
The features are built on top of the Node's [transform streams](https://nodejs.org/api/stream.html#stream_class_stream_transform).

### `createUrlRewriter(rules)`
Creates a new `TransformStream` object.

#### params
| Name    | Type   | Required | Default | Description   |
| ------- | ------ | -------- | ------- | ------------- |
| rules | function | No       | internally defined default function (see below) | A function that takes an original url string and returns a modified url string. The function is called asynchronously each time the stream encountered a url line or url attribute in playlists. |

#### default function
Default behavior is something like below (pseudo code):
```js
function defaultFunc(url) {
  // Convert absolute urls into relative paths
  if (url is relative) {
    return url;
  } else {
    // Make a root directory with the hostname
    return `/${url.hostname}/${url.pathname}`;
  }
}
```

#### return value
An instance of `TransformStream`.

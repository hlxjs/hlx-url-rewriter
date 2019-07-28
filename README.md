[![Build Status](https://travis-ci.org/hlxjs/hlx-url-rewriter.svg?branch=master)](https://travis-ci.org/hlxjs/hlx-url-rewriter)
[![Coverage Status](https://coveralls.io/repos/github/hlxjs/hlx-url-rewriter/badge.svg?branch=master)](https://coveralls.io/github/hlxjs/hlx-url-rewriter?branch=master)
[![Dependency Status](https://david-dm.org/hlxjs/hlx-url-rewriter.svg)](https://david-dm.org/hlxjs/hlx-url-rewriter)
[![Development Dependency Status](https://david-dm.org/hlxjs/hlx-url-rewriter/dev-status.svg)](https://david-dm.org/hlxjs/hlx-url-rewriter#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/hlxjs/hlx-url-rewriter/badge.svg)](https://snyk.io/test/github/hlxjs/hlx-url-rewriter)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

# hlx-url-rewriter
A transform stream to modify URLs contained in HLS playlists

## Features
* Being used with other [`hlx`](https://github.com/hlxjs) objects, it provides a functionality to filter every playlists and rewrite the urls in them based on the `rules`.

## Install
[![NPM](https://nodei.co/npm/hlx-url-rewriter.png?mini=true)](https://nodei.co/npm/hlx-url-rewriter/)

## Usage

```js
const {createReadStream} = require('hlx-file-reader');
const {createUrlRewriter} = require('hlx-url-rewriter'); // url-rewriter
const {createTerminator} = require('hlx-terminator')

const src = createReadStream('https://foo.bar/sample.m3u8');
const rewrite = createUrlRewriter(data => {
  // Convert playlist's urls from absolute to relative
  if (data.type === 'playlist') {
    const url = new URL(data.uri);
    data.uri = url.pathname;
  }
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

### `createUrlRewriter([rules, options])`
Creates a new `TransformStream` object.

#### params
| Name    | Type   | Required | Default | Description   |
| ------- | ------ | -------- | ------- | ------------- |
| rules | function | No       | internally defined default function (see below) | A function that takes an hls-parser object and modifies its url string. |
| options | function | No       | see below | An object preserving options |

#### default function
The default behavior is something like this:
```js
// pseudo code
function defaultFunc(data) {
  if (data.uri is relative) {
    // Do nothing
  } else {
    // Put in a root directory
    const url = new URL(data.uri);
    data.uri = `/${url.hostname}/${url.pathname}`;
  }
}
```

#### options
| Name        | Type   | Default | Description                       |
| ----------- | ------ | ------- | --------------------------------- |
| rootPath | string | "/" | Required if file urls are included in playlists. A file url will be converted to an absolute path assuming the `rootPath` is the root. |

#### return value
An instance of `TransformStream`.

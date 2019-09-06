[![Build Status](https://travis-ci.org/hlxjs/hlx-url-rewriter.svg?branch=master)](https://travis-ci.org/hlxjs/hlx-url-rewriter)
[![Coverage Status](https://coveralls.io/repos/github/hlxjs/hlx-url-rewriter/badge.svg?branch=master)](https://coveralls.io/github/hlxjs/hlx-url-rewriter?branch=master)
[![Dependency Status](https://david-dm.org/hlxjs/hlx-url-rewriter.svg)](https://david-dm.org/hlxjs/hlx-url-rewriter)
[![Development Dependency Status](https://david-dm.org/hlxjs/hlx-url-rewriter/dev-status.svg)](https://david-dm.org/hlxjs/hlx-url-rewriter#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/hlxjs/hlx-url-rewriter/badge.svg)](https://snyk.io/test/github/hlxjs/hlx-url-rewriter)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

# hlx-url-rewriter
A transform stream to rewrite URLs in HLS playlists

## Features
* Being used with other [`hlx`](https://github.com/hlxjs) objects, it provides a functionality to filter every playlists and rewrite the urls in them.
* You can specify a custom function to parse/modify playlists or the default function will be used.
* The default function rewrites urls in accordance with the rules described below (See "default function")

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
| rewriteFunc | function | No       | An internally defined default function | A function that takes an hls-parser object and modifies url strings included in the object. |
| options | function | No       | see below | An object preserving options |

#### default function
Pseudo code:
```
function defaultFunc(playlist, playlistUrl) {
  for each url contained in the playlist {
    if (url is not an absolute url) {
      resolve url with playlistUrl to make it absolute
        ex1: "http://example.com/path/to/file" + "../../path2/to/file" = "http://example.com/path2/to/file"
        ex2: "file:///path/to/file" + "../../path2/to/file" = "file:///path2/to/file"
        ex3: "http://example.com/path/to/file" + "/path2/to/file" = "http://example.com/path2/to/file"
        ex4: "file:///path/to/file" + "/path2/to/file" = "file://{options.rootPath}/path/to/file"
      }
    }

    if (url is not an absolute url) {
      return url
    }
    if (url is a file url || url and playlistUrl share the same hostname) {
      return a relative path from playlistUrl.pathname to url.pathname
    }
    if (playlistUrl is a file url) {
      return a relative path from playlistUrl.pathname to "{options.rootPath}/{url.hostname}/{url.pathname}"
    }
    return "/{url.hostname}/{url.pathname}"
  }
}
```

#### options
| Name        | Type   | Default | Description                       |
| ----------- | ------ | ------- | --------------------------------- |
| rootPath | string | "/" | This value will be used by the default function to convert a file url into a relative path. |

#### return value
An instance of `TransformStream`.

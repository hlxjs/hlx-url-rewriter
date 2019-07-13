const stream = require('stream');
const defaultFunc = require('./default');

class TransformStream extends stream.Transform {
  constructor(rules) {
    super({objectMode: true});
    this.rules = rules || defaultFunc;
  }

  _transform(data, _, cb) {
    this.rules(data);
    cb(null, data);
  }
}

module.exports = TransformStream;

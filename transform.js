const stream = require('stream');
const defaultFunc = require('./default');

class TransformStream extends stream.Transform {
  constructor(rules, options = {}) {
    super({objectMode: true});
    this.rules = rules || defaultFunc;
    this.rules.options = options;
  }

  _transform(data, _, cb) {
    this.rules(data);
    cb(null, data);
  }
}

module.exports = TransformStream;

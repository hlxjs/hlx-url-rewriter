const TransformStream = require('./transform');

function createUrlRewriter(rules) {
  return new TransformStream(rules);
}

module.exports = {createUrlRewriter};
// es2015 default export compatibility
module.exports.default = module.exports;

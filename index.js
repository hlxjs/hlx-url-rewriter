const TransformStream = require('./transform');

function createUrlRewriter(...params) {
  let rules;
  let options;
  if (typeof params[0] === 'function') {
    rules = params[0];
  } else if (typeof params[0] === 'object') {
    options = params[0];
  }
  if (!options && typeof params[1] === 'object') {
    options = params[1];
  }
  return new TransformStream(rules, options);
}

module.exports = {createUrlRewriter};
// es2015 default export compatibility
module.exports.default = module.exports;

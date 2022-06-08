const diff = require('./diff');
const patch = require('./patch');
const reverse = require('./reverse');
const auto = require('./auto');

function configure(options) {
  helpers._configure(options);
}

module.exports = Object.assign(auto, { auto, diff, patch, reverse });

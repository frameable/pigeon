const diff = require('./diff');
const patch = require('./patch');
const reverse = require('./reverse');
const auto = require('./auto');
const helpers = require('./helpers');

const Pigeon = {
  diff,
  patch,
  reverse,
  auto,
};

Pigeon.id = fn => Pigeon._objId = fn;

module.exports = Pigeon;

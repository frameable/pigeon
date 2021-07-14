const assert = require('assert');
const { _decodePath, _path } = require('../helpers');

const suite = require("./index");

suite('helpers', test => {

  test('encode and decode path', _ => {
    const path = _path('/', 'http://foo.bar', {});
    assert.equal('/http:%2f%2ffoo.bar', path);

    const decodedPath = _decodePath(path);

    assert.deepEqual(decodedPath, ['', 'http://foo.bar']);
  });

});

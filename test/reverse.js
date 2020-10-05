const assert = require('assert');
const reverse = require('../reverse');

const suite = require("./index");

suite('reverse', test => {

  test('setting object property', _ => {
    assert.deepEqual(
      reverse(
        [ { op: 'replace', path: '/name', value: 'henry', _prev: 'hank' } ]
      ),
      [ { op: 'replace', path: '/name', value: 'hank', _prev: 'henry' } ]
    );
  });

  test('setting object property in array', _ => {
    assert.deepEqual(
      reverse(
        [ { op: 'add', path: '/names/0', value: { id: 38, name: 'henry' } } ]
      ),
      [ { op: 'remove', path: '/names/[38]', _index: 0, _prev: { id: 38, name: 'henry' } } ]
    );
  });

});

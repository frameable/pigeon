const assert = require('assert');
const { _decodePath, _path, _clone, _configure } = require('../helpers');

_configure({ strict: true });

const suite = require("./index");

suite('helpers', test => {

  test('encode and decode path', _ => {
    const path = _path('/', 'http://foo.bar', []);
    assert.equal('/http:~1~1foo.bar', path);

    const decodedPath = _decodePath(path);

    assert.deepEqual(decodedPath, ['', 'http://foo.bar']);
  });

  test('clone matches json parse/stringify', _ => {
    const x = Symbol('abc');

    const source = {
      date: new Date(),
      map: new Map(),
      set: new Set(),
      regex: new RegExp(/'hello'/),
      arr: [1,2,3],
      obj: {a: 1, b: 2},
      null: null,
      bool: false,
      string: 'abc',
      number: 1,
      infinity: Infinity,
      negativeInfinity: -Infinity,
      nan: NaN,
      [x]: '1',
    }

    const json = JSON.parse(JSON.stringify(source));
    const cloned = _clone(source);

    assert.deepEqual(json, cloned);

    //JSON.stringify drops keys for class, function, and undefined values
    //but we don't want to

    const heterodoxSource = {
      cls: class {},
      fn: function() {},
      undef: undefined,
    };

    const heterodoxCloned = _clone(heterodoxSource);

    assert.deepEqual(heterodoxCloned, {
      cls: undefined,
      fn: undefined,
      undef: undefined,
    });

  });

});

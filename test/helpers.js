const assert = require('assert');
const { _decodePath, _encodePath, _objId } = require('../helpers');

const suite = require("./index");

suite('helpers', test => {

  test('encode and decode path', _ => {
    const path = _encodePath('/', 'http://foo.bar', {});
    assert.equal('/http:~1~1foo.bar', path);

    const decodedPath = _decodePath(path);

    assert.deepEqual(decodedPath, ['', 'http://foo.bar']);
  });

  test('_objId gets correct id', _ => {
    const a = { id: 'foo' };
    assert.strictEqual(_objId(a), 'foo')
    const b = { _id: 'foo' };
    assert.strictEqual(_objId(b), 'foo')
    const c = { uuid: 'foo' };
    assert.strictEqual(_objId(c), 'foo')
    const d = { _uuid: 'foo' };
    assert.strictEqual(_objId(d), 'foo')
  });

  test('_objId throws when not given an id', _ => {
    assert.throws(() => _objId({ foo: 'hello' }), Error)
  });

});

const assert = require('assert');
const suite = require("./index");

const diff = require('../diff');


suite('diff', test => {

  test('primitive identity', async () => {
    assert.deepEqual(diff(1, 1), []);
  })

  test('primitive numeric', async () => {
    assert.deepEqual(
      diff(1, 2),
      [ { op: 'replace', path: '/', value: 2, _prev: 1 } ]
    );
  });

  test('primitive character', async () => {
    assert.deepEqual(
      diff('a', 'b'),
      [ { op: 'replace', path: '/', value: 'b', _prev: 'a' } ]
    );
  });

  test('object property primitive', async () => {
    assert.deepEqual(
      diff({ id: 1, title: 'hello' }, { id: 1 }),
      [ { op: 'remove', path: '/title', _prev: 'hello' } ]
    );
  });

  test('object property replace', async () => {
    assert.deepEqual(
      diff({ id: 1, title: 'hello' }, { id: 1, title: 'salut' }),
      [ { op: 'replace', path: '/title', value: 'salut', _prev: 'hello' } ]
    );
  });

  test('nested object property primitive', async () => {
    assert.deepEqual(
      diff(
        { id: 1, title: { text: 'hello', size: 24 } },
        { id: 1, title: { text: 'salut', size: 24 } }),
      [ { op: 'replace', path: '/title/text', value: 'salut', _prev: 'hello' } ]
    );
  });

  test('primitive arrays', async () => {
    assert.deepEqual(
      diff(['a', 'b', 'c'], ['a', 'b', 'c']),
      []
    );
  });

  test('primitive array append', async () => {
    assert.deepEqual(
      diff(['a', 'b'], ['a', 'b', 'c']),
      [ { op: 'add', path: '/2', value: 'c' } ]
    );
  });

  test('primitive array prepend', async () => {
    assert.deepEqual(
      diff(['a', 'b'], ['z', 'a', 'b']),
      [ { op: 'add', path: '/0', value: 'z' } ]
    );
  });

  test('primitive array remove', async () => {
    assert.deepEqual(
      diff(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'd', 'e']),
      [ { op: 'remove', path: '/2', _prev: 'c' } ]
    );
  });

  test('primitive array "replace"', async () => {
    assert.deepEqual(
      diff(['a', 'b', 'c'], ['a', 'b', 'x']),
      [ { op: 'remove', path: '/2', _prev: 'c' },
        { op: 'add', path: '/2', value: 'x' } ]
    );
  });

  test('object sub id property change', async () => {
    assert.deepEqual(
      diff(
        [
          { id: 23, name: 'tulsa', value: 920 },
          { id: 24, name: 'boise', value: 239 }
        ], [
          { id: 23, name: 'tulsa', value: 920 },
          { id: 24, name: 'boise!', value: 239 }
        ],
      ),
      [ { op: 'replace', path: '/[24]/name', value: 'boise!', _prev: 'boise' } ]
    );
  });

  test('object sub id remove', async () => {
    assert.deepEqual(
      diff(
        [
          { id: 23, name: 'tulsa', value: 920 },
          { id: 24, name: 'boise', value: 239 }
        ], [
          { id: 23, name: 'tulsa', value: 920 },
        ],
      ),
      [ { op: 'remove', path: '/[24]', _prev: { id: 24, name: 'boise', value: 239 } } ]
    );
  });

  test('object add nested property', async () => {
    assert.deepEqual(
      diff(
        { name: 'tulsa' },
        { name: 'tulsa', districts: ['downtown', 'uptown'] }
      ),
      [ { op: 'add', path: '/districts', value: ['downtown', 'uptown'] } ]
    );
  })

  test('object add and remove properties', async () => {
    assert.deepEqual(
      diff(
        { name: 'tulsa', value: 920 },
        { name: 'tulsa', population: 24012 }
      ),
      [
        { op: 'remove', path: '/value', _prev: 920 },
        { op: 'add', path: '/population', value: 24012 },
      ]
    );
  })

  test('array of objects append', async () => {
    assert.deepEqual(
      diff(
        [ { id: 1 }, { id: 2 } ],
        [ { id: 1 }, { id: 2 }, { id: 3 } ]
      ),
      [ { op: 'add', path: '/2', value: { id: 3 } } ]
    );
  })

  test('null to obj', async () => {
    assert.deepEqual(
      diff(
        { name: null },
        { name: { first: 'Joseph', last: 'Biden' } }
      ),
      [ { op: 'replace', path: '/name', value: { first: 'Joseph', last: 'Biden' }, _prev: null } ]
    );
  })

  test('obj to null', async () => {
    assert.deepEqual(
      diff(
        { name: { first: 'Joseph', last: 'Biden' } },
        { name: null }
      ),
      [ { op: 'replace', path: '/name', value: null, _prev: { first: 'Joseph', last: 'Biden' } } ]
    );
  })

  test('array order shuffle', async () => {
    assert.deepEqual(
      diff(
        [ { id: 'def' }, { id: 'abc' }, { id: 'ghi' } ],
        [ { id: 'abc' }, { id: 'def' }, { id: 'ghi' } ],
      ),
      [
        { from: '/[abc]', op: 'move', path: '/0' },
        { from: '/[def]', op: 'move', path: '/1' }
      ]
    );
  })

  test('array order shuffle literals', async () => {
    assert.deepEqual(
      diff(
        [ 'def', 'abc', 'ghi' ],
        [ 'abc', 'def', 'ghi' ],
      ),
      [
        { from: '/1', op: 'move', path: '/0' },
        { from: '/0', op: 'move', path: '/1' } // TODO: fix this bogus second change
      ]
    );
  })

  test('array remove and re-order', async () => {
    assert.deepEqual(
      diff(
        [ { id: 1, name: 'one' }, { id: 2, name: 'two' }, { id: 3, name: 'three' } ],
        [ { id: 3, name: 'three' }, { id: 2, name: 'two' } ]
      ),
      [
        { op: 'remove', path: '/[1]', _prev: { id: 1, name: 'one' } },
        { op: 'move', from: '/[3]', path: '/0' },
        { op: 'move', from: '/[2]', path: '/1' },
      ]
    );
  })

  test('more array remove and re-order', async () => {
    assert.deepEqual(
      diff(
        [ { id: 1, name: 'one' }, { id: 2, name: 'two' }, { id: 3, name: 'three' }, { id: 4, name: 'four' }, { id: 5, name: 'five' } ],
        [ { id: 3, name: 'three' }, { id: 2, name: 'two' }, { id: 5, name: 'five' } ],
      ),
      [
        { op: 'remove', path: '/[1]', _prev: { id: 1, name: 'one' } },
        { op: 'move', from: '/[3]', path: '/0' },
        { op: 'move', from: '/[2]', path: '/1' },
        { op: 'remove', path: '/[4]', _prev: { id: 4, name: 'four' } },
      ]
    );
  })

  test('array remove and re-order literal', async () => {
    assert.deepEqual(
      diff(
        [ 'abc', 'def', 'hij' ],
        [ 'hij', 'def' ],
      ),
      [
        { op: 'remove', path: '/0', _prev: 'abc' },
        { op: 'move', from: '/2', path: '/0' },
      ]
    );
  })

  test('array remove and re-order literal longer', async () => {
    assert.deepEqual(
      diff(
        [ 'abc', 'def', '000', 'hij', 'klm', 'nop' ],
        [ 'hij', 'nop', 'def', '000', 'klm' ],
      ),
      [
        { _prev: 'abc', op: 'remove', path: '/0' },
        { from: '/3', op: 'move', path: '/0' },
        { from: '/5', op: 'move', path: '/1' },
        { from: '/1', op: 'move', path: '/2' },
        { from: '/2', op: 'move', path: '/3' }
      ]
    );
  })


});


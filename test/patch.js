const suite = require('./index');
const assert = require('assert');
const patch = require('../patch');

suite('patch', async test => {

  test('obj prop', async () => {
    assert.deepEqual(
      patch(
        { count: 1 },
        [ { op: 'replace', path: '/count', value: 2 } ]
      ),
      { count: 2 }
    );
  });

  test('nested obj prop', async () => {
    assert.deepEqual(
      patch(
        { count: 1, actor: { name: 'bim' } },
        [ { op: 'replace', path: '/actor/name', value: 'bam' } ]
      ),
      { count: 1, actor: { name: 'bam' } }
    );
  });

  test('array item obj prop', async () => {
    assert.deepEqual(
      patch(
        [ { id: 1, name: 'betsy' }, { id: 2, name: 'hank' } ],
        [ { op: 'replace', path: '/[2]/name', value: 'henry' } ]
      ),
      [ { id: 1, name: 'betsy' }, { id: 2, name: 'henry' } ],
    );
  });

  test('array insert item', async () => {
    assert.deepEqual(
      patch(
        [ 1, 2, 3, 4, 5, 6 ],
        [ { op: 'add', path: '/3', value: 33 } ],
      ),
      [1, 2, 3, 33, 4, 5, 6]
    );
  });

  test('array remove item', async () => {
    assert.deepEqual(
      patch(
        [ 1, 2, 3, 4, 5, 6 ],
        [ { op: 'remove', path: '/3' } ],
      ),
      [ 1, 2, 3, 5, 6 ]
    );
  });

  test('array move item', async () => {
    assert.deepEqual(
      patch(
        [ { id: 'def' }, { id: 'abc' }, { id: 'ghi' } ],
        [
          { from: '/[abc]', op: 'move', path: '/0' },
          { from: '/[def]', op: 'move', path: '/1' }
        ]
      ),
      [ { id: 'abc' }, { id: 'def' }, { id: 'ghi' } ]
    )
  });

  test('array move item literal', async () => {
    assert.deepEqual(
      patch(
        [ 'def', 'abc', 'ghi' ],
        [
          { from: '/1', op: 'move', path: '/0' },
        ]
      ),
      [ 'abc', 'def', 'ghi' ]
    )
  });
});



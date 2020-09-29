const assert = require('assert');

const diff = require('./diff');
const patch = require('./patch');
const reverse = require('./reverse');

/* DIFF */

// primitive identity
assert.deepEqual(diff(1, 1), []);

// primitive numeric
assert.deepEqual(
  diff(1, 2),
  [ { op: 'replace', path: '/', value: 2, _prev: 1 } ]
);

// primitive character
assert.deepEqual(
  diff('a', 'b'),
  [ { op: 'replace', path: '/', value: 'b', _prev: 'a' } ]
);

// object property primitive
assert.deepEqual(
  diff({ id: 1, title: 'hello' }, { id: 1 }),
  [ { op: 'remove', path: '/title', _prev: 'hello' } ]
);

// object property replace
assert.deepEqual(
  diff({ id: 1, title: 'hello' }, { id: 1, title: 'salut' }),
  [ { op: 'replace', path: '/title', value: 'salut', _prev: 'hello' } ]
);

// nested object property primitive
assert.deepEqual(
  diff(
    { id: 1, title: { text: 'hello', size: 24 } },
    { id: 1, title: { text: 'salut', size: 24 } }),
  [ { op: 'replace', path: '/title/text', value: 'salut', _prev: 'hello' } ]
);

// primitive arrays
assert.deepEqual(
  diff(['a', 'b', 'c'], ['a', 'b', 'c']),
  []
);

// primitive array append
assert.deepEqual(
  diff(['a', 'b'], ['a', 'b', 'c']),
  [ { op: 'add', path: '/2', value: 'c' } ]
);

// primitive array prepend
assert.deepEqual(
  diff(['a', 'b'], ['z', 'a', 'b']),
  [ { op: 'add', path: '/0', value: 'z' } ]
);

// primitive array remove
assert.deepEqual(
  diff(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'd', 'e']),
  [ { op: 'remove', path: '/2', _prev: 'c' } ]
);

// primitive array "replace"
assert.deepEqual(
  diff(['a', 'b', 'c'], ['a', 'b', 'x']),
  [ { op: 'remove', path: '/2', _prev: 'c' },
    { op: 'add', path: '/2', value: 'x' } ]
);

// object sub id property change
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

// object sub id remove
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


/* PATCH */

// obj prop
assert.deepEqual(
  patch(
    { count: 1 },
    [ { op: 'replace', path: '/count', value: 2 } ]
  ),
  { count: 2 }
);

// nested obj prop
assert.deepEqual(
  patch(
    { count: 1, actor: { name: 'bim' } },
    [ { op: 'replace', path: '/actor/name', value: 'bam' } ]
  ),
  { count: 1, actor: { name: 'bam' } }
);

// array item obj prop
assert.deepEqual(
  patch(
    [ { id: 1, name: 'betsy' }, { id: 2, name: 'hank' } ],
    [ { op: 'replace', path: '/[2]/name', value: 'henry' } ]
  ),
  [ { id: 1, name: 'betsy' }, { id: 2, name: 'henry' } ],
);

// array insert item
assert.deepEqual(
  patch(
    [ 1, 2, 3, 4, 5, 6 ],
    [ { op: 'add', path: '/3', value: 33 } ],
  ),
  [1, 2, 3, 33, 4, 5, 6]
);

// array remove item
assert.deepEqual(
  patch(
    [ 1, 2, 3, 4, 5, 6 ],
    [ { op: 'remove', path: '/3' } ],
  ),
  [ 1, 2, 3, 5, 6 ]
);


/* REVERSE */

assert.deepEqual(
  reverse(
    [ { op: 'replace', path: '/name', value: 'henry', _prev: 'hank' } ]
  ),
  [ { op: 'replace', path: '/name', value: 'hank', _prev: 'henry' } ]
);

assert.deepEqual(
  reverse(
    [ { op: 'add', path: '/names/0', value: { id: 38, name: 'henry' } } ]
  ),
  [ { op: 'remove', path: '/names/[38]', _index: 0, _prev: { id: 38, name: 'henry' } } ]
);


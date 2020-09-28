# Pigeon

Semantic diff and patch for JSON suitable for CRDT


```javascript
const { diff, patch } = require('pidgeon-json-diff-patch');

const d1 = [
  { id: 3920, name: 'Chicago', population: 5239412 },
  { id: 3977, name: 'Boston', population: 1032943 },
]

const d2 = [
  { id: 3920, name: 'Chicago', population: 5239412 },
  { id: 3977, name: 'Boston', population: 1032997 },
]

const changes = diff(d1, d2);
// [
//   { op: 'replace', path: '/[3977]/population', value: 1032997, _prev: 1032943 }
// ]

patch(d1, changes)

assert.deepEqual(d1, d2);
```

## API

### changes = diff(left, right)

Compares data structures and returns changes required to make d1's content equal to d2's.  The format of the returned changes is based on [RFC 6902](https://tools.ietf.org/html/rfc6902), with the modification that path components which are array indexes, if they refer to an object, may take the form `[<id>]` where `<id>` is the value of a property meant to uniquely identify that object, with a property named `id` or `_id`.

### left = apply(left, changes)

Applies changes to the given data structure, making modifications in-place.

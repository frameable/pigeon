# Pigeon

Semantic diff and patch for JSON documents, suitable for CRDT


```javascript
const { diff, patch } = require('pigeon');

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

Compares data structures and returns changes required to make d1's content equal to d2's.  The format of the returned changes is based on [RFC 6902](https://tools.ietf.org/html/rfc6902), with the modification that path components which are array indexes, if they refer to an object, may take the form `[<id>]` where `<id>` is the value of a property meant to uniquely identify that object, with a property named `id` or `_id` or `uuid` or _uuid`.

### ⚠️⚠️⚠️ Warning ⚠️⚠️⚠️

As a consequence of the above, *all objects must have a unique identifier*. These can take the form of a property named `id` or `_id` or `uuid` or _uuid`.

### left = patch(left, changes)

Applies changes to the given data structure, making modifications in-place.


## Auto

`Pigeon.auto` is an [Automerge](https://github.com/automerge/automerge)-compatible higher-level interface for changing and syncronizing documents.

#### newDoc = auto.from(data, cid=_cid)

Create a document from an array or object.

#### newDoc = auto.clone(doc)

Clone a document.

#### changes = auto.getChanges(left, right)

Get the set of changes that would transform `left` into `right`.

#### newDoc = auto.rewindChanges(doc, ts, cid)

Roll back the document state back to the given timestamp.

#### newDoc = auto.fastForwardChanges(doc)

Roll forward the document state up to the head.

#### newDoc = auto.applyChanges(doc, changes)

Roll forward the document state up to the head, possibly after applying previous changes.

#### newDoc = auto.change(doc, fn)

Change the document according to the given function, which receivs the document as a parameter.

```javascript
doc = auto.from({ message: 'hello' });
newDoc = auto.change(doc, d => d.message = 'hey there');
changes = auto.getChanges(doc, newDoc);
```

#### changes = auto.getHistory(doc)

Get all of the changes to recreate the document from scratch.

#### newDoc = auto.load(str)

Load the document from its serialized form.

#### str = auto.save(doc)

Serialize the document to be loaded later.

### Differences from Automerge

Pigeon.auto keeps a near fully-compatible interface to Automerge, but the underlying implementation is optimized for a different use case, and makes different tradeoffs:

- By default, history will grow only to 1000 items in length, after which oldest entries will be jettisoned
- Because of the above, performance is much improved for larger docs with more changes
- Documents need not have a direct common ancestor for patches from one to apply to another
- Changes are computed across entire data structures, rather than tracing via proxies
- Unix timestamps and client ids are used instead of vector clocks to ensure order and determinism
- Since changesets use JSON-Patch paths, they are more easily introspectable using existing tools



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


## Pigeon.Auto

`Pigeon.Auto` is an Automerge-compatible higher-level interface for changing and syncronizing documents.

#### newDoc = Auto.from(data, cid=_cid)

Create a document from an array or object.

#### newDoc = Auto.clone(doc)

Clone a document.

#### changes = Auto.getChanges(left, right)

Get the set of changes that would transform `left` into `right`.

#### newDoc = Auto.rewindChanges(doc, ts, cid)

Roll back the document state back to the given timestamp.

#### newDoc = Auto.fastForwardChanges(doc)

Roll forward the document state up to the head.

#### newDoc = Auto.applyChanges(doc, changes)

Roll forward the document state up to the head, possibly after applying previous changes.

#### newDoc = Auto.change(doc, fn)

Change the document according to the given function, which receivs the document as a parameter.

```
doc = Auto.from({ message: 'hello' });
newDoc = Auto.change(doc, d => d.message = 'hey there');
changes = Auto.getChanges(doc, newDoc);
```

#### changes = Auto.getHistory(doc)

Get all of the changes to recreate the document from scratch.

#### newDoc = Auto.load(str)

Load the document from its serialized form.

#### str = Auto.save(doc)

Serialize the document to be loaded later.


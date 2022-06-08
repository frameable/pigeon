# Pigeon

Diff, patch, merge, and synchronize JSON documents with an [Automerge](https://github.com/automerge/automerge)-compatible interface

```javascript
const Pigeon = require('pigeon')

// initialize our document from an object literal
let doc1 = Pigeon.from({
  cards: [
    { id: 1, title: 'Rewrite everything in Clojure', done: false },
    { id: 2, title: 'Rewrite everything in Haskell', done: false },
  ]
})

// make a clone of our document
let doc2 = Pigeon.from(doc1);

// one user deletes the clojure card
doc1 = Pigeon.change(doc1, doc => doc.cards.splice(0, 1));

// meanwhile another user sets the haskell card to done
doc2 = Pigeon.change(doc1, doc => doc.cards[1].done = true);

// we merge the documents together in any order
const merged = Pigeon.merge(doc1, doc2);

// all is well with updates merged together
assert.deepEqual(merged, {
  cards: [
    { id: 2, title: 'Rewrite everything in Haskell', done: true },
  ]
});
```

### Differences from Automerge

Pigeon keeps a near fully-compatible interface to Automerge, but the underlying implementation is optimized for a different use case, and makes different tradeoffs:

- By default, history will grow only to 1000 items in length, after which oldest entries will be jettisoned
- Because of the above, performance is much improved for larger docs with more changes
- Documents need not have a direct common ancestor for patches from one to apply to another
- Changes are computed across entire data structures, rather than tracing via proxies
- Unix timestamps and client ids are used instead of vector clocks to ensure order and determinism
- Since changesets use JSON-Patch paths, they are more easily introspectable using existing tools
- Objects should have unique identifiers in order to preserve semantic integrity
- Changes may be made in-place for situations where performance is critical

#### newDoc = Pigeon.from(data, cid=_cid)

Create a document from an array or object.

#### newDoc = Pigeon.clone(doc)

Clone a document.

#### aliasDoc = Pigeon.alias(doc)

Make an alias to an existing doc; analogous to a hardlink.

#### changes = Pigeon.getChanges(left, right)

Get the set of changes that would transform `left` into `right`.

#### newDoc = Pigeon.rewindChanges(doc, ts, cid)

Roll back the document state back to the given timestamp.

#### newDoc = Pigeon.fastForwardChanges(doc)

Roll forward the document state up to the head.

#### newDoc = Pigeon.applyChanges(doc, changes)

Clone the given document to a new document and apply changes to the new document.

#### Pigeon.applyChangesInPlace(doc, changes)

Apply given changes to the document in-place.

#### newDoc = Pigeon.change(doc, fn)

Change the document according to the given function, which receivs the document as a parameter.

```javascript
doc = auto.from({ message: 'hello' });
newDoc = auto.change(doc, d => d.message = 'hey there');
changes = auto.getChanges(doc, newDoc);
```

#### changes = Pigeon.getHistory(doc)

Get all of the changes to recreate the document from scratch.

#### newDoc = Pigeon.load(str)

Load the document from its serialized form.

#### str = Pigeon.save(doc)

Serialize the document to be loaded later.

#### Pigeon.configuire(options)

Set configuration options.  Defaults are as follows...

```javascript
auto.configure({
  strict: true,
  getObjectId: x => x.id || x._id || x.uuid || x.slug,
});
```

##### `strict`

In order to preserve semantic integrity, any objects which are items in arrays should contain identifier properties named `id`, `_id`, `uuid`, or `slug`, as in the example above.  When objects have identifier properties, change sets will be keyed by those identifiers, and all will be well.  When `strict` is truthy (which is the default), an error will be thrown if we try to compare objects with no identifier properties.  When `strict` is falsy however, changes will be keyed by array indexes as a best effort only, and so property changes may or may not be robust to changes in array item order.

##### `getObjectId`

Callback to return an identifier value, given an object.  By default object identifiers will be sought as shown above, but if your data uses different properties for unique identifiers, you may supply an alternate function for retrieving them.


## Operating directly on JSON objects

Pigeon also exposes methods to diff and patch JSON objects:

```javascript
const { diff, patch } = require('pigeon');

const a1 = [
  { id: 3920, name: 'Chicago', population: 5239412 },
  { id: 3977, name: 'Boston', population: 1032943 },
]

const a2 = [
  { id: 3920, name: 'Chicago', population: 5239412 },
  { id: 3977, name: 'Boston', population: 1032997 },
]

const [ changes ] = diff(a1, a2);

assert.deepEqual(
  changes,
  { op: 'replace', path: '/[3977]/population', value: 1032997, _prev: 1032943 },
);

patch(a1, changes)
assert.deepEqual(a1, a2);

```

### changes = Pigeon.diff(left, right)

Compares data structures and returns changes required to make d1's content equal to d2's.  The format of the returned changes is based on [RFC 6902](https://tools.ietf.org/html/rfc6902), with the modification that path components which are array indexes, if they refer to an object, may take the form `[<id>]` where `<id>` is the value of a property meant to uniquely identify that object, with a property named `id`, `_id`, `uuid`, or `slug`.

### left = Pigeon.patch(left, changes)

Applies changes to the given data structure, making modifications in-place.



const assert = require('assert');
const suite = require("./index");

const AutoPigeon = require('../auto');

const sleep = ms => new Promise(done => setTimeout(done, ms));

suite('auto', test => {

  test('from', async () => {
    let doc = AutoPigeon.from({ cards: [] });
    const history = AutoPigeon.getHistory(doc);
    assert.equal(history.length, 1);
    assert.deepEqual(history[0].diff, [{"op":"add","path":"/cards","value":[]}]);
    assert.deepEqual(doc, { cards: [] });
  });

  test('in order', async () => {

    let doc1 = AutoPigeon.from({ count: 100 });

    let doc2 = AutoPigeon.clone(doc1);
    let doc3 = AutoPigeon.clone(doc1);

    doc2 = AutoPigeon.change(doc2, doc => doc.count = 1000);
    let c1 = AutoPigeon.getChanges(doc1, doc2);

    await sleep(100);

    doc3 = AutoPigeon.change(doc1, doc => doc.count += 1);
    let c2 = AutoPigeon.getChanges(doc1, doc3);

    doc1 = AutoPigeon.applyChanges(doc1, c1);
    doc1 = AutoPigeon.applyChanges(doc1, c2);

    assert(doc1.count == 101);

  });

  test('out of order', async () => {

    let doc1 = AutoPigeon.from({ count: 100 });

    let doc2 = AutoPigeon.clone(doc1);
    let doc3 = AutoPigeon.clone(doc1);

    doc2 = AutoPigeon.change(doc2, doc => doc.count = 1000);
    let c1 = AutoPigeon.getChanges(doc1, doc2);

    await sleep(100);

    doc3 = AutoPigeon.change(doc1, doc => doc.count += 1);
    let c2 = AutoPigeon.getChanges(doc1, doc3);

    doc1 = AutoPigeon.applyChanges(doc1, c2);
    doc1 = AutoPigeon.applyChanges(doc1, c1);

    assert(doc1.count == 101);

  });

  test('antediluvian update', async () => {

    let doc1 = AutoPigeon.from({ count: 100, prop: 'initial' });

    let doc2 = AutoPigeon.clone(doc1);

    doc2 = AutoPigeon.change(doc2, doc => {
      doc.prop = 'subsequent';
    })

    // generate a change whose timestamp is older than creation
    let c1 = AutoPigeon.getChanges(doc1, doc2);
    c1.ts = new Date() - 1000000;

    // and another one too
    let c2 = AutoPigeon.getChanges(doc1, doc2);
    c2.ts = new Date() - 1000000;

    doc1 = AutoPigeon.applyChanges(doc1, c1);
    doc1 = AutoPigeon.applyChanges(doc1, c2);

    assert(doc1.prop == 'subsequent');

  });

  test('separate lineage', async () => {
    let doc1 = AutoPigeon.from({ count: 100 });
    let doc2 = AutoPigeon.from({ count: 100 });
    let doc3 = AutoPigeon.change(doc2, doc => doc.count = 1000);
    let c1 = AutoPigeon.getChanges(doc2, doc3);
    let doc4 = AutoPigeon.applyChanges(doc1, c1);
    assert(doc4.count == 1000);
  });

  test('update after remove', async () => {
    const docA0 = AutoPigeon.from({ user: { name: 'Joe' } });
    const docB0 = AutoPigeon.clone(docA0);

    const docA1 = AutoPigeon.change(docA0, doc => delete doc.user);
    const docB1 = AutoPigeon.change(docB0, doc => doc.user.name = 'Moe');

    const changeA = AutoPigeon.getChanges(docA0, docA1);
    const changeB = AutoPigeon.getChanges(docB0, docB1);

    const docA2 = AutoPigeon.applyChanges(docA1, changeB);
    const docB2 = AutoPigeon.applyChanges(docB1, changeA);

    assert.deepEqual(docA2, {});
    assert.deepEqual(docB2, {});

    assert(AutoPigeon.getWarning(docA2).match(/patch failed/));
    assert(AutoPigeon.getWarning(docB2) == null);

  });

  test('save', async () => {
    const doc = AutoPigeon.from({ message: 'salut!' });
    const saved = JSON.parse(AutoPigeon.save(doc));
    assert(saved.meta.history.length == 1);
    assert.deepEqual(saved.data, { message: "salut!" });
  });

  test('load', async () => {
    const doc = AutoPigeon.load('{"meta": {"history": []}, "data": {"message": "salut!"}}');
    assert.equal(doc.message, 'salut!');
    assert.ok(AutoPigeon.clone(doc))
  });

  test('roundtrip', async () => {
    const doc = AutoPigeon.from({ message: 'salut!' });
    const saved = AutoPigeon.save(doc);
    const loaded = AutoPigeon.load(saved);
    assert.ok(AutoPigeon.clone(loaded));
  });

  test('load truncated history', async () => {

    let doc = _counter();
    doc = AutoPigeon.clone(doc, 10);

    const [ { diff } ] = AutoPigeon.getHistory(doc).slice(-1);
    assert.deepEqual(diff, [{"op":"replace","path":"/count","value":100,"_prev":99}]);

    assert.equal(doc.count, 100);
    assert.equal(AutoPigeon.getHistory(doc).length, 10);
  });

  test('clone', async () => {

    let doc = _counter();
    doc = AutoPigeon.clone(doc);

    assert.equal(doc.count, 100);
    assert.equal(AutoPigeon.getHistory(doc).length, 101);
  });

  test('clone truncated history', async () => {

    let doc = _counter();
    doc = AutoPigeon.clone(doc, 10);

    const [ { diff } ] = AutoPigeon.getHistory(doc).slice(-1);
    assert.deepEqual(diff, [{"op":"replace","path":"/count","value":100,"_prev":99}]);

    assert.equal(doc.count, 100);
    assert.equal(AutoPigeon.getHistory(doc).length, 10);

  });

  test('merge', async () => {

    let doc1 = AutoPigeon.from({ cards: [] });
    doc1 = AutoPigeon.change(doc1, d => d.cards.push({ title: 'do refactoring', id: 1 }));

    let doc2 = AutoPigeon.clone(doc1);
    doc2 = AutoPigeon.change(doc2, d => d.cards.push({ title: 'do quality assurance', id: 2 }));

    let doc3 = AutoPigeon.merge(doc1, doc2);

    assert.deepEqual(doc3, {
      cards: [
        { id: 1, title: 'do refactoring' },
        { id: 2, title: 'do quality assurance' },
      ]
    });

  });

  test('automerge merge example', async () => {

    let doc1 = AutoPigeon.from({ cards: [] });

    doc1 = AutoPigeon.change(doc1, doc => doc.cards.push({ title: 'Rewrite everything in Clojure', done: false, id: _id() }));
    doc1 = AutoPigeon.change(doc1, doc => doc.cards.push({ title: 'Rewrite everything in Haskell', done: false, id: _id() }));

    let doc2 = AutoPigeon.from(doc1);

    doc1 = AutoPigeon.change(doc1, doc => doc.cards[0].done = true);
    doc2 = AutoPigeon.change(doc2, doc => doc.cards.splice(1, 1));

    const doc = AutoPigeon.merge(doc1, doc2);

    assert.equal(AutoPigeon.getHistory(doc).length, 7);
    assert.equal(doc.cards.length, 1);
    assert.equal(doc.cards[0].title, 'Rewrite everything in Clojure');
    assert.equal(doc.cards[0].done, true);

  });

  test('automerge objects with slashes in the key', async() => {
    let doc1 = AutoPigeon.from({ cards: {} });

    doc1 = AutoPigeon.change(doc1, doc => {
      if(!doc.foo) doc.foo = {};
      doc.foo['http://bar'] = { 'baz': 'jaz'}
    });

    assert.equal(doc1.foo['http://bar'].baz, 'jaz');

    doc1 = AutoPigeon.change(doc1, doc => {
      doc.foo['http://bar'].baz = 'foo';
    });
    assert.equal(doc1.foo['http://bar'].baz, 'foo');

  });

  test('idempotent changes', async() => {
    let doc1 = AutoPigeon.from({ cards: [] });

    let doc2 = AutoPigeon.change(doc1, doc => {
      doc.cards.push('A♤')
    });

    const changes = AutoPigeon.getChanges(doc1, doc2);

    let doc3 = AutoPigeon.clone(doc1);

    doc3 = AutoPigeon.applyChanges(doc3, changes);
    assert.deepEqual(doc3, { cards: ['A♤'] });

    doc3 = AutoPigeon.applyChanges(doc3, changes);
    assert.deepEqual(doc3, { cards: ['A♤'] });
  });

  test('apply in place', async() => {
    let doc1 = AutoPigeon.from({ cards: [] });

    let doc2 = AutoPigeon.change(doc1, doc => {
      doc.cards.push('A♤')
    });

    const changes = AutoPigeon.getChanges(doc1, doc2);

    let doc3 = AutoPigeon.applyChanges(doc1, changes);
    assert.deepEqual(doc3, { cards: ['A♤'] });
    assert.deepEqual(doc1, { cards: [] });

    AutoPigeon.applyChangesInPlace(doc1, changes);
    assert.deepEqual(doc1, { cards: ['A♤'] });
  });

});

function _id() {
  return Math.random().toString(36).substring(2);
}

function _counter() {

  let doc = AutoPigeon.from({ count: 0 });

  for (let i = 0; i < 100; i++) {
    const tmp = AutoPigeon.change(doc, d => d.count++);
    const changes = AutoPigeon.getChanges(doc, tmp);
    doc = AutoPigeon.applyChanges(doc, changes);
  }

  return doc;
}

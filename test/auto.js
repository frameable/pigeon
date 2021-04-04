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

  test('save', async () => {
    const doc = AutoPigeon.from({ message: 'salut!' });
    const saved = JSON.parse(AutoPigeon.save(doc));
    assert(saved.meta.history.length == 1);
    assert.deepEqual(saved.data, { message: "salut!" });
  });

  test('load', async () => {
    const doc = AutoPigeon.load('{"meta": {"history": []}, "data": {"message": "salut!"}}');
    assert.equal(doc.message, 'salut!');
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

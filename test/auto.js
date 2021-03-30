const assert = require('assert');
const suite = require("./index");

const AutoPigeon = require('../auto');

const sleep = ms => new Promise(done => setTimeout(done, ms));

suite('auto', test => {

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
    assert.equal(AutoPigeon.save(doc), '{"meta":{"history":[],"stash":[]},"data":{"message":"salut!"}}');
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
    assert.equal(AutoPigeon.getHistory(doc).length, 100);
  });

  test('clone truncated history', async () => {

    let doc = _counter();
    doc = AutoPigeon.clone(doc, 10);

    const [ { diff } ] = AutoPigeon.getHistory(doc).slice(-1);
    assert.deepEqual(diff, [{"op":"replace","path":"/count","value":100,"_prev":99}]);

    assert.equal(doc.count, 100);
    assert.equal(AutoPigeon.getHistory(doc).length, 10);

  });

});


function _counter() {

  let doc = AutoPigeon.from({ count: 0 });

  for (let i = 0; i < 100; i++) {
    const tmp = AutoPigeon.change(doc, d => d.count++);
    const changes = AutoPigeon.getChanges(doc, tmp);
    doc = AutoPigeon.applyChanges(doc, changes);
  }

  return doc;
}

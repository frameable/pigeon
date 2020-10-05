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

});




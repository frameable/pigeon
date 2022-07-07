const assert = require('assert');
const suite = require("./index");

const AutoPigeon = require('../auto');
const { _configure } = require('../helpers');

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
    const beforeDoc = JSON.parse(AutoPigeon.save(doc));

    assert.equal(beforeDoc.meta.history.length,101,'history length is 101');
    assert.equal(Object.keys(beforeDoc.meta.gids).length, 101,'gids length is 101')

    doc = AutoPigeon.clone(doc, 10);

    const afterDoc = JSON.parse(AutoPigeon.save(doc));
    assert.equal(afterDoc.meta.history.length, 10,'history length was truncated')
    assert.equal(Object.keys(afterDoc.meta.gids).length, 10,'gids length was truncated')

    const [ { diff } ] = AutoPigeon.getHistory(doc).slice(-1);

    // verify that all items in history have a gid in the gids obj
    let hasMissingGid = false;
    for (const item of afterDoc.meta.history) {
      if (!afterDoc.meta.gids[item.gid]) {
        hasMissingGid = true;
      }
    }
    assert.equal(hasMissingGid,false,'all items in history have a gid in the gids object');

    // verify that all gids have an associated history item
    let hasMissingHistoryItem = false;
    for (const gid of Object.keys(afterDoc.meta.gids)) {
      const historyItem = afterDoc.meta.history.find(h => h.gid == gid);
      if (!historyItem) {
        hasMissingHistoryItem = true;
      }
    }

    assert.equal(hasMissingHistoryItem,false,'all gids have an associated history item');


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

  test('order changes with ids', async() => {
    let doc1 = AutoPigeon.from({
      cities: [
        { id: 'bos', name: "Boston", population: '452329', transport: 'T' },
        { id: 'chi', name: "Chicago", population: '3023429', transport: 'K' },
      ]
    });

    let doc2 = AutoPigeon.change(doc1, doc => {
      doc.cities[1].transport = 'L';
    });

    const c2 = AutoPigeon.getChanges(doc1, doc2);
    assert(c2.diff.length, 1);

    let doc3 = AutoPigeon.change(doc1, doc => {
      doc.cities = [
        doc.cities[1],
        doc.cities[0],
      ]
    });

    const c3 = AutoPigeon.getChanges(doc1, doc3);
    assert(c3.diff.every(o => o.op == 'move'));
    assert(c3.diff.length == 2);

  });

  test('preserve changes array moves', async() => {
    let doc1 = AutoPigeon.from({
      cities: [
        { id: 'bos', name: "Boston", population: '452329', transport: 'T' },
        { id: 'chi', name: "Chicago", population: '3023429', transport: 'K' },
        { id: 'dal', name: "Dallas", population: '1393029', transport: '_' },
      ]
    });

    let doc2 = AutoPigeon.clone(doc1);

    let doc3 = AutoPigeon.change(doc1, doc => {
      doc.cities = [
        doc.cities[0],
        doc.cities[2],
        doc.cities[1],
      ]
    });

    const c3 = AutoPigeon.getChanges(doc1, doc3);
    assert.equal(c3.diff.length, 2);
    doc2 = AutoPigeon.applyChanges(doc2, c3);
    assert.deepEqual(doc2, doc3, 'changes applied');
    assert.equal(c3.diff.length, 2);
  });

  test('order changes without ids is messy', async() => {

    AutoPigeon.configure({ strict: false });

    let doc1 = AutoPigeon.from({
      cities: [
        { name: "Boston", population: '452329', transport: 'T' },
        { name: "Chicago", population: '3023429', transport: 'K' },
      ]
    });

    let doc2 = AutoPigeon.change(doc1, doc => {
      doc.cities[1].transport = 'L';
    });

    const c2 = AutoPigeon.getChanges(doc1, doc2);
    assert(c2.diff.length, 1);

    let doc3 = AutoPigeon.change(doc1, doc => {
      doc.cities = [
        doc.cities[1],
        doc.cities[0],
      ]
    });

    const c3 = AutoPigeon.getChanges(doc1, doc3);
    assert(c3.diff.length, 6);

    AutoPigeon.configure({ strict: true });

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

  test('alias', async() => {
    let doc1 = AutoPigeon.from({ cards: [] });
    let doc2 = AutoPigeon.alias(doc1);

    assert(doc1 !== doc2);

    let tmp = AutoPigeon.change(doc1, doc => {
      doc.cards.push('A♤')
    });

    const changes = AutoPigeon.getChanges(doc1, tmp);
    AutoPigeon.applyChangesInPlace(doc1, changes);

    assert.deepEqual(doc1, { cards: ['A♤'] });
    assert.deepEqual(doc2, { cards: ['A♤'] });
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

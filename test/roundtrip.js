const suite = require('./index');
const assert = require('assert');
const patch = require('../patch');
const diff = require('../diff');
const helpers = require('../helpers');

function random() {
  random._s = random._s || 11224; // seed
  return (random._s = random._s * 16807 % 2147483647) / 2147483646;
}

suite('roundtrip', async test => {


  test('array truncate', async () => {
    helpers._configure({ strict: false });
    const initial = [ { email: 'doug@example.com' }, { email: 'jen@example.com' }, { email: 'abhi@example.com' }, { email: 'amber@example.com' } ];
    const target = [ { email: 'doug@example.com' }, { email: 'jen@example.com' } ];
    const changes = diff(initial, target);
    const adjusted = patch(initial, changes);
    assert.deepEqual(adjusted, target);
    helpers._configure({ strict: true });
  });

  test('back populating object ids', async () => {
    helpers._configure({ strict: false });
    const initial = [{ email: 'doug@example.com' }, { email: 'jen@example.com' }];
    const target = [{ email: 'doug@example.com', id: 1 }, { email: 'jen@example.com', id: 2 }];
    const changes = diff(initial, target);
    const adjusted = patch(initial, changes);
    assert.deepEqual(adjusted, target);
    helpers._configure({ strict: true });
  })

  test('array of objects insert', async () => {
    const initial = [ { id: 1 }, { id: 2 } ];
    const target = [ { id: 1 }, { id: 3 }, { id: 2 } ];

    const changes = diff(initial, target);
    const adjusted = patch(initial, changes);

    assert.deepEqual(adjusted, target);
  })

  test('array remove and reorder', async () => {
    const initial = [{ id: 1, name: 'one' }, { id: 2, name: 'two' }, { id: 3, name: 'three' }];
    const target = [{ id: 3, name: 'three' }, { id: 2, name: 'two' }];
    const changes = diff(initial, target);
    const adjusted = patch(initial, changes);
    assert.deepEqual(adjusted, target);
  })

  test('array remove and reorder no ids', async () => {
    helpers._configure({ strict: false });
    const initial = [{ name: 'one' }, { name: 'two' }, { name: 'three' }];
    const target = [{ name: 'three' }, { name: 'two' }];
    const changes = diff(initial, target);
    const adjusted = patch(initial, changes);
    assert.deepEqual(adjusted, target);
    helpers._configure({ strict: true });
  })

  test('array fuzz', async () => {

    const a = [...Array(10).keys()].map(n => ({ id: n + 1 }));


    for (const i of Array(40).keys()) {
      const a1 = JSON.parse(JSON.stringify(a));
      const a2 = JSON.parse(JSON.stringify(a));
      function ri() {
        return random() * a2.length | 0;
      }
      for (const n of Array(5).keys()) {
        if (random() < 0.3) {
          // randomly delete
          a2.splice(a2[ri()], 1);
        }
        if (random() < 0.1) {
          // randomly swap
          const [x, y] = [ri(), ri()];
          const tmp = a2[x];
          a2[x] = a2[y];
          a2[y] = tmp;
        }
        if (random() < 0.1) {
          // randomly add
          a2.splice(ri(), 0, { id: random() })
        }
      }

      const a3 = patch(a1, diff(a1, a2));
      assert.deepEqual(a3, a2);
    }

  });

});



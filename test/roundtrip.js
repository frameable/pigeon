const suite = require('./index');
const assert = require('assert');
const patch = require('../patch');
const diff = require('../diff');
const helpers  = require('../helpers');

suite('roundtrip', async test => {

  helpers._configure({ strict: false });

  test('array truncate', async () => {
    const initial = [ { email: 'doug@example.com' }, { email: 'jen@example.com' }, { email: 'abhi@example.com' }, { email: 'amber@example.com' } ];
    const target = [ { email: 'doug@example.com' }, { email: 'jen@example.com' } ];
    const changes = diff(initial, target);
    const adjusted = patch(initial, changes);
    assert.deepEqual(adjusted, target);
  });

  test('back populating object ids', async () => {
    const initial = [{ email: 'doug@example.com' }, { email: 'jen@example.com' }];
    const target = [{ email: 'doug@example.com', id: 1 }, { email: 'jen@example.com', id: 2 }];
    const changes = diff(initial, target);
    const adjusted = patch(initial, changes);
    assert.deepEqual(adjusted, target);
  })

  helpers._configure({ strict: true });

});



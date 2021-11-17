const assert = require('assert');
const suite = require("./index");

const diff = require('../diff');


suite('diff', test => {

  test('primitive identity', async () => {
    assert.deepEqual(diff(1, 1), []);
  })

  test('primitive numeric', async () => {
    assert.deepEqual(
      diff(1, 2),
      [ { op: 'replace', path: '/', value: 2, _prev: 1 } ]
    );
  });

  test('primitive character', async () => {
    assert.deepEqual(
      diff('a', 'b'),
      [ { op: 'replace', path: '/', value: 'b', _prev: 'a' } ]
    );
  });

  test('object property primitive', async () => {
    assert.deepEqual(
      diff({ id: 1, title: 'hello' }, { id: 1 }),
      [ { op: 'remove', path: '/title', _prev: 'hello' } ]
    );
  });

  test('object property replace', async () => {
    assert.deepEqual(
      diff({ id: 1, title: 'hello' }, { id: 1, title: 'salut' }),
      [ { op: 'replace', path: '/title', value: 'salut', _prev: 'hello' } ]
    );
  });

  test('nested object property primitive', async () => {
    assert.deepEqual(
      diff(
        { id: 1, title: { text: 'hello', size: 24 } },
        { id: 1, title: { text: 'salut', size: 24 } }),
      [ { op: 'replace', path: '/title/text', value: 'salut', _prev: 'hello' } ]
    );
  });

  test('primitive arrays', async () => {
    assert.deepEqual(
      diff(['a', 'b', 'c'], ['a', 'b', 'c']),
      []
    );
  });

  test('primitive array append', async () => {
    assert.deepEqual(
      diff(['a', 'b'], ['a', 'b', 'c']),
      [ { op: 'add', path: '/2', value: 'c' } ]
    );
  });

  test('primitive array prepend', async () => {
    assert.deepEqual(
      diff(['a', 'b'], ['z', 'a', 'b']),
      [ { op: 'add', path: '/0', value: 'z' } ]
    );
  });

  test('primitive array remove', async () => {
    assert.deepEqual(
      diff(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'd', 'e']),
      [ { op: 'remove', path: '/2', _prev: 'c' } ]
    );
  });

  test('primitive array "replace"', async () => {
    assert.deepEqual(
      diff(['a', 'b', 'c'], ['a', 'b', 'x']),
      [ { op: 'remove', path: '/2', _prev: 'c' },
        { op: 'add', path: '/2', value: 'x' } ]
    );
  });

  test('object sub id property change', async () => {
    assert.deepEqual(
      diff(
        [
          { id: 23, name: 'tulsa', value: 920 },
          { id: 24, name: 'boise', value: 239 }
        ], [
          { id: 23, name: 'tulsa', value: 920 },
          { id: 24, name: 'boise!', value: 239 }
        ],
      ),
      [ { op: 'replace', path: '/[24]/name', value: 'boise!', _prev: 'boise' } ]
    );
  });

  test('object sub id remove', async () => {
    assert.deepEqual(
      diff(
        [
          { id: 23, name: 'tulsa', value: 920 },
          { id: 24, name: 'boise', value: 239 }
        ], [
          { id: 23, name: 'tulsa', value: 920 },
        ],
      ),
      [ { op: 'remove', path: '/[24]', _prev: { id: 24, name: 'boise', value: 239 } } ]
    );
  });

  test('object add nested property', async () => {
    assert.deepEqual(
      diff(
        { name: 'tulsa' },
        { name: 'tulsa', districts: ['downtown', 'uptown'] }
      ),
      [ { op: 'add', path: '/districts', value: ['downtown', 'uptown'] } ]
    );
  })

  test('object add and remove properties', async () => {
    assert.deepEqual(
      diff(
        { name: 'tulsa', value: 920 },
        { name: 'tulsa', population: 24012 }
      ),
      [
        { op: 'remove', path: '/value', _prev: 920 },
        { op: 'add', path: '/population', value: 24012 },
      ]
    );
  })

  test('null to obj', async () => {
    assert.deepEqual(
      diff(
        { name: null },
        { name: { first: 'Joseph', last: 'Biden' } }
      ),
      [ { op: 'replace', path: '/name', value: { first: 'Joseph', last: 'Biden' }, _prev: null } ]
    );
  })

  test('obj to null', async () => {
    assert.deepEqual(
      diff(
        { name: { first: 'Joseph', last: 'Biden' } },
        { name: null }
      ),
      [ { op: 'replace', path: '/name', value: null, _prev: { first: 'Joseph', last: 'Biden' } } ]
    );
  })

  test('nested array diff returns', async () => {
    assert.doesNotThrow(
      diff(
        {
          "roomId": "6694036202578270",
          "tables": [
            {
              "id": "5685966535045196",
              "participantIds": {
                "4818723833731450": true,
                "8482600846703780": true
              },
              "evictionTime": {
                "4528704448296070": 1637099055996.7285,
                "4818723833731450": 1637124962152.836,
                "8482600846703780": 1637125281084.5051
              },
              "topic": "Where would you most like to travel?",
              "details": {},
              "topicBy": null,
              "promptBy": null,
              "currentTopic": "",
              "currentPrompt": "",
              "showGame": "anagrams",
              "unplayedCustomWords": [
                "nasty",
                "plod",
                "trod"
              ],
              "customWordsInitialized": false,
              "customWordsLeft": [
                "trod",
                "nasty",
                "plod"
              ],
              "customWordPlayOver": false
            }
          ],
        },

        {
          "roomId": "6694036202578270",
          "tables": [
            {
              "id": "5685966535045196",
              "participantIds": {
                "4818723833731450": true,
                "8482600846703780": true
              },
              "evictionTime": {
                "4528704448296070": 1637099055996.7285,
                "4818723833731450": 1637124962152.836,
                "8482600846703780": 1637125281084.5051
              },
              "topic": "Where would you most like to travel?",
              "details": {},
              "topicBy": null,
              "promptBy": null,
              "currentTopic": "",
              "currentPrompt": "",
              "showGame": "anagrams",
              "unplayedCustomWords": [
                "plod",
                "trod",
                "nasty"
              ],
              "customWordsInitialized": true,
              "customWordsLeft": [
                "trod",
                "nasty",
                "plod"
              ],
              "customWordPlayOver": false
            }
          ],
        }
      ),
    );
  })
});


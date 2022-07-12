const { _typeof, _clone, _objId, _decodePath } = require('./helpers');


function patch(data, changes) {

  changes = _clone(changes);
  const conflicts = [];
  let stash = null;

  CHANGE:
  for (const [ci, change] of changes.entries()) {

    const components = _decodePath(change.path);
    const root = components.shift();
    let tip = components.pop();

    let head = data;

    for (const c of components) {
      if (!head) {
        conflicts.push(change);
        continue CHANGE;
      }
      const key = _key(c);
      if (key) {
        head = head.find(i => _objId(i) == key);
      } else {
        head = head[c];
      }
    }

    const key = _key(tip);
    if (key) {
      const idx = head.findIndex(i => _objId(i) == key);
      if (~idx) {
        tip = idx;
      } else {
        conflicts.push(change);
      }
    }

    const type = _typeof(head);

    if (change.op == 'replace') {
      head[tip] = _clone(change.value);
    } else if (change.op == 'move') {
      stash = {};
      const ops = [
        { op: 'remove', path: change.from },
        { op: 'add', path: change.path, value: stash }
      ];
      changes.splice(ci + 1, 0, ...ops);
    } else if (change.op == 'remove') {
      if (type == 'object') {
        stash && (stash.value = _clone(head[tip]));
        delete head[tip];
      } else if (type == 'array') {
        const value = head.splice(tip, 1);
        stash && ([ stash.value ] = value);
      }
    } else if (change.op == 'add') {
      if (type == 'object') {
        head[tip] = _clone(change.value);
      } else if (type == 'array') {
        if (stash && change.value === stash) {
          head.splice(tip, 0, stash.value);
          stash = null;
        } else {
          head.splice(tip, 0, _clone(change.value));
        }
      }
    }
  }
  return data;
}


function _key(c) {
  if (c === undefined) return;
  const m = c.match(/^\[(.+)\]$/);
  if (m) return m[1];
}

module.exports = patch;

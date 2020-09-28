const { _typeof, _clone, _objId } = require('./helpers');

function patch(data, changes) {

  const conflicts = [];

  CHANGE:
  for (const change of changes) {

    const components = change.path.split('/');
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
    } else if (change.op == 'remove') {
      if (type == 'object') {
        delete head[tip];
      } else if (type == 'array') {
        head.splice(tip, 1)
      }
    } else if (change.op == 'add') {
      if (type == 'object') {
        head[tip] = _clone(change.value);
      } else if (type == 'array') {
        head.splice(tip, 0, _clone(change.value));
      }
    }
  }
  return data;
}


function _key(c) {
  const m = c.match(/^\[(.+)\]$/);
  if (m) return m[1];
}

module.exports = patch;

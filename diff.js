const { _path, _typeof, _isPrimitive, _clone, _entangled, _objId, _op, _config } = require('./helpers');


function diff(left, right) {

  const type = _typeof(left);

  if (type !== _typeof(right)) {
    throw new Error("can't diff different types");
  }

  if (type == 'array') {
    return diffArray(left, right);
  } else if (type == 'object') {
    return diffObject(left, right);
  } else if (_isPrimitive(left)) {
    return diffPrimitive(left, right);
  } else {
    throw new Error("unsupported type");
  }

}

function diffPrimitive(l, r, path='/') {
  if (l !== r) {
    return [_op('replace', _path(path), { value: r,  _prev: l, })];
  } else {
    return [];
  }
}

function diffArray(l, r, path='/') {

  const lris = {};
  const rlis = {};

  const adds = [];

  for (let i = 0; i < l.length; i++) {
    for (let j = 0; j < r.length; j++) {
      if (j in rlis) continue;
      if (i in lris) continue;
      if (
        (!_config.strict && _typeof(l[i]) == 'array' && _typeof(r[j]) == 'array' && i == j) ||
        _entangled(l[i], r[j])
      ) {
        lris[i] = j;
        rlis[j] = i;
      }
    }
  }

  const ops = [];

  for (let i = 0, j = 0; j < r.length || i < l.length;) {

    if (j in r && i in l && rlis[j] == i) {

      if (_typeof(r[j]) === 'object') {
        ops.push(...diffObject(l[i], r[j], _path(path, i, r[j])));
      }
      j++;
      i++;
      continue;
    }

    if (i < l.length && !(i in lris)) {
      ops.push(_op('remove', _path(path, i, l[i]), { _prev: l[i] }));
      i++;
      continue;
    }

    if (j < r.length && !(j in rlis)) {
      adds.unshift(_op('add', _path(path, j, r[j + 1]), { value: r[j] }));
      j++;
      continue;
    }

    if (j < r.length && j in rlis) {
      const from = _path(path, rlis[j], l[rlis[j]]);
      const to = _path(path, j);
      if (to != from) {
        ops.push({ op: 'move', from, path: to });
        if (_typeof(rlis[j]) == 'object') {
          ops.push(...diffObject(l[rlis[j]], r[j], path));
        }
      }
      i++;
      j++;
      continue;
    }

    throw new Error(`couldn't create diff`);
  }

  return ops.concat(adds);
}


function diffObject(l, r, path='/', ref) {

  const ops = [];

  const lkeys = Object.keys(l);
  const llen = lkeys.length;
  let removals = 0;

  for (let i = 0; i < llen; i++){

    const k = lkeys[i];
    if (!(r.hasOwnProperty(k))) {
      removals++;
      ops.push({ op: 'remove', path: _path(path, k), _prev: _clone(l[k]) });
      continue;
    }

    if (l[k] === r[k]) continue;

    const type = _typeof(l[k]);

    if (_isPrimitive(l[k])) {
      ops.push(...diffPrimitive(l[k], r[k], _path(path, k), ref));
    } else if (type !== _typeof(r[k])) {
      ops.push({ op: 'replace', path: _path(path, k), value: _clone(r[k]), _prev: _clone(l[k]) });
    } else if (type === 'array') {
      ops.push(...diffArray(l[k], r[k], _path(path, k)));
    } else if (type === 'object') {
      ops.push(...diffObject(l[k], r[k], _path(path, k), ref));
    }
  }

  const rkeys = Object.keys(r);
  const rlen = rkeys.length;

  if (rlen > llen - removals) {
    for (let i = 0; i < rlen; i++) {
      const k = rkeys[i];
      if (!(l.hasOwnProperty(k))) {
        ops.push({ op: 'add', path: _path(path, k), value: _clone(r[k]) });
      }
    }
  }

  return ops
}


module.exports = diff;

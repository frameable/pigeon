const { _path, _typeof, _isPrimitive, _clone, _entangled, _objId, _op } = require('./helpers');


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

  for (let i = 0; i < l.length; i++) {
    for (let j = 0; j < r.length; j++) {
      if (j in rlis) continue;
      if (i in lris) continue;
      if (_entangled(l[i], r[j])) {
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
      ops.push(_op('add', _path(path, j, l[i]), { value: r[j] }));
      j++;
      continue;
    }

    if (j < r.length && j in rlis) {
      ops.push({ op: 'move', from: _path(path, rlis[j], l[rlis[j]]), path: _path(j) });
      if (_typeof(rlis[j]) == 'object') {
        ops.push(...diffObject(l[rlis[j]], r[j], path));
      }
      j++;
      continue;
    }
  }

  return ops;
}


function diffObject(l, r, path='/', ref) {

  const ops = [];

  for (k in l) {
    if (!(k in r)) {
      ops.push({ op: 'remove', path: _path(path, k), _prev: _clone(l[k]) });
      continue;
    }

    const type = _typeof(l[k]);

    if (_isPrimitive(l[k])) {
      ops.push(...diffPrimitive(l[k], r[k], _path(path, k), ref));
    } else if (type !== _typeof(r[k])) {
      throw new Error("can't change from composite type to another");
    } else if (type == 'array') {
      ops.push(...diffArray(l[k], r[k], _path(path, k)));
    } else if (type == 'object') {
      ops.push(...diffObject(l[k], r[k], _path(path, k), ref));
    }
  }

  for (k in r) {
    if (!(k in l)) {
      ops.push({ op: 'add', path: _path(path, k), value: _clone(r[k]) });
    }
  }

  return ops
}


module.exports = diff;
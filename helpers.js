function _path(path, k, o) {
  if (o) {
    const id = _objId(o);
    if (id) k = `[${id}]`;
  }
  return [path, k].filter(x => x != undefined).join('/').replace('//', '/');
}

function _typeof(x) {
  if (Array.isArray(x)) return 'array';
  if (x === null) return 'null';
  return typeof x;
}

function _isPrimitive(x) {
  const t = _typeof(x);
  return t === 'number' || t === 'null' || t === 'boolean' || t == 'string';
}

function _clone(x) {
  return JSON.parse(JSON.stringify(x));
}

function _entangled(a, b) {
  if (_isPrimitive(a)) {
    return a === b;
  } else if (_typeof(a) == 'object') {
    return _objId(a) === _objId(b);
  } else if (_typeof(a) == 'array') {
    throw new Error("can't compare arrays of arrays");
  }
}

function _objId(x) {
  if (_typeof(x) == 'object') {
    const id = x.id || x._id;
    return id;
  } else {
    return null;
  }
}

function _op(op, path, extra) {
  const operation = { op, path };
  Object.assign(operation, extra);
  return operation;
}

module.exports = {
  _path,
  _typeof,
  _isPrimitive,
  _clone,
  _entangled,
  _objId,
  _op,
}

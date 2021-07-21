function _path(path: string | number, k?: string | number, o?: unknown) {
  if (o) {
    const id = _objId(o);
    if (id) k = `[${id}]`;
  }
  return _encodePath(path, k);
}

function _encodeKey(key?: string | number) {
  return typeof(key) == 'string' && (key.indexOf('/') !== -1 || key.indexOf('~') !== -1) ?
    key.replace(/~/g, '~0').replace(/\//g, '~1') :
    key;
}

function _decodeKey(key: string) {
  return typeof(key) == 'string' && (key.indexOf('~1') !== -1 || key.indexOf('~0') !== -1) ?
    key.replace(/~1/g, '/').replace(/~0/g, '~') :
    key;
}

function _decodePath(path: string) {
  return path.split('/').map(c => _decodeKey(c))
}

function _encodePath(path: string | number, k?: string | number) {
  k = _encodeKey(k);
  return [path, k].filter(x => x != undefined).join('/').replace('//', '/');
}

function _typeof(x: unknown) {
  if (Array.isArray(x)) return 'array';
  if (x === null) return 'null';
  return typeof x;
}

function _isPrimitive(x: unknown) {
  const t = _typeof(x);
  return t === 'number' || t === 'null' || t === 'boolean' || t == 'string';
}

function _clone(x: unknown) {
  return JSON.parse(JSON.stringify(x));
}

function _entangled(a: any, b: any) {
  if (_isPrimitive(a)) {
    return a === b;
  } else if (_typeof(a) == 'object') {
    return _objId(a) === _objId(b);
  } else if (_typeof(a) == 'array') {
    throw new Error("can't compare arrays of arrays");
  }
}

function _objId(x: any) {
  if (_typeof(x) == 'object') {
    const id = x.id || x._id;
    return id;
  } else {
    return null;
  }
}

function _op(op: string, path: string, extra: unknown) {
  const operation = { op, path };
  Object.assign(operation, extra);
  return operation;
}

function _stable(x: any): string {
  if (_typeof(x) == 'array') {
    return `[${x.map(_stable).join(',')}]`;
  } else if (_typeof(x) == 'object') {
    return `{${Object.keys(x).sort().map(k =>
      `${JSON.stringify(k)}:${_stable(x[k])}`).join(',')}}`;
  } else {
    return JSON.stringify(x);
  }
}

function _hsh(str: string) {
  return Math.abs(Array.from(str).reduce((p, _c, i, a) => (p << 5) - p + a.join(',').charCodeAt(i), 0))
}

function _crc(x: unknown) {
  return _hsh(_stable(x));
}

export {
  _path,
  _typeof,
  _isPrimitive,
  _clone,
  _entangled,
  _objId,
  _op,
  _stable,
  _crc,
  _decodePath,
}

let _config = {
  strict: true,
  getObjectId: x => x.id || x._id || x.uuid || x.slug,
  getTimestamp: Date.now,
};

function _configure(options) {
  Object.assign(_config, options);
}

function _path(path, k, o) {
  if (o) {
    const id = _objId(o);
    if (id) k = `[${id}]`;
  }
  return _encodePath(path, k);
}

function _encodeKey(key) {
  return typeof(key) == 'string' && (key.indexOf('/') !== -1 || key.indexOf('~') !== -1) ?
    key.replace(/~/g, '~0').replace(/\//g, '~1') :
    key;
}

function _decodeKey(key) {
  return typeof(key) == 'string' && (key.indexOf('~1') !== -1 || key.indexOf('~0') !== -1) ?
    key.replace(/~1/g, '/').replace(/~0/g, '~') :
    key;
}

function _decodePath(path) {
  return path.split('/').map(c => _decodeKey(c))
}

function _encodePath(path, k) {
  k = _encodeKey(k);
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
  const type = _typeof(x);
  if (type == 'array') {
    const arr = Array(x.length);
    for (let i = 0; i < x.length; i++) {
      arr[i] = _clone(x[i]);
    }
    return arr;
  } else if (type == 'object') {
    if (x.toJSON) {
      return x.toJSON();
    } else {
      const obj = {};
      for (const k in x) {
        obj[k] = _clone(x[k]);
      }
      return obj;
    }
  } else if (_isPrimitive(x)) {
    const isNumber = typeof x == 'number';
    if (isNumber) {
      if (isFinite(x)) {
        return x;
      } else {
        return null;
      }
    } else {
      return x;
    }
  }
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
    const id = _config.getObjectId(x);
    if (id != undefined) return id;
    if (_config.strict) {
      throw new Error("couldn't find id for object", { cause: x });
    }
    return _hsh(_stable(x));
  } else {
    return null;
  }
}

function _op(op, path, extra) {
  const operation = { op, path };
  Object.assign(operation, extra);
  return operation;
}

function _stable(x) {
  if (_typeof(x) == 'array') {
    return `[${x.map(_stable).join(',')}]`;
  } else if (_typeof(x) == 'object') {
    return `{${Object.keys(x).sort().map(k =>
      `${JSON.stringify(k)}:${_stable(x[k])}`).join(',')}}`;
  } else {
    return JSON.stringify(x);
  }
}

function _hsh(str) {
  return Math.abs([].reduce.call(str, (p, c, i, a) => (p << 5) - p + a.charCodeAt(i), 0));
}

function _crc(x) {
  return _hsh(_stable(x));
}

module.exports = {
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
  _config,
  _configure,
}

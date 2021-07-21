"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._decodePath = exports._crc = exports._stable = exports._op = exports._objId = exports._entangled = exports._clone = exports._isPrimitive = exports._typeof = exports._path = void 0;
function _path(path, k, o) {
    if (o) {
        const id = _objId(o);
        if (id)
            k = `[${id}]`;
    }
    return _encodePath(path, k);
}
exports._path = _path;
function _encodeKey(key) {
    return typeof (key) == 'string' && (key.indexOf('/') !== -1 || key.indexOf('~') !== -1) ?
        key.replace(/~/g, '~0').replace(/\//g, '~1') :
        key;
}
function _decodeKey(key) {
    return typeof (key) == 'string' && (key.indexOf('~1') !== -1 || key.indexOf('~0') !== -1) ?
        key.replace(/~1/g, '/').replace(/~0/g, '~') :
        key;
}
function _decodePath(path) {
    return path.split('/').map(c => _decodeKey(c));
}
exports._decodePath = _decodePath;
function _encodePath(path, k) {
    k = _encodeKey(k);
    return [path, k].filter(x => x != undefined).join('/').replace('//', '/');
}
function _typeof(x) {
    if (Array.isArray(x))
        return 'array';
    if (x === null)
        return 'null';
    return typeof x;
}
exports._typeof = _typeof;
function _isPrimitive(x) {
    const t = _typeof(x);
    return t === 'number' || t === 'null' || t === 'boolean' || t == 'string';
}
exports._isPrimitive = _isPrimitive;
function _clone(x) {
    return JSON.parse(JSON.stringify(x));
}
exports._clone = _clone;
function _entangled(a, b) {
    if (_isPrimitive(a)) {
        return a === b;
    }
    else if (_typeof(a) == 'object') {
        return _objId(a) === _objId(b);
    }
    else if (_typeof(a) == 'array') {
        throw new Error("can't compare arrays of arrays");
    }
}
exports._entangled = _entangled;
function _objId(x) {
    if (_typeof(x) == 'object') {
        const id = x.id || x._id;
        return id;
    }
    else {
        return null;
    }
}
exports._objId = _objId;
function _op(op, path, extra) {
    const operation = { op, path };
    Object.assign(operation, extra);
    return operation;
}
exports._op = _op;
function _stable(x) {
    if (_typeof(x) == 'array') {
        return `[${x.map(_stable).join(',')}]`;
    }
    else if (_typeof(x) == 'object') {
        return `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${_stable(x[k])}`).join(',')}}`;
    }
    else {
        return JSON.stringify(x);
    }
}
exports._stable = _stable;
function _hsh(str) {
    return Math.abs(Array.from(str).reduce((p, _c, i, a) => (p << 5) - p + a.join(',').charCodeAt(i), 0));
}
function _crc(x) {
    return _hsh(_stable(x));
}
exports._crc = _crc;

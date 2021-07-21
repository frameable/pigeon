"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diff = void 0;
const helpers_1 = require("./helpers");
function diff(left, right) {
    const type = helpers_1._typeof(left);
    if (type !== helpers_1._typeof(right)) {
        throw new Error("can't diff different types");
    }
    if (type == 'array') {
        return diffArray(left, right);
    }
    else if (type == 'object') {
        return diffObject(left, right);
    }
    else if (helpers_1._isPrimitive(left)) {
        return diffPrimitive(left, right);
    }
    else {
        throw new Error("unsupported type");
    }
}
exports.diff = diff;
function diffPrimitive(l, r, path = '/') {
    if (l !== r) {
        return [helpers_1._op('replace', helpers_1._path(path), { value: r, _prev: l, })];
    }
    else {
        return [];
    }
}
function diffArray(l, r, path = '/') {
    const lris = {};
    const rlis = {};
    for (let i = 0; i < l.length; i++) {
        for (let j = 0; j < r.length; j++) {
            if (j in rlis)
                continue;
            if (i in lris)
                continue;
            if ((helpers_1._typeof(l[i]) == 'array' && helpers_1._typeof(r[j]) == 'array' && i == j) ||
                helpers_1._entangled(l[i], r[j])) {
                lris[i] = j;
                rlis[j] = i;
            }
        }
    }
    const ops = [];
    for (let i = 0, j = 0; j < r.length || i < l.length;) {
        if (j in r && i in l && rlis[j] == i) {
            if (helpers_1._typeof(r[j]) === 'object') {
                ops.push(...diffObject(l[i], r[j], helpers_1._path(path, i, r[j])));
            }
            j++;
            i++;
            continue;
        }
        if (i < l.length && !(i in lris)) {
            ops.push(helpers_1._op('remove', helpers_1._path(path, i, l[i]), { _prev: l[i] }));
            i++;
            continue;
        }
        if (j < r.length && !(j in rlis)) {
            ops.push(helpers_1._op('add', helpers_1._path(path, j, l[i]), { value: r[j] }));
            j++;
            continue;
        }
        if (j < r.length && j in rlis) {
            ops.push({ op: 'move', from: helpers_1._path(path, rlis[j], l[rlis[j]]), path: helpers_1._path(j) });
            if (helpers_1._typeof(rlis[j]) == 'object') {
                ops.push(...diffObject(l[rlis[j]], r[j], path));
            }
            j++;
            continue;
        }
    }
    return ops;
}
function diffObject(l, r, path = '/') {
    const ops = [];
    let keys = Object.keys(l);
    let len = keys.length;
    for (let i = 0; i < len; i++) {
        const k = keys[i];
        if (!(r.hasOwnProperty(k))) {
            ops.push({ op: 'remove', path: helpers_1._path(path, k), _prev: helpers_1._clone(l[k]) });
            continue;
        }
        const type = helpers_1._typeof(l[k]);
        if (helpers_1._isPrimitive(l[k])) {
            ops.push(...diffPrimitive(l[k], r[k], helpers_1._path(path, k)));
        }
        else if (type !== helpers_1._typeof(r[k])) {
            ops.push({ op: 'replace', path: helpers_1._path(path, k), value: helpers_1._clone(r[k]), _prev: helpers_1._clone(l[k]) });
        }
        else if (type === 'array') {
            ops.push(...diffArray(l[k], r[k], helpers_1._path(path, k)));
        }
        else if (type === 'object') {
            ops.push(...diffObject(l[k], r[k], helpers_1._path(path, k)));
        }
    }
    keys = Object.keys(r);
    len = keys.length;
    for (let i = 0; i < len; i++) {
        const k = keys[i];
        if (!(l.hasOwnProperty(k))) {
            ops.push({ op: 'add', path: helpers_1._path(path, k), value: helpers_1._clone(r[k]) });
        }
    }
    return ops;
}

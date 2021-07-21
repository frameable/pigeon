"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patch = void 0;
const helpers_1 = require("./helpers");
function patch(data, changes) {
    const conflicts = [];
    CHANGE: for (const change of changes) {
        const components = helpers_1._decodePath(change.path);
        // if (!components.length) continue CHANGE
        components.shift();
        let tip = components.pop();
        let head = data;
        for (const c of components) {
            if (!head) {
                conflicts.push(change);
                continue CHANGE;
            }
            const key = _key(c);
            if (key) {
                head = head.find((i) => helpers_1._objId(i) == key);
            }
            else {
                head = head[c];
            }
        }
        const key = _key(tip);
        if (key) {
            const idx = head.findIndex((i) => helpers_1._objId(i) == key);
            if (~idx) {
                tip = idx;
            }
            else {
                conflicts.push(change);
            }
        }
        const type = helpers_1._typeof(head);
        if (change.op == 'replace') {
            head[tip] = helpers_1._clone(change.value);
        }
        else if (change.op == 'remove') {
            if (type == 'object') {
                delete head[tip];
            }
            else if (type == 'array') {
                head.splice(tip, 1);
            }
        }
        else if (change.op == 'add') {
            if (type == 'object') {
                head[tip] = helpers_1._clone(change.value);
            }
            else if (type == 'array') {
                head.splice(tip, 0, helpers_1._clone(change.value));
            }
        }
    }
    return data;
}
exports.patch = patch;
function _key(c) {
    const m = c.match(/^\[(.+)\]$/);
    if (m)
        return m[1];
    return null;
}

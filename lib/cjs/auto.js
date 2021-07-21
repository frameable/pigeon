"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoPigeon = void 0;
const assert_1 = __importDefault(require("assert"));
const diff_1 = require("./diff");
const patch_1 = require("./patch");
const reverse_1 = require("./reverse");
const helpers_1 = require("./helpers");
let HISTORY_LENGTH = 1000;
const meta = new WeakMap();
const _cid = _id();
class AutoPigeon {
    constructor() {
        meta.set(this, {
            history: [],
            stash: [],
            warning: null,
        });
    }
    static from(data, cid = _cid) {
        let doc = new AutoPigeon();
        meta.get(doc).cid = cid;
        doc = AutoPigeon.change(doc, (doc) => Object.assign(doc, data));
        return doc;
    }
    static _forge(data, cid = _cid) {
        let doc = new AutoPigeon();
        meta.get(doc).cid = cid;
        Object.assign(doc, helpers_1._clone(data));
        // const changes = AutoPigeon.getChanges(doc, data);
        return doc;
    }
    static init() {
        return AutoPigeon.from({});
    }
    static clone(doc, historyLength = HISTORY_LENGTH) {
        const clone = AutoPigeon._forge(doc);
        meta.get(clone).history = meta.get(doc).history.slice(-historyLength);
        return clone;
    }
    static getChanges(left, right) {
        const _diff = diff_1.diff(left, right);
        const changes = {
            diff: _diff,
            cid: meta.get(left).cid,
            ts: _ts(),
            seq: _seq(),
            gid: _id(),
        };
        return changes;
    }
    static rewindChanges(doc, ts, cid) {
        const { history } = meta.get(doc);
        while (true) {
            if (!history.length)
                break;
            const change = history[history.length - 1];
            if (change.ts > ts || (change.ts == ts && change.cid > cid)) {
                const c = meta.get(doc).history.pop();
                patch_1.patch(doc, reverse_1.reverse(c.diff));
                meta.get(doc).stash.push(c);
                continue;
            }
            break;
        }
    }
    static fastForwardChanges(doc) {
        const { stash, history } = meta.get(doc);
        let change;
        while (change = stash.pop()) {
            patch_1.patch(doc, change.diff);
            history.push(change);
        }
    }
    static applyChanges(doc, changes) {
        meta.get(doc).warning = null;
        const newDoc = AutoPigeon.clone(doc);
        try {
            AutoPigeon.rewindChanges(newDoc, changes.ts, changes.cid);
        }
        catch (e) {
            meta.get(newDoc).warning = 'rewind failed: ' + e;
        }
        try {
            patch_1.patch(newDoc, changes.diff);
        }
        catch (e) {
            meta.get(newDoc).warning = 'patch failed: ' + e;
        }
        try {
            AutoPigeon.fastForwardChanges(newDoc);
        }
        catch (e) {
            meta.get(newDoc).warning = 'forward failed: ' + e;
        }
        const history = meta.get(newDoc).history;
        let idx = history.length;
        while (idx > 0 && history[idx - 1].ts > changes.ts)
            idx--;
        history.splice(idx, 0, changes);
        return newDoc;
    }
    static change(doc, fn) {
        assert_1.default(doc instanceof AutoPigeon);
        assert_1.default(fn instanceof Function);
        const tmp = helpers_1._clone(doc);
        fn(tmp);
        const changes = AutoPigeon.getChanges(doc, tmp);
        return AutoPigeon.applyChanges(doc, changes);
    }
    static getHistory(doc) {
        return meta.get(doc).history;
    }
    static merge(doc1, doc2) {
        let doc = AutoPigeon.from({});
        const history1 = AutoPigeon.getHistory(doc1);
        const history2 = AutoPigeon.getHistory(doc2);
        const changes = [];
        while (history1.length || history2.length) {
            if (!history2.length) {
                changes.push(history1.shift());
            }
            else if (!history1.length) {
                changes.push(history2.shift());
            }
            else if (history1[0].gid === history2[0].gid) {
                changes.push(history1.shift() && history2.shift());
            }
            else if (history1[0].ts < history2[0].ts) {
                changes.push(history1.shift());
            }
            else if (history1[0].ts == history2[0].ts) {
                if (history1[0].seq < history2[0].seq) {
                    changes.push(history1.shift());
                }
                else {
                    changes.push(history2.shift());
                }
            }
            else {
                changes.push(history2.shift());
            }
        }
        for (const c of changes) {
            doc = AutoPigeon.applyChanges(doc, c);
        }
        return doc;
    }
    static getWarning(doc) {
        return meta.get(doc).warning;
    }
    static getMissingDeps() {
        return false;
    }
    static setHistoryLength(len) {
        HISTORY_LENGTH = len;
    }
    static setTimestamp(fn) {
        _ts = fn;
    }
    static crc(doc) {
        return helpers_1._crc(doc);
    }
    static load(str, historyLength = HISTORY_LENGTH) {
        const { meta: _meta, data } = JSON.parse(str);
        _meta.history = _meta.history.slice(-historyLength);
        const doc = AutoPigeon.from(data);
        Object.assign(meta.get(doc), _meta);
        return doc;
    }
    static save(doc) {
        const { cid, ..._meta } = meta.get(doc);
        return JSON.stringify({
            meta: _meta,
            data: doc,
        });
    }
}
exports.AutoPigeon = AutoPigeon;
function _id() {
    return Math.random().toString(36).substring(2);
}
let _ts = function () {
    return Date.now();
};
let seq = 0;
function _seq() {
    return seq++;
}
